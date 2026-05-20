import React, { useState, useCallback, useMemo } from 'react';
import {
    FLAG_TYPES, MULTI_VALUE_OPERATORS,
    sanitizeKey, validateFormData, checkFormValid, newRule
} from '../core-flag/constants';
import ValueInput from '../core-flag/ValueInput';
import TargetingRulesEditor from '../core-flag/TargetingRulesEditor';
import JsonEditor from '../json-flag/JsonEditor';
import DependencyRuleBuilder, { emptyGroup, cleanRuleNode, isTreeValid } from './DependencyRuleBuilder';

// ═══════════════════════════════════════════════════════════
//  DependentFlagForm — Create Dependent Flag modal
//  Same as CoreFlag FlagForm but:
//    - NO enabled field (backend defaults false)
//    - NO category field (backend forces DEPENDENT)
//    - When type=JSON → JsonEditor
//    - dependency section is NEW and REQUIRED (tree-based)
// ═══════════════════════════════════════════════════════════

const DependentFlagForm = ({ onClose, onSubmit, isSubmitting, coreFlags = [], existingKeys, serverError = '' }) => {
    const [formData, setFormData] = useState({
        key: '', displayName: '', type: 'BOOLEAN', value: true,
        description: '', rolloutPercentage: '', targetingRules: []
    });
    const [jsonContent, setJsonContent] = useState('{\n  "key": "value"\n}');

    // Dependency state — tree-based (no flat array)
    const [dependencyTree, setDependencyTree] = useState(emptyGroup('AND'));

    // ─── Derived Validation ─────────────────────────────────
    const isJsonType = formData.type === 'JSON';

    const formErrors = useMemo(() => {
        let errors = {};
        if (isJsonType) {
            errors = validateFormData({ ...formData, value: 'valid' });
            delete errors.value;
        } else {
            errors = validateFormData(formData);
        }

        // Fix 1: Check uniqueness in O(1) if existingKeys is provided
        if (!errors.key && existingKeys && existingKeys.has(formData.key)) {
            errors.key = 'A flag with this key already exists.';
        }
        return errors;
    }, [formData, isJsonType, existingKeys]);

    const jsonValid = useMemo(() => {
        if (!isJsonType) return true;
        try { JSON.parse(jsonContent); return true; }
        catch { return false; }
    }, [jsonContent, isJsonType]);

    const depValid = useMemo(() => isTreeValid(dependencyTree), [dependencyTree]);

    const valid = useMemo(() => {
        if (isJsonType) {
            if (!formData.key.trim() || formData.key.trim().length < 3) return false;
            if (!formData.displayName.trim()) return false;
            if (Object.values(formErrors).some(Boolean)) return false;
            if (!jsonValid) return false;
        } else {
            if (!checkFormValid(formData, formErrors)) return false;
        }
        if (!depValid) return false;
        return true;
    }, [formData, formErrors, isJsonType, jsonValid, depValid]);

    // ─── Form Helpers ───────────────────────────────────────
    const handleTypeChange = useCallback((newType) => {
        const defaults = { BOOLEAN: true, STRING: '', INTEGER: 0, DOUBLE: 0.0, JSON: '' };
        setFormData(prev => ({ ...prev, type: newType, value: defaults[newType] ?? '' }));
        if (newType === 'JSON') setJsonContent('{\n  "key": "value"\n}');
    }, []);

    // Targeting Rules handlers (reused from CoreFlag)
    const addRule = useCallback(() => {
        setFormData(prev => ({ ...prev, targetingRules: [...prev.targetingRules, newRule()] }));
    }, []);
    const removeRule = useCallback((index) => {
        setFormData(prev => ({ ...prev, targetingRules: prev.targetingRules.filter((_, i) => i !== index) }));
    }, []);
    const updateRule = useCallback((index, field, newValue) => {
        setFormData(prev => {
            const rules = [...prev.targetingRules];
            const updated = { ...rules[index], [field]: newValue };
            if (field === 'operator') {
                if (MULTI_VALUE_OPERATORS.includes(newValue)) { updated.value = ''; }
                else { updated.values = []; updated._tempInput = ''; }
            }
            rules[index] = updated;
            return { ...prev, targetingRules: rules };
        });
    }, []);
    const addTagToRule = useCallback((index) => {
        setFormData(prev => {
            const rules = [...prev.targetingRules];
            const val = (rules[index]._tempInput || '').trim();
            if (!val) return prev;
            rules[index] = { ...rules[index], values: [...(rules[index].values || []), val], _tempInput: '' };
            return { ...prev, targetingRules: rules };
        });
    }, []);
    const removeTagFromRule = useCallback((ruleIndex, tagIndex) => {
        setFormData(prev => {
            const rules = [...prev.targetingRules];
            rules[ruleIndex] = { ...rules[ruleIndex], values: rules[ruleIndex].values.filter((_, i) => i !== tagIndex) };
            return { ...prev, targetingRules: rules };
        });
    }, []);

    // ─── Submit ─────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!valid || isSubmitting) return;

        let flagValue;
        if (isJsonType) {
            try { flagValue = JSON.parse(jsonContent); }
            catch { return; }
        } else {
            flagValue = formData.type === 'BOOLEAN' ? formData.value
                : formData.type === 'INTEGER' ? parseInt(formData.value, 10)
                    : formData.type === 'DOUBLE' ? parseFloat(formData.value)
                        : String(formData.value);
        }

        const cleanedDependency = cleanRuleNode(dependencyTree);
        if (!cleanedDependency) return; // Safety: should not happen if depValid is true

        const payload = {
            key: formData.key.trim(),
            displayName: formData.displayName.trim(),
            type: formData.type,
            value: flagValue,
            dependency: cleanedDependency,
        };
        // NOTE: No `enabled` and no `category` — backend handles both

        if (formData.description.trim()) payload.description = formData.description.trim();
        if (formData.rolloutPercentage !== '' && formData.rolloutPercentage !== null && formData.rolloutPercentage !== undefined) {
            payload.rolloutPercentage = Number(formData.rolloutPercentage);
        }

        const validRules = formData.targetingRules.filter(r => r.attribute.trim());
        if (validRules.length > 0) {
            payload.targetingRules = validRules.map(r => {
                const rule = { attribute: r.attribute.trim(), operator: r.operator };
                if (MULTI_VALUE_OPERATORS.includes(r.operator)) { rule.values = r.values || []; }
                else { rule.value = r.value; }
                return rule;
            });
        }

        console.log('[DependentFlagForm] Submitting payload:', JSON.stringify(payload, null, 2));
        onSubmit(payload);
    };

    const descLen = formData.description.length;
    const descCountClass = descLen >= 200 ? 'error' : descLen >= 170 ? 'warning' : '';
    const SELECT_ARROW_BG_LOCAL = `rgba(255, 255, 255, 0.05) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 16px top 50%`;
    const OPTION_BG_LOCAL = { background: '#120924' };

    return (
        <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '92%', padding: 0, overflow: 'hidden' }}>
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="modal-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: '"Outfit", "Inter", sans-serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="ri-git-branch-line" style={{ fontSize: '16px', color: '#a78bfa' }}></i>
                                    </div>
                                    New Dependent Flag
                                </h3>
                                <p style={{ margin: '6px 0 0 42px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Create a conditionally-activated flag with prerequisite dependencies</p>
                            </div>
                            <button type="button" onClick={onClose} disabled={isSubmitting} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                                <i className="ri-close-line" style={{ fontSize: '18px' }}></i>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="modal-body">
                        {coreFlags.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <i className="ri-alert-line" style={{ fontSize: '38px', color: '#a78bfa', opacity: 0.8 }}></i>
                                <h4 style={{ margin: '16px 0 8px 0', color: '#fff', fontSize: '18px', fontWeight: 600 }}>No Core Flags Available</h4>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.5 }}>
                                    A Dependent Flag requires at least one prerequisite Core Flag to function.
                                    <br />Please create a Core Flag in this environment first.
                                </p>
                            </div>
                        ) : (
                            <>
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
                                {/* Required Section */}
                                <div className="section-heading">
                                    <span className="section-label">Required</span>
                                    <div className="section-divider"></div>
                                </div>

                                {/* Key */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="form-label">Key <span className="form-required">*</span></label>
                                    <input type="text" className={`login-input ${formErrors.key ? 'input-error' : ''}`} required autoFocus
                                        value={formData.key}
                                        onChange={(e) => setFormData(prev => ({ ...prev, key: sanitizeKey(e.target.value) }))}
                                        placeholder="e.g. premium_checkout_flow"
                                        maxLength={50}
                                        style={{ width: '100%', boxSizing: 'border-box', fontFamily: '"Fira Code", "Cascadia Code", monospace, "Inter"', letterSpacing: '0.3px' }}
                                    />
                                    {formErrors.key
                                        ? <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.key}</div>
                                        : <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>Lowercase letters, numbers, and underscores only (3–50 chars)</div>
                                    }
                                </div>

                                {/* Display Name */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="form-label">Display Name <span className="form-required">*</span></label>
                                    <input type="text" className={`login-input ${formErrors.displayName ? 'input-error' : ''}`} required
                                        value={formData.displayName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                        placeholder="e.g. Premium Checkout Flow"
                                        maxLength={50}
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                    />
                                    {formErrors.displayName
                                        ? <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.displayName}</div>
                                        : formData.displayName.length > 0 && <div className={`char-count ${formData.displayName.length >= 50 ? 'error' : 'warning'}`}>{formData.displayName.length}/50</div>
                                    }
                                </div>

                                {/* Type + Value */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <label className="form-label">Type <span className="form-required">*</span></label>
                                        <select className="login-input" value={formData.type} onChange={(e) => handleTypeChange(e.target.value)}
                                            style={{ width: '100%', boxSizing: 'border-box', appearance: 'none', background: SELECT_ARROW_BG_LOCAL, backgroundSize: '12px auto', cursor: 'pointer' }}>
                                            {FLAG_TYPES.map(t => <option key={t} value={t} style={OPTION_BG_LOCAL}>{t}</option>)}
                                        </select>
                                    </div>
                                    {!isJsonType ? (
                                        <div>
                                            <label className="form-label">Value <span className="form-required">*</span></label>
                                            <ValueInput type={formData.type} value={formData.value}
                                                onChange={(v) => setFormData(prev => ({ ...prev, value: v }))}
                                                error={!!formErrors.value} />
                                            {formErrors.value && <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.value}</div>}
                                        </div>
                                    ) : <div></div>}
                                </div>

                                {/* JSON Editor (shown only when type=JSON) */}
                                {isJsonType && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label className="form-label">JSON Value <span className="form-required">*</span></label>
                                        <JsonEditor value={jsonContent} onChange={setJsonContent} height="180px" />
                                    </div>
                                )}

                                {/* ── Dependency Rules (REQUIRED — Tree-based) ── */}
                                <DependencyRuleBuilder
                                    coreFlags={coreFlags}
                                    ruleNode={dependencyTree}
                                    onRuleNodeChange={setDependencyTree}
                                />

                                {/* Optional Section */}
                                <div className="section-heading">
                                    <span className="section-label">Optional</span>
                                    <div className="section-divider"></div>
                                </div>

                                {/* Description */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="form-label"><i className="ri-file-text-line" style={{ marginRight: '6px', color: '#38bdf8', fontSize: '13px' }}></i>Description</label>
                                    <textarea className={`login-input ${formErrors.description ? 'input-error' : ''}`} value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe when this dependent flag activates..."
                                        maxLength={210}
                                        style={{ width: '100%', boxSizing: 'border-box', minHeight: '72px', resize: 'vertical' }}></textarea>
                                    {formErrors.description
                                        ? <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.description}</div>
                                        : <div className={`char-count ${descCountClass}`}>{descLen}/200</div>
                                    }
                                </div>

                                {/* Rollout Percentage */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="form-label"><i className="ri-pie-chart-2-line" style={{ marginRight: '6px', color: '#f59e0b', fontSize: '13px' }}></i>Rollout Percentage</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" className="login-input" min="0" max="100"
                                            value={formData.rolloutPercentage}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) setFormData(prev => ({ ...prev, rolloutPercentage: v }));
                                            }}
                                            placeholder="0 – 100"
                                            style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }}
                                        />
                                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '13px', pointerEvents: 'none' }}>%</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>Percentage of users who will receive this flag (leave empty for 100%)</div>
                                </div>

                                <TargetingRulesEditor
                                    rules={formData.targetingRules}
                                    onAddRule={addRule}
                                    onRemoveRule={removeRule}
                                    onUpdateRule={updateRule}
                                    onAddTagToRule={addTagToRule}
                                    onRemoveTagFromRule={removeTagFromRule}
                                />
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-ghost" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={!valid || isSubmitting}>
                            {isSubmitting ? (
                                <><i className="ri-loader-4-line spin" style={{ fontSize: '15px' }}></i> Creating...</>
                            ) : (
                                <><i className="ri-check-line" style={{ fontSize: '15px' }}></i> Create Dependent Flag</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DependentFlagForm;
