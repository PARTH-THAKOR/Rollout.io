import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { controlPlaneApi } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/config';
import { unwrapResponse } from '../../../api/queries';
import { validateFormData, checkFormValid, newRule, MULTI_VALUE_OPERATORS } from './constants';
import ValueInput from './ValueInput';
import TargetingRulesEditor from './TargetingRulesEditor';
import JsonEditor from '../json-flag/JsonEditor';

// ═══════════════════════════════════════════════════════════
//  UpdateFlagModal — Edit Core Flag with full validation
// ═══════════════════════════════════════════════════════════

const UpdateFlagModal = ({ flag, onClose, onSubmit }) => {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Store original fetched data to detect changes
    const [initialData, setInitialData] = useState(null);
    
    const [formData, setFormData] = useState({
        displayName: '', description: '', type: 'BOOLEAN', value: true,
        rolloutPercentage: '', targetingRules: []
    });
    const [jsonContent, setJsonContent] = useState('{}');

    // Fetch latest flag details
    useEffect(() => {
        let cancelled = false;
        const fetchDetails = async () => {
            try {
                const d = await unwrapResponse(
                    await controlPlaneApi(ENDPOINTS.CORE_FLAG_BY_ID(flag.id))
                );
                if (!cancelled) {
                    const flagType = (d.type || flag.type || 'BOOLEAN').toUpperCase();
                    const isJson = flagType === 'JSON';
                    const rawValue = d.value ?? flag.value ?? '';
                    const jsonStr = isJson
                        ? (typeof rawValue === 'object' ? JSON.stringify(rawValue, null, 2) : String(rawValue || '{}'))
                        : '';

                    const data = {
                        key: d.key || flag.key,
                        type: flagType,
                        version: d.version ?? flag.version ?? 1,
                        createdAt: d.createdAt || flag.createdAt,
                        displayName: d.displayName || d.key || flag.name,
                        description: d.description || '',
                        value: isJson ? jsonStr : rawValue,
                        rolloutPercentage: d.rolloutPercentage ?? '',
                        targetingRules: d.targetingRules || []
                    };
                    setInitialData(data);
                    setFormData({
                        displayName: data.displayName,
                        description: data.description,
                        type: data.type,
                        value: isJson ? {} : data.value,
                        rolloutPercentage: data.rolloutPercentage,
                        targetingRules: JSON.parse(JSON.stringify(data.targetingRules)) // Deep copy
                    });
                    if (isJson) setJsonContent(jsonStr);
                }
            } catch (err) {
                console.warn('Failed to fetch flag details for update', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchDetails();
        return () => { cancelled = true; };
    }, [flag.id, flag]);

    // ─── Derived Validation ─────────────────────────────────
    // We reuse validateFormData but ignore 'key' since it's readonly
    const isJsonType = formData.type === 'JSON';

    const formErrors = useMemo(() => {
        const fakeData = { ...formData, key: 'valid_key' };
        if (isJsonType) fakeData.value = 'valid';
        const errors = validateFormData(fakeData);
        delete errors.key;
        if (isJsonType) delete errors.value;
        return errors;
    }, [formData, isJsonType]);

    const jsonValid = useMemo(() => {
        if (!isJsonType) return true;
        try { JSON.parse(jsonContent); return true; }
        catch { return false; }
    }, [isJsonType, jsonContent]);

    const valid = useMemo(() => {
        const base = checkFormValid({ ...formData, key: 'valid_key' }, formErrors);
        if (isJsonType) return base && jsonValid;
        return base;
    }, [formData, formErrors, isJsonType, jsonValid]);

    // Check if anything actually changed
    const hasChanges = useMemo(() => {
        if (!initialData) return false;
        if (formData.displayName !== initialData.displayName) return true;
        if (formData.description !== initialData.description) return true;
        if (isJsonType) {
            if (jsonContent !== initialData.value) return true;
        } else {
            if (formData.value !== initialData.value) return true;
        }
        if (String(formData.rolloutPercentage || '') !== String(initialData.rolloutPercentage || '')) return true;
        
        // Deep compare rules
        const rulesStr = JSON.stringify(formData.targetingRules);
        const initRulesStr = JSON.stringify(initialData.targetingRules);
        if (rulesStr !== initRulesStr) return true;

        return false;
    }, [formData, initialData, isJsonType, jsonContent]);

    // ─── Helpers ────────────────────────────────────────────
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
                if (MULTI_VALUE_OPERATORS.includes(newValue)) {
                    updated.value = '';
                } else {
                    updated.values = [];
                    updated._tempInput = '';
                }
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

    // ─── Submit Handler ─────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!valid || isSubmitting || !hasChanges) return;
        setIsSubmitting(true);

        let resolvedValue;
        if (isJsonType) {
            try { resolvedValue = JSON.parse(jsonContent); }
            catch { setIsSubmitting(false); return; }
        } else if (formData.type === 'BOOLEAN') {
            resolvedValue = formData.value;
        } else if (formData.type === 'INTEGER') {
            resolvedValue = parseInt(formData.value, 10);
        } else if (formData.type === 'DOUBLE') {
            resolvedValue = parseFloat(formData.value);
        } else {
            resolvedValue = String(formData.value);
        }

        const payload = {
            displayName: formData.displayName.trim(),
            description: formData.description.trim(),
            value: resolvedValue
        };

        if (formData.rolloutPercentage !== '' && formData.rolloutPercentage !== null) {
            payload.rolloutPercentage = Number(formData.rolloutPercentage);
        } else {
            payload.rolloutPercentage = null;
        }

        const validRules = formData.targetingRules.filter(r => r.attribute.trim());
        payload.targetingRules = validRules.map(r => {
            const rule = { attribute: r.attribute.trim(), operator: r.operator };
            if (MULTI_VALUE_OPERATORS.includes(r.operator)) { rule.values = r.values || []; }
            else { rule.value = r.value; }
            return rule;
        });

        try {
            const data = await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.CORE_FLAG_BY_ID(flag.id), {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                })
            );
            onSubmit(data); // Return full real backend data
        } catch (err) {
            console.error('Failed to update flag', err);
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content glass-card" style={{ maxWidth: '640px', width: '92%', padding: '30px', textAlign: 'center' }}>
                    <i className="ri-loader-4-line spin" style={{ fontSize: '32px', color: '#c084fc' }}></i>
                    <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Loading flag details...</div>
                </div>
            </div>
        );
    }

    const descLen = formData.description.length;
    const descCountClass = descLen >= 200 ? 'error' : descLen >= 170 ? 'warning' : '';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%', padding: 0, overflow: 'hidden' }}>
                <form onSubmit={handleSubmit}>
                    {/* ── Modal Header ──────────────────── */}
                    <div className="modal-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: '"Outfit", "Inter", sans-serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="ri-edit-2-line" style={{ fontSize: '16px', color: '#a78bfa' }}></i>
                                    </div>
                                    Update Flag
                                </h3>
                                <p style={{ margin: '6px 0 0 42px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <span><strong style={{color: 'rgba(255,255,255,0.6)'}}>Key:</strong> <span className="flag-key-mono" style={{ display: 'inline-block', verticalAlign: 'middle', padding: '1px 4px' }}>{initialData.key}</span></span>
                                    <span><strong style={{color: 'rgba(255,255,255,0.6)'}}>Type:</strong> {initialData.type}</span>
                                    <span><strong style={{color: 'rgba(255,255,255,0.6)'}}>Version:</strong> v{initialData.version}</span>
                                </p>
                            </div>
                            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                                <i className="ri-close-line" style={{ fontSize: '18px' }}></i>
                            </button>
                        </div>
                    </div>

                    {/* ── Modal Body (scrollable) ───────── */}
                    <div className="modal-body">
                        
                        {/* Display Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Display Name <span className="form-required">*</span></label>
                            <input
                                type="text" className={`login-input ${formErrors.displayName ? 'input-error' : ''}`} required
                                value={formData.displayName}
                                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                placeholder="e.g. Dark Mode Enabled"
                                maxLength={50}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                            {formErrors.displayName
                                ? <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.displayName}</div>
                                : formData.displayName.length > 40 && <div className={`char-count ${formData.displayName.length >= 50 ? 'error' : 'warning'}`}>{formData.displayName.length}/50</div>
                            }
                        </div>

                        {/* Value Input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">{isJsonType ? 'JSON Value' : 'Value'} <span className="form-required">*</span></label>
                            {isJsonType ? (
                                <>
                                    <JsonEditor value={jsonContent} onChange={setJsonContent} height="220px" />
                                    {!jsonValid && <div className="field-error"><i className="ri-error-warning-line"></i> Invalid JSON syntax</div>}
                                </>
                            ) : (
                                <>
                                    <ValueInput 
                                        type={formData.type} 
                                        value={formData.value} 
                                        onChange={(v) => setFormData(prev => ({ ...prev, value: v }))} 
                                        error={!!formErrors.value} 
                                    />
                                    {formErrors.value && <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.value}</div>}
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label"><i className="ri-file-text-line" style={{ marginRight: '6px', color: '#38bdf8', fontSize: '13px' }}></i>Description</label>
                            <textarea className={`login-input ${formErrors.description ? 'input-error' : ''}`} value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe the purpose of this flag..."
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
                                    placeholder="0 – 100 (leave empty for 100%)"
                                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }}
                                />
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '13px', pointerEvents: 'none' }}>%</span>
                            </div>
                        </div>

                        {/* ── Targeting Rules ────────────── */}
                        <TargetingRulesEditor 
                            rules={formData.targetingRules}
                            onAddRule={addRule}
                            onRemoveRule={removeRule}
                            onUpdateRule={updateRule}
                            onAddTagToRule={addTagToRule}
                            onRemoveTagFromRule={removeTagFromRule}
                        />

                    </div>

                    {/* ── Modal Footer ──────────────────── */}
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={!valid || isSubmitting || !hasChanges}>
                            {isSubmitting ? (
                                <><i className="ri-loader-4-line spin" style={{ fontSize: '15px' }}></i> Saving...</>
                            ) : (
                                <><i className="ri-check-line" style={{ fontSize: '15px' }}></i> Save Changes</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateFlagModal;
