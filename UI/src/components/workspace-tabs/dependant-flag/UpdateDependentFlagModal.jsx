import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { controlPlaneApi } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/config';
import { unwrapResponse } from '../../../api/queries';
import { validateFormData, newRule, MULTI_VALUE_OPERATORS } from '../core-flag/constants';
import TargetingRulesEditor from '../core-flag/TargetingRulesEditor';
import ValueInput from '../core-flag/ValueInput';
import JsonEditor from '../json-flag/JsonEditor';
import DependencyRuleBuilder, { emptyGroup, cleanRuleNode, isTreeValid } from './DependencyRuleBuilder';

// ═══════════════════════════════════════════════════════════
//  UpdateDependentFlagModal — Edit a dependent flag
//  Fetches latest via DEPENDENT_FLAG_BY_ID GET, patches via PATCH.
//  Includes tree-based dependency editor, rollout, targeting rules.
// ═══════════════════════════════════════════════════════════

/**
 * Normalize dependency from backend into a valid tree.
 * If it's a raw condition, wrap it in an AND group.
 */
const normalizeRuleNode = (dep) => {
    if (!dep) return emptyGroup('AND');

    // Already a proper group
    if (dep.operator && dep.children) return dep;

    // Single condition → wrap in AND group
    if (dep.condition) {
        return { operator: 'AND', children: [dep] };
    }

    return emptyGroup('AND');
};

