import React, { useState, useCallback, useMemo } from 'react';
import {
    FLAG_TYPES, OPERATORS, MULTI_VALUE_OPERATORS,
    INITIAL_FORM_STATE, newRule,
    SELECT_ARROW_BG, OPTION_BG,
    sanitizeKey, validateFormData, checkFormValid
} from './constants';
import ValueInput from './ValueInput';
import TargetingRulesEditor from './TargetingRulesEditor';
import JsonEditor from '../json-flag/JsonEditor';

// ═══════════════════════════════════════════════════════════
//  FlagForm — Create Core Flag modal with inline validation
//  Owns its own form state; calls onSubmit(payload) on submit.
// ═══════════════════════════════════════════════════════════

const FlagForm = ({ onClose, onSubmit, isSubmitting, defaultType, existingKeys, serverError = '' }) => {
    const initialType = defaultType || INITIAL_FORM_STATE.type;
    const defaults = { BOOLEAN: true, STRING: '', INTEGER: 0, DOUBLE: 0.0, JSON: {} };
    const [formData, setFormData] = useState({ ...INITIAL_FORM_STATE, type: initialType, value: defaults[initialType] ?? '', targetingRules: [] });
    const [jsonContent, setJsonContent] = useState('{\n  "key": "value"\n}');

    // ─── Derived Validation (no useEffect, pure computation) ─
    const formErrors = useMemo(() => {
        let errors = {};
        if (formData.type === 'JSON') {
            // Bypass value validation for JSON — handled by jsonValid
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
    }, [formData, existingKeys]);

    const jsonValid = useMemo(() => {
        if (formData.type !== 'JSON') return true;
        try { JSON.parse(jsonContent); return true; }
        catch { return false; }
    }, [formData.type, jsonContent]);

    const valid = useMemo(() => {
        const baseValid = checkFormValid(formData, formErrors);
        if (formData.type === 'JSON') return baseValid && jsonValid;
        return baseValid;
    }, [formData, formErrors, jsonValid]);

    // ─── Form Helpers ───────────────────────────────────────
    const handleTypeChange = useCallback((newType) => {
        const defaults = { BOOLEAN: true, STRING: '', INTEGER: 0, DOUBLE: 0.0, JSON: {} };
        setFormData(prev => ({ ...prev, type: newType, value: defaults[newType] ?? '' }));
    }, []);

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
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!valid || isSubmitting) return;

        let resolvedValue;
        if (formData.type === 'JSON') {
            try { resolvedValue = JSON.parse(jsonContent); }
            catch { return; }
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
            key: formData.key.trim(),
            displayName: formData.displayName.trim(),
            type: formData.type,
            value: resolvedValue,
        };

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

        onSubmit(payload);
    };

    // ─── Character counter helper ───────────────────────────
    const descLen = formData.description.length;
    const descCountClass = descLen >= 200 ? 'error' : descLen >= 170 ? 'warning' : '';

    return (
        <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%', padding: 0, overflow: 'hidden' }}>
                <form onSubmit={handleSubmit}>
                    {/* ── Modal Header ──────────────────── */}
                    <div className="modal-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: '"Outfit", "Inter", sans-serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: defaultType === 'JSON' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)' : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className={defaultType === 'JSON' ? 'ri-braces-line' : 'ri-flag-2-fill'} style={{ fontSize: '16px', color: defaultType === 'JSON' ? '#38bdf8' : '#a78bfa' }}></i>
                                    </div>
                                    {defaultType === 'JSON' ? 'New JSON Flag' : 'New Core Flag'}
                                </h3>
                                <p style={{ margin: '6px 0 0 42px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{defaultType === 'JSON' ? 'Create a new JSON configuration flag for this environment' : 'Create a new core feature flag for this environment'}</p>
                            </div>
                            <button type="button" onClick={onClose} disabled={isSubmitting} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                                <i className="ri-close-line" style={{ fontSize: '18px' }}></i>
                            </button>
                        </div>
                    </div>

                    {/* ── Modal Body (scrollable) ───────── */}
                    <div className="modal-body">
                        {serverError && (
                            <div style={{
                                padding: '12px 16px', marginBottom: '16px', borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeIn 0.2s ease-out'
                            }}>
                                <i className="ri-error-warning-fill" style={{ color: '#f87171', fontSize: '16px', flexShrink: 0, marginTop: '1px' }}></i>
                                <div style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.5, wordBreak: 'break-word', textAlign: 'left' }}>{serverError}</div>
                            </div>
                        )}

                        {/* ── Required Fields ────────────── */}
                        <div className="section-heading">
                            <span className="section-label">Required</span>
                            <div className="section-divider"></div>
                        </div>

                        {/* Key */}
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Key <span className="form-required">*</span></label>
                            <input
                                type="text" className={`login-input ${formErrors.key ? 'input-error' : ''}`} required autoFocus
                                value={formData.key}
                                onChange={(e) => setFormData(prev => ({ ...prev, key: sanitizeKey(e.target.value) }))}
                                placeholder="e.g. dark_mode_enabled"
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
                                : formData.displayName.length > 0 && <div className={`char-count ${formData.displayName.length >= 50 ? 'error' : 'warning'}`}>{formData.displayName.length}/50</div>
                            }
                        </div>

                        {/* Type + Value */}
                        <div style={{ display: 'grid', gridTemplateColumns: formData.type === 'JSON' ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label className="form-label">Type <span className="form-required">*</span></label>
                                <select className="login-input" value={formData.type} onChange={(e) => handleTypeChange(e.target.value)}
                                    disabled={defaultType === 'JSON'}
                                    style={{ 
                                        width: '100%', boxSizing: 'border-box', appearance: 'none', 
                                        background: defaultType === 'JSON' ? 'rgba(255,255,255,0.02)' : SELECT_ARROW_BG, 
                                        backgroundSize: '12px auto', 
                                        cursor: defaultType === 'JSON' ? 'not-allowed' : 'pointer',
                                        color: defaultType === 'JSON' ? 'rgba(255,255,255,0.5)' : '#fff'
                                    }}>
                                    {(defaultType === 'JSON' ? ['JSON'] : FLAG_TYPES.filter(t => t !== 'JSON')).map(t => <option key={t} value={t} style={OPTION_BG}>{t}</option>)}
                                </select>
                            </div>
                            {formData.type === 'JSON' ? (
                                <div>
                                    <label className="form-label">JSON Value <span className="form-required">*</span></label>
                                    <JsonEditor value={jsonContent} onChange={setJsonContent} height="200px" />
                                    {!jsonValid && <div className="field-error"><i className="ri-error-warning-line"></i> Invalid JSON syntax</div>}
                                </div>
                            ) : (
                                <div>
                                    <label className="form-label">Value <span className="form-required">*</span></label>
                                    <ValueInput 
                                        type={formData.type} 
                                        value={formData.value} 
                                        onChange={(v) => setFormData(prev => ({ ...prev, value: v }))} 
                                        error={!!formErrors.value} 
                                    />
                                    {formErrors.value && <div className="field-error"><i className="ri-error-warning-line"></i>{formErrors.value}</div>}
                                </div>
                            )}
                        </div>

                        {/* ── Optional Fields ────────────── */}
                        <div className="section-heading">
                            <span className="section-label">Optional</span>
                            <div className="section-divider"></div>
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
                                        if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) {
                                            setFormData(prev => ({ ...prev, rolloutPercentage: v }));
                                        }
                                    }}
                                    placeholder="0 – 100"
                                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }}
                                />
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '13px', pointerEvents: 'none' }}>%</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>Percentage of users who will receive this flag (leave empty for 100%)</div>
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
                        <button type="submit" className="btn-primary" disabled={!valid || isSubmitting}>
                            {isSubmitting ? (
                                <><i className="ri-loader-4-line spin" style={{ fontSize: '15px' }}></i> Creating...</>
                            ) : (
                                <><i className="ri-check-line" style={{ fontSize: '15px' }}></i> Create Flag</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FlagForm;
