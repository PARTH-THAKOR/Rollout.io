import React, { memo, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
//  DependencyStats — Statistics section for the dependencies panel.
//
//  Shows:
//    • Total conditions count
//    • Number of AND/OR groups
//    • Core flags referenced
//    • Operators used
//
//  Fully isolated — no shared CSS or component dependencies.
// ═══════════════════════════════════════════════════════════

/**
 * Recursively walk a RuleNode tree and compute stats.
 */
const computeStats = (node, coreFlagsMap) => {
    const stats = {
        totalConditions: 0,
        totalGroups: 0,
        andGroups: 0,
        orGroups: 0,
        coreFlagIds: new Set(),
    };

    const walk = (n) => {
        if (!n) return;
        if (n.condition) {
            stats.totalConditions++;
            if (n.condition.flagId) {
                stats.coreFlagIds.add(n.condition.flagId);
            }
        }
        if (n.operator && n.children) {
            stats.totalGroups++;
            if (n.operator === 'AND') stats.andGroups++;
            else stats.orGroups++;
            n.children.forEach(walk);
        }
    };

    walk(node);
    return stats;
};

const StatChip = memo(({ icon, label, value, color, colorRgb }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: `rgba(${colorRgb},0.04)`,
        border: `1px solid rgba(${colorRgb},0.1)`,
        borderRadius: '8px',
        flex: '1 1 45%',
        minWidth: '120px',
    }}>
        <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: `rgba(${colorRgb},0.1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        }}>
            <i className={icon} style={{ fontSize: '14px', color }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#f1f5f9',
                fontFamily: '"Fira Code", monospace',
                lineHeight: 1,
            }}>
                {value}
            </span>
            <span style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.35)',
                fontWeight: 500,
                letterSpacing: '0.3px',
            }}>
                {label}
            </span>
        </div>
    </div>
));
StatChip.displayName = 'StatChip';



const DependencyStats = memo(({ dependency, coreFlagsMap }) => {
    const stats = useMemo(() => computeStats(dependency, coreFlagsMap), [dependency, coreFlagsMap]);

    if (!dependency) return null;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '12px 0',
        }}>
            {/* Stat chips grid */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
            }}>
                <StatChip
                    icon="ri-filter-line"
                    label="Conditions"
                    value={stats.totalConditions}
                    color="#38bdf8"
                    colorRgb="56,189,248"
                />
                <StatChip
                    icon="ri-git-merge-line"
                    label="Groups"
                    value={stats.totalGroups}
                    color="#a855f7"
                    colorRgb="168,85,247"
                />
                <StatChip
                    icon="ri-flag-line"
                    label="Core Flags"
                    value={stats.coreFlagIds.size}
                    color="#f59e0b"
                    colorRgb="245,158,11"
                />
            </div>

            {/* Group type breakdown */}
            {stats.totalGroups > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    paddingTop: '2px',
                }}>
                    {stats.andGroups > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '2px',
                                background: '#38bdf8',
                            }} />
                            <span style={{
                                fontSize: '10px',
                                color: 'rgba(255,255,255,0.35)',
                            }}>
                                {stats.andGroups} AND
                            </span>
                        </div>
                    )}
                    {stats.orGroups > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '2px',
                                background: '#a855f7',
                            }} />
                            <span style={{
                                fontSize: '10px',
                                color: 'rgba(255,255,255,0.35)',
                            }}>
                                {stats.orGroups} OR
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
DependencyStats.displayName = 'DependencyStats';

export default DependencyStats;
