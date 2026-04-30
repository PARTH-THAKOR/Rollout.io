import React, { memo } from 'react';
import { OPERATORS, MULTI_VALUE_OPERATORS, SELECT_ARROW_BG, OPTION_BG } from './constants';

const TargetingRulesEditor = memo(({ rules, onAddRule, onRemoveRule, onUpdateRule, onAddTagToRule, onRemoveTagFromRule }) => {
    return (
        <>
            <div className="section-heading">
                <span className="section-label"><i className="ri-filter-3-line" style={{ marginRight: '4px', verticalAlign: 'middle' }}></i>Targeting Rules</span>
                <div className="section-divider"></div>
                <button type="button" onClick={onAddRule} style={{
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px',
                    background: 'rgba(168, 85, 247, 0.08)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}>
                    <i className="ri-add-line" style={{ fontSize: '14px' }}></i> Add Rule
                </button>
            </div>

            {rules.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                    <i className="ri-crosshair-2-line" style={{ display: 'block', fontSize: '24px', marginBottom: '8px', opacity: 0.4 }}></i>
                    No targeting rules. Flag will apply to all users.
                </div>
            )}

            {rules.map((rule, rIndex) => (
                <div key={rIndex} style={{ padding: '16px', marginBottom: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                    {/* Rule header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="ri-git-branch-line" style={{ color: '#c084fc' }}></i>
                            Rule {rIndex + 1}
                        </span>
                        <button type="button" onClick={() => onRemoveRule(rIndex)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.6)', fontSize: '16px', padding: '2px', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}>
                            <i className="ri-delete-bin-6-line"></i>
                        </button>
                    </div>

                    {/* Row: Attribute + Operator */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label className="form-label" style={{ fontSize: '11px', marginBottom: '5px' }}>Attribute</label>
                            <input type="text" className="login-input" value={rule.attribute} onChange={(e) => onUpdateRule(rIndex, 'attribute', e.target.value)} placeholder="e.g. country, userId" style={{ width: '100%', boxSizing: 'border-box', fontSize: '13px', padding: '9px 12px' }} />
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '11px', marginBottom: '5px' }}>Operator</label>
                            <select className="login-input" value={rule.operator} onChange={(e) => onUpdateRule(rIndex, 'operator', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', appearance: 'none', background: SELECT_ARROW_BG, backgroundSize: '10px auto', fontSize: '13px', padding: '9px 12px', cursor: 'pointer' }}>
                                {OPERATORS.map(op => <option key={op} value={op} style={OPTION_BG}>{op}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Value(s) based on operator */}
                    <div>
                        <label className="form-label" style={{ fontSize: '11px', marginBottom: '5px' }}>
                            {MULTI_VALUE_OPERATORS.includes(rule.operator) ? 'Values' : 'Value'}
                        </label>
                        {MULTI_VALUE_OPERATORS.includes(rule.operator) ? (
                            <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', minHeight: '40px', alignItems: 'center' }}>
                                    {(rule.values || []).map((v, vi) => (
                                        <span key={vi} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px', fontSize: '12px', color: '#38bdf8', fontWeight: 500 }}>
                                            {v}
                                            <i className="ri-close-line" onClick={() => onRemoveTagFromRule(rIndex, vi)} style={{ cursor: 'pointer', fontSize: '12px', opacity: 0.7, marginLeft: '2px' }}></i>
                                        </span>
                                    ))}
                                    <input type="text" value={rule._tempInput || ''} onChange={(e) => onUpdateRule(rIndex, '_tempInput', e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddTagToRule(rIndex); } }}
                                        placeholder={rule.values?.length > 0 ? 'Add more...' : 'Type value & press Enter'}
                                        style={{ flex: 1, minWidth: '110px', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', padding: '4px 0', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Press Enter to add each value</div>
                            </div>
                        ) : (
                            <input type="text" className="login-input" value={rule.value} onChange={(e) => onUpdateRule(rIndex, 'value', e.target.value)} placeholder="e.g. US, premium, true" style={{ width: '100%', boxSizing: 'border-box', fontSize: '13px', padding: '9px 12px' }} />
                        )}
                    </div>
                </div>
            ))}
        </>
    );
});

TargetingRulesEditor.displayName = 'TargetingRulesEditor';

export default TargetingRulesEditor;
