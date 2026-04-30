import React, { memo, useMemo, useState } from 'react';
import { timeAgo, TYPE_BADGE, OP_SYMBOLS, formatRuleChip } from '../core-flag/constants';
import JsonViewerModal from '../json-flag/JsonViewerModal';

// ═══════════════════════════════════════════════════════════
//  DependentFlagRow — Memoized table row for a dependent flag
//  Shows: name, key, type, value, dependency info (∧/∨),
//  targeting rules, rollout, status toggle, actions
// ═══════════════════════════════════════════════════════════

/**
 * Recursively extracts a human-readable summary from a RuleNode.
 */
const formatDependency = (dep, coreFlagsMap) => {
    if (!dep) return null;

    if (dep.condition) {
        const flag = coreFlagsMap[dep.condition.flagId];
        const name = flag ? (flag.displayName || flag.key) : dep.condition.flagId;
        const val = typeof dep.condition.expectedValue === 'boolean'
            ? (dep.condition.expectedValue ? 'true' : 'false')
            : String(dep.condition.expectedValue ?? '');
        return { text: `${name} = ${val}`, type: 'leaf' };
    }

    if (dep.operator && dep.children) {
        const kids = dep.children.map(c => formatDependency(c, coreFlagsMap)).filter(Boolean);
        return { operator: dep.operator, children: kids, type: 'group' };
    }

    return null;
};

const DependencyChips = ({ dep, coreFlagsMap }) => {
    const parsed = useMemo(() => formatDependency(dep, coreFlagsMap), [dep, coreFlagsMap]);
    if (!parsed) return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>No rules</span>;

    if (parsed.type === 'leaf') {
        return (
            <span style={{ fontSize: '11px', background: 'rgba(56,189,248,0.08)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontFamily: '"Fira Code", monospace', display: 'inline-block' }}>
                {parsed.text}
            </span>
        );
    }

    if (parsed.type === 'group') {
        const symbol = parsed.operator === 'AND' ? '∧' : '∨';
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                {parsed.children.map((child, i) => (
                    <React.Fragment key={i}>
                        <span style={{ fontSize: '11px', background: 'rgba(56,189,248,0.08)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontFamily: '"Fira Code", monospace' }}>
                            {child.text || '...'}
                        </span>
                        {i < parsed.children.length - 1 && (
                            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, fontFamily: '"Fira Code", monospace' }}>{symbol}</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    }
    return null;
};

const DependentFlagRow = memo(({ flag, coreFlagsMap, onToggle, onMenuOpen }) => {
    const typeName = flag.type || 'Boolean';
    const badgeClass = TYPE_BADGE[typeName] || 'badge-boolean';

    const isJson = typeof flag.value === 'object' && flag.value !== null;
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

    // Format value for display
    const displayValue = useMemo(() => {
        if (flag.value === null || flag.value === undefined) return '';
        if (isJson) {
            const str = JSON.stringify(flag.value);
            return str.substring(0, 30) + (str.length > 30 ? '...' : '');
        }
        return String(flag.value).substring(0, 30) + (String(flag.value).length > 30 ? '...' : '');
    }, [flag.value, isJson]);

    return (
        <React.Fragment>
            <tr className="flag-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                {/* Flag Name + Key */}
                <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(245,158,11,0.12) 100%)',
                        }}>
                            <i className="ri-git-branch-line" style={{ fontSize: '16px', color: '#f59e0b' }}></i>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {flag.displayName || flag.key}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                <code className="flag-key-mono" style={{ fontSize: '11px', padding: '1px 5px' }}>{flag.key}</code>
                                {flag.description && (
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px', display: 'inline-block' }}>
                                        {flag.description}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </td>

                {/* Type */}
                <td style={{ padding: '16px 24px' }}>
                    <span className={`flag-type-badge ${badgeClass}`}>{typeName}</span>
                </td>

                {/* Value */}
                <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: '"Fira Code", monospace' }}>
                            {displayValue}
                        </span>
                        {isJson && (
                            <button
                                onClick={() => setIsJsonModalOpen(true)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px',
                                    cursor: 'pointer', padding: '0', textDecoration: 'underline', fontWeight: 500
                                }}
                            >
                                [View]
                            </button>
                        )}
                    </div>
                </td>

                {/* Dependency Info */}
                <td style={{ padding: '16px 24px' }}>
                    <DependencyChips dep={flag.dependency} coreFlagsMap={coreFlagsMap} />
                </td>

                {/* Rollout */}
                <td style={{ padding: '16px 24px' }}>
                    {flag.rolloutPercentage != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{flag.rolloutPercentage}%</span>
                            <div className="rollout-bar" style={{ width: '50px' }}>
                                <div className="rollout-bar-fill" style={{ width: `${flag.rolloutPercentage}%` }}></div>
                            </div>
                        </div>
                    ) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}></span>}
                </td>

                {/* Status Toggle */}
                <td style={{ padding: '16px 24px' }}>
                    <label className="switch" onClick={(e) => { e.stopPropagation(); }}>
                        <input type="checkbox" checked={flag.enabled} onChange={() => onToggle(flag.id)} />
                        <span className="slider round"></span>
                    </label>
                </td>

                {/* Updated */}
                <td style={{ padding: '16px 24px' }}>
                    <span className="flag-date">{timeAgo(flag.updatedAt)}</span>
                </td>

                {/* Actions */}
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={(e) => { e.stopPropagation(); onMenuOpen(flag); }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                    >
                        <i className="ri-more-2-fill" style={{ fontSize: '16px' }}></i>
                    </button>
                </td>
            </tr>
            <JsonViewerModal
                isOpen={isJsonModalOpen}
                onClose={() => setIsJsonModalOpen(false)}
                jsonContent={isJson ? JSON.stringify(flag.value, null, 2) : ''}
                title={`JSON Payload: ${flag.key}`}
            />
        </React.Fragment>
    );
});

DependentFlagRow.displayName = 'DependentFlagRow';

export default DependentFlagRow;