const UpdateDependentFlagModal = ({ flag, onClose, onSubmit, coreFlags = [] }) => {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [serverError, setServerError] = useState('');

    const [formData, setFormData] = useState({ displayName: '', description: '', rolloutPercentage: '', targetingRules: [] });
    const [value, setValue] = useState('');
    const [jsonContent, setJsonContent] = useState('{}');
    const [dependencyTree, setDependencyTree] = useState(emptyGroup('AND'));
    const [initialTreeSnapshot, setInitialTreeSnapshot] = useState('');
    const [flagType, setFlagType] = useState('BOOLEAN');

    // Fetch latest flag data
    useEffect(() => {
        let cancelled = false;
        const fetchDetails = async () => {
            try {
                const d = await unwrapResponse(
                    await controlPlaneApi(ENDPOINTS.DEPENDENT_FLAG_BY_ID(flag.id))
                );
                if (!cancelled) {
                    const type = (d.type || 'BOOLEAN').toUpperCase();
                    const isJson = type === 'JSON';
                    const valStr = isJson && typeof d.value === 'object' ? JSON.stringify(d.value, null, 2) : String(d.value ?? '');

                    const tree = normalizeRuleNode(d.dependency);

                    const data = {
                        key: d.key || flag.key,
                        type,
                        version: d.version ?? 1,
                        displayName: d.displayName || d.key,
                        description: d.description || '',
                        value: isJson ? valStr : d.value,
                        rolloutPercentage: d.rolloutPercentage ?? '',
                        targetingRules: d.targetingRules || [],
                        dependency: d.dependency,
                    };

                    setInitialData(data);
                    setFlagType(type);
                    setFormData({ displayName: data.displayName, description: data.description, rolloutPercentage: data.rolloutPercentage, targetingRules: JSON.parse(JSON.stringify(data.targetingRules)) });
                    if (isJson) setJsonContent(valStr); else setValue(d.value);
                    setDependencyTree(tree);
                    setInitialTreeSnapshot(JSON.stringify(tree));
                }
            } catch (err) {
                console.warn('Failed to fetch dependent flag details', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchDetails();
        return () => { cancelled = true; };
    }, [flag.id, flag]);

    const isJsonType = flagType === 'JSON';

    // Validation
    const formErrors = useMemo(() => {
        const errors = validateFormData({ ...formData, key: 'valid_key', type: 'STRING', value: 'valid' });
        delete errors.key; delete errors.value;
        return errors;
    }, [formData]);

    const jsonValid = useMemo(() => { if (!isJsonType) return true; try { JSON.parse(jsonContent); return true; } catch { return false; } }, [jsonContent, isJsonType]);

    const depValid = useMemo(() => isTreeValid(dependencyTree), [dependencyTree]);

    const valid = useMemo(() => {
        if (!formData.displayName.trim()) return false;
        if (Object.values(formErrors).some(Boolean)) return false;
        if (isJsonType && !jsonValid) return false;
        if (!depValid) return false;
        return true;
    }, [formData, formErrors, isJsonType, jsonValid, depValid]);

    const hasChanges = useMemo(() => {
        if (!initialData) return false;
        if (formData.displayName !== initialData.displayName) return true;
        if (formData.description !== initialData.description) return true;
        if (String(formData.rolloutPercentage || '') !== String(initialData.rolloutPercentage || '')) return true;
        if (isJsonType && jsonContent !== initialData.value) return true;
        if (!isJsonType && String(value) !== String(initialData.value)) return true;
        if (JSON.stringify(formData.targetingRules) !== JSON.stringify(initialData.targetingRules)) return true;
        if (JSON.stringify(dependencyTree) !== initialTreeSnapshot) return true;
        return false;
    }, [formData, jsonContent, value, dependencyTree, initialTreeSnapshot, initialData, isJsonType]);

    // Targeting Rules handlers
    const addRule = useCallback(() => setFormData(prev => ({ ...prev, targetingRules: [...prev.targetingRules, newRule()] })), []);
    const removeRule = useCallback((i) => setFormData(prev => ({ ...prev, targetingRules: prev.targetingRules.filter((_, idx) => idx !== i) })), []);
    const updateRule = useCallback((i, field, val) => {
        setFormData(prev => {
            const rules = [...prev.targetingRules]; const u = { ...rules[i], [field]: val };
            if (field === 'operator') { if (MULTI_VALUE_OPERATORS.includes(val)) { u.value = ''; } else { u.values = []; u._tempInput = ''; } }
            rules[i] = u; return { ...prev, targetingRules: rules };
        });
    }, []);
    const addTagToRule = useCallback((i) => {
        setFormData(prev => {
            const rules = [...prev.targetingRules]; const v = (rules[i]._tempInput || '').trim(); if (!v) return prev;
            rules[i] = { ...rules[i], values: [...(rules[i].values || []), v], _tempInput: '' }; return { ...prev, targetingRules: rules };
        });
    }, []);
    const removeTagFromRule = useCallback((ri, ti) => {
        setFormData(prev => {
            const rules = [...prev.targetingRules]; rules[ri] = { ...rules[ri], values: rules[ri].values.filter((_, idx) => idx !== ti) };
            return { ...prev, targetingRules: rules };
        });
    }, []);

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!valid || isSubmitting || !hasChanges) return;
        setIsSubmitting(true);

        const payload = { displayName: formData.displayName.trim(), description: formData.description.trim() };

        if (isJsonType) {
            try { payload.value = JSON.parse(jsonContent); } catch { setIsSubmitting(false); return; }
        } else if (!isJsonType && String(value) !== String(initialData?.value)) {
            payload.value = flagType === 'BOOLEAN' ? value : flagType === 'INTEGER' ? parseInt(value, 10) : flagType === 'DOUBLE' ? parseFloat(value) : String(value);
        }

        if (formData.rolloutPercentage !== '' && formData.rolloutPercentage !== null) payload.rolloutPercentage = Number(formData.rolloutPercentage);
        else payload.rolloutPercentage = null;

        const validRules = formData.targetingRules.filter(r => r.attribute?.trim());
        payload.targetingRules = validRules.map(r => {
            const rule = { attribute: r.attribute.trim(), operator: r.operator };
            if (MULTI_VALUE_OPERATORS.includes(r.operator)) rule.values = r.values || []; else rule.value = r.value;
            return rule;
        });

        payload.dependency = cleanRuleNode(dependencyTree);

        setServerError('');
        try {
            const data = await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.DEPENDENT_FLAG_BY_ID(flag.id), { method: 'PATCH', body: JSON.stringify(payload) })
            );
            onSubmit(data);
        } catch (err) {
            console.error('Failed to update dependent flag', err);
            setServerError(err.message || 'Failed to update dependent flag. Please check your inputs and try again.');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content glass-card" style={{ maxWidth: '700px', width: '92%', padding: '30px', textAlign: 'center' }}>
                    <i className="ri-loader-4-line spin" style={{ fontSize: '32px', color: '#f59e0b' }}></i>
                    <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Loading flag details...</div>
                </div>
            </div>
        );
    }

    const descLen = formData.description.length;
    const descCountClass = descLen >= 200 ? 'error' : descLen >= 170 ? 'warning' : '';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '92%', padding: 0, overflow: 'hidden' }}>
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="modal-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: '"Outfit", "Inter", sans-serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(245,158,11,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="ri-edit-2-line" style={{ fontSize: '16px', color: '#f59e0b' }}></i>
                                    </div>
                                    Update Dependent Flag
                                </h3>
                                <p style={{ margin: '6px 0 0 42px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                                    <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Key:</strong> <span className="flag-key-mono" style={{ padding: '1px 4px' }}>{initialData?.key}</span>
                                    &nbsp;&nbsp;<strong style={{ color: 'rgba(255,255,255,0.6)' }}>v</strong>{initialData?.version}
                                </p>
                            </div>
                            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="ri-close-line" style={{ fontSize: '18px' }}></i>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="modal-body">
                        {/* Server Error Banner */}
                        {serverError && (
                            <div style={{
                                padding: '12px 16px', marginBottom: '16px', borderRadius: '8px',
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeIn 0.2s ease-out'
                            }}>
                                <i className="ri-error-warning-fill" style={{ color: '#f87171', fontSize: '16px', flexShrink: 0, marginTop: '1px' }}></i>
                                <div style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.5, wordBreak: 'break-word' }}>{serverError}</div>
                            </div>
                        )}

                        {/* Display Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Display Name <span className="form-required">*</span></label>
                            <input type="text" className={`login-input ${formErrors.displayName ? 'input-error' : ''}`} required
                                value={formData.displayName} onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                maxLength={50} style={{ width: '100%', boxSizing: 'border-box' }} />
                            {formErrors.displayName && <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.displayName}</div>}
                        </div>

                        {/* Value */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Value ({flagType}) <span className="form-required">*</span></label>
                            {isJsonType
                                ? <JsonEditor value={jsonContent} onChange={setJsonContent} height="180px" />
                                : <ValueInput type={flagType} value={value} onChange={setValue} />
                            }
                        </div>

                        {/* Dependency Rules (Tree-based) */}
                        <DependencyRuleBuilder
                            coreFlags={coreFlags}
                            ruleNode={dependencyTree}
                            onRuleNodeChange={setDependencyTree}
                        />

                        {/* Description */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label"><i className="ri-file-text-line" style={{ marginRight: '6px', color: '#38bdf8', fontSize: '13px' }}></i>Description</label>
                            <textarea className={`login-input ${formErrors.description ? 'input-error' : ''}`} value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                maxLength={210} style={{ width: '100%', boxSizing: 'border-box', minHeight: '72px', resize: 'vertical' }}></textarea>
                            {formErrors.description
                                ? <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.description}</div>
                                : <div className={`char-count ${descCountClass}`}>{descLen}/200</div>
                            }
                        </div>

                        {/* Rollout */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label"><i className="ri-pie-chart-2-line" style={{ marginRight: '6px', color: '#f59e0b', fontSize: '13px' }}></i>Rollout Percentage</label>
                            <div style={{ position: 'relative' }}>
                                <input type="number" className="login-input" min="0" max="100" value={formData.rolloutPercentage}
                                    onChange={(e) => { const v = e.target.value; if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) setFormData(prev => ({ ...prev, rolloutPercentage: v })); }}
                                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }} />
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '13px', pointerEvents: 'none' }}>%</span>
                            </div>
                        </div>

                        {/* Targeting Rules */}
                        <TargetingRulesEditor rules={formData.targetingRules} onAddRule={addRule} onRemoveRule={removeRule}
                            onUpdateRule={updateRule} onAddTagToRule={addTagToRule} onRemoveTagFromRule={removeTagFromRule} />
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={!valid || isSubmitting || !hasChanges}>
                            {isSubmitting ? (<><i className="ri-loader-4-line spin" style={{ fontSize: '15px' }}></i> Saving...</>) : (<><i className="ri-check-line" style={{ fontSize: '15px' }}></i> Save Changes</>)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateDependentFlagModal;
