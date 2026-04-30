import React, { useState, useEffect, useMemo, memo } from 'react';
import { controlPlaneApi } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/config';
import { unwrapResponse } from '../../../api/queries';
import { formatRuleChip, TYPE_BADGE } from './constants';
import JsonViewerModal from '../json-flag/JsonViewerModal';
// ═══════════════════════════════════════════════════════════
//  FlagDetailPanel — Expandable detail row for a single flag
//  Lazily fetches full flag data from /core-flags/{id}
//  Always shows all fields in a consistent enterprise layout
// ═══════════════════════════════════════════════════════════

const DetailField = ({ icon, label, children, span }) => (
    <div className="flag-detail-item" style={span ? { gridColumn: `span ${span}` } : undefined}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {icon && <i className={icon} style={{ fontSize: '12px', opacity: 0.6 }}></i>}
            {label}
        </label>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', lineHeight: 1.5 }}>
            {children}
        </div>
    </div>
);

const FlagDetailPanel = memo(({ flagId, flag, category }) => {
    const isDependent = category === 'DEPENDENT';
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const fetchDetails = async () => {
            try {
                const endpoint = isDependent
                    ? ENDPOINTS.DEPENDENT_FLAG_BY_ID(flagId)
                    : ENDPOINTS.CORE_FLAG_BY_ID(flagId);
                const data = await unwrapResponse(
                    await controlPlaneApi(endpoint)
                );
                if (!cancelled) {
                    setDetails(data);
                }
            } catch (err) {
                console.warn('Failed to fetch flag details', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchDetails();
        return () => { cancelled = true; };
    }, [flagId, isDependent]);

    if (loading) {
        return (
            <tr>
                <td colSpan="6" className="flag-detail-panel" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {[140, 80, 200, 60].map((w, i) => (
                            <div key={i} className="skeleton-cell" style={{ width: `${w}px` }} />
                        ))}
                    </div>
                </td>
            </tr>
        );
    }

    const d = details || {};
    const rules = d.targetingRules || flag.targetingRules || [];
    const description = d.description || flag.description || '';
    const value = d.value ?? flag.value ?? null;
    const version = d.version ?? flag.version ?? null;
    const createdAt = d.createdAt || flag.createdAt || null;
    const rollout = d.rolloutPercentage ?? flag.rolloutPercentage ?? null;
    const type = d.type || flag.type || flag.rawType || '';
    const typeBadgeClass = TYPE_BADGE[type] || TYPE_BADGE[({ BOOLEAN: 'Boolean', STRING: 'String', INTEGER: 'Integer', DOUBLE: 'Double' })[type]] || 'badge-boolean';

    const isJson = typeof value === 'object' && value !== null;

    // Provide truncated preview 
    const jsonPreview = isJson ? JSON.stringify(value).substring(0, 40) + (JSON.stringify(value).length > 40 ? '...' : '') : '';

    return (
        <React.Fragment>
            <tr>
                <td colSpan="6" className="flag-detail-panel" style={{ padding: '24px 28px' }}>
                    {/* ── Header: Key + Type ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.3)' }}>
                            <i className="ri-information-line" style={{ marginRight: '4px' }}></i>
                            Flag Details
                        </span>
                        <span style={{ marginLeft: 'auto' }}>
                            <span className={typeBadgeClass} style={{ fontSize: '11px' }}>{type}</span>
                        </span>
                        {version != null && (
                            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.3px' }}>
                                v{version}
                            </span>
                        )}
                    </div>

                    {/* ── Detail Grid ── */}
                    <div className="flag-detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px 28px' }}>
                        {/* Description — full width */}
                        <DetailField icon="ri-file-text-line" label="Description" span={3}>
                            {description ? (
                                <span style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>{description}</span>
                            ) : (
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>No description provided</span>
                            )}
                        </DetailField>

                        {/* Value */}
                        <DetailField icon="ri-code-s-slash-line" label="Value">
                            {value != null ? (
                                isJson ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <code className="value-code" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                                            {jsonPreview}
                                        </code>
                                        <button
                                            onClick={() => setIsJsonModalOpen(true)}
                                            style={{
                                                background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px',
                                                cursor: 'pointer', padding: '0', textDecoration: 'underline', fontWeight: 500, flexShrink: 0
                                            }}
                                        >
                                            [View]
                                        </button>
                                    </div>
                                ) : (
                                    <code className="value-code" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                                        {String(value)}
                                    </code>
                                )
                            ) : (
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}></span>
                            )}
                        </DetailField>

                        {/* Rollout */}
                        <DetailField icon="ri-pie-chart-line" label="Rollout">
                            {rollout != null ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 600, color: rollout === 100 ? 'rgba(255,255,255,0.5)' : '#38bdf8', fontSize: '14px' }}>
                                        {rollout}%
                                    </span>
                                    <div style={{ flex: 1, maxWidth: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{ width: `${rollout}%`, height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, #38bdf8, #9333ea)', transition: 'width 0.3s' }}></div>
                                    </div>
                                </div>
                            ) : (
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}></span>
                            )}
                        </DetailField>

                        {/* Created At */}
                        <DetailField icon="ri-calendar-line" label="Created">
                            {createdAt ? (
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                                    {new Date(createdAt).toLocaleString()}
                                </span>
                            ) : (
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}></span>
                            )}
                        </DetailField>
                    </div>

                    {/* ── Targeting Rules ── */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '10px' }}>
                            <i className="ri-filter-3-line" style={{ fontSize: '13px' }}></i>
                            Targeting Rules
                        </label>
                        {rules.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {rules.map((rule, i) => (
                                    <span key={i} className="rule-chip">{formatRuleChip(rule)}</span>
                                ))}
                            </div>
                        ) : (
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>No targeting rules configured</span>
                        )}
                    </div>
                </td>
            </tr>
            <JsonViewerModal
                isOpen={isJsonModalOpen}
                onClose={() => setIsJsonModalOpen(false)}
                jsonContent={isJson ? JSON.stringify(value, null, 2) : ''}
                title={`JSON Value: ${flag.key}`}
            />
        </React.Fragment>
    );
});
FlagDetailPanel.displayName = 'FlagDetailPanel';

export default FlagDetailPanel;
