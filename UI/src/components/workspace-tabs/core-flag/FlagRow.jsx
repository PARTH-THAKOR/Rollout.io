import React, { memo } from 'react';
import FlagDetailPanel from './FlagDetailPanel';
import { TYPE_BADGE, timeAgo } from './constants';

// ═══════════════════════════════════════════════════════════
//  FlagRow — Memoized table row for a single core flag
//  Renders: name/key, type badge, rollout bar, toggle, time, actions
//  Conditionally renders FlagDetailPanel when expanded
// ═══════════════════════════════════════════════════════════

const FlagRow = memo(({ flag, isExpanded, onToggle, onExpand, onMenuOpen, category, coreFlagsMap }) => {
    const isDependent = category === 'DEPENDENT';
    const isActive = flag.status ?? flag.enabled ?? false;
    return (
    <React.Fragment>
        <tr
            style={{ borderBottom: isExpanded ? 'none' : undefined, transition: 'background 0.2s', cursor: 'pointer' }}
            className="hover-row"
            onClick={onExpand}
        >
            {/* Flag Name Cell — clickable to expand */}
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isDependent ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(147,51,234,0.12))' }}>
                            <i className="ri-git-branch-line" style={{ fontSize: '16px', color: '#a78bfa' }}></i>
                        </div>
                    ) : (
                        <div className={`flag-icon-box ${isActive ? 'active' : 'inactive'}`}>
                            <i className={isActive ? 'ri-flag-2-fill' : 'ri-flag-2-line'}></i>
                        </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div style={{ color: '#fff', fontWeight: 500, fontSize: '14px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{flag.displayName || flag.name}</span>
                            <i className={`ri-arrow-down-s-line expand-chevron ${isExpanded ? 'expanded' : ''}`} style={{ flexShrink: 0 }}></i>
                        </div>
                        <div className="flag-key-mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{flag.key}</div>
                    </div>
                </div>
            </td>

            {/* Type Badge */}
            <td>
                <span className={TYPE_BADGE[flag.type] || 'badge-boolean'}>{flag.type}</span>
            </td>

            {/* Rollout Percentage */}
            <td>
                {flag.rolloutPercentage == null ? (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}></span>
                ) : (
                    <div>
                        <span style={{ fontSize: '13px', color: flag.rolloutPercentage === 100 ? 'rgba(255,255,255,0.5)' : '#fff', fontWeight: flag.rolloutPercentage < 100 ? 600 : 400 }}>
                            {flag.rolloutPercentage}%
                        </span>
                        <div className="rollout-bar">
                            <div className="rollout-bar-fill" style={{ width: `${flag.rolloutPercentage}%` }}></div>
                        </div>
                    </div>
                )}
            </td>

            {/* Toggle Switch */}
            <td>
                <label className="switch" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={isActive} onChange={onToggle} />
                    <span className="slider round"></span>
                </label>
            </td>

            {/* Updated Time */}
            <td>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }} title={flag.date}>
                    {timeAgo(flag.updatedAt)}
                </span>
            </td>

            {/* Actions */}
            <td style={{ textAlign: 'right' }}>
                <button
                    className="icon-btn"
                    onClick={(e) => { e.stopPropagation(); onMenuOpen(e); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                    aria-haspopup="true"
                >
                    <i className="ri-more-2-fill" style={{ fontSize: '18px' }}></i>
                </button>
            </td>
        </tr>

        {/* Expandable Detail Panel */}
        {isExpanded && <FlagDetailPanel flagId={flag.id} flag={flag} category={category} />}
    </React.Fragment>
    );
});
FlagRow.displayName = 'FlagRow';

export default FlagRow;
