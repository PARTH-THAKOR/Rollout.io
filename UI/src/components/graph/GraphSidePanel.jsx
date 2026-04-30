import React, { memo, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
//  GraphSidePanel — Detail panel that opens when a node is
//  clicked in the dependency graph.
//
//  Shows:
//    • Flag name, key, category
//    • Data type
//    • Current value (with JSON viewer for objects)
//    • Status (enabled/disabled)
//    • Dependencies (for dependent flags)
//    • Rollout percentage
//
//  Fully isolated — no shared CSS or component dependencies.
// ═══════════════════════════════════════════════════════════

const formatValue = (val) => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') {
        try { return JSON.stringify(val, null, 2); }
        catch { return '{...}'; }
    }
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    return String(val);
};

const InfoRow = ({ label, children }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
        <span style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
        }}>
            {label}
        </span>
        <div style={{
            fontSize: '13px',
            color: '#e2e8f0',
            fontFamily: '"Fira Code", monospace',
        }}>
            {children}
        </div>
    </div>
);

const DependencyChip = ({ flagKey, value }) => (
    <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        background: 'rgba(56,189,248,0.06)',
        border: '1px solid rgba(56,189,248,0.12)',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: '"Fira Code", monospace',
    }}>
        <span style={{ color: '#38bdf8' }}>{flagKey}</span>
        {value && (
            <>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 800 }}>IS</span>
                <span style={{ color: '#10b981' }}>{formatValue(value)}</span>
            </>
        )}
    </div>
);

/**
 * Recursively extract dependencies from a RuleNode tree.
 */
const extractDeps = (node, coreFlagsMap) => {
    if (!node) return [];
    if (node.condition && node.condition.flagId) {
        const flag = coreFlagsMap[node.condition.flagId];
        return [{
            flagKey: flag?.key || node.condition.flagId,
            value: node.condition.expectedValue,
        }];
    }
    if (node.children) {
        return node.children.flatMap(c => extractDeps(c, coreFlagsMap));
    }
    return [];
};

const GraphSidePanel = memo(({ node, onClose, coreFlagsMap = {} }) => {
    if (!node) return null;

    const nodeData = node.data || {};
    const isCore = nodeData.category === 'CORE';
    const accent = isCore ? '#38bdf8' : '#f59e0b';
    const accentRgb = isCore ? '56,189,248' : '245,158,11';
    const isEnabled = nodeData.enabled !== false;

    // Extract dependencies for dependent nodes
    const deps = useMemo(() => {
        if (isCore || !nodeData.dependency) return [];
        return extractDeps(nodeData.dependency, coreFlagsMap);
    }, [isCore, nodeData.dependency, coreFlagsMap]);

    const isJsonValue = typeof nodeData.value === 'object' && nodeData.value !== null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '320px',
                background: 'rgba(15,23,42,0.96)',
                backdropFilter: 'blur(20px)',
                borderLeft: `1px solid rgba(${accentRgb},0.15)`,
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'graphPanelSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: `1px solid rgba(${accentRgb},0.1)`,
                background: `linear-gradient(180deg, rgba(${accentRgb},0.06), transparent)`,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: accent,
                        boxShadow: `0 0 8px rgba(${accentRgb},0.4)`,
                    }} />
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: accent,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        {isCore ? 'Core Flag' : 'Dependent Flag'}
                    </span>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                    }}
                    title="Close panel"
                >
                    <i className="ri-close-line" />
                </button>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px 20px 20px',
            }}>
                <InfoRow label="Flag Key">
                    {nodeData.label || nodeData.flagId}
                </InfoRow>

                {nodeData.displayName && (
                    <InfoRow label="Display Name">
                        <span style={{ fontFamily: 'inherit', color: '#e2e8f0' }}>
                            {nodeData.displayName}
                        </span>
                    </InfoRow>
                )}

                <InfoRow label="Data Type">
                    <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '5px',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.6)',
                    }}>
                        {nodeData.type || 'Unknown'}
                    </span>
                </InfoRow>

                <InfoRow label="Status">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isEnabled ? '#10b981' : '#ef4444',
                            boxShadow: isEnabled
                                ? '0 0 6px rgba(16,185,129,0.5)'
                                : '0 0 6px rgba(239,68,68,0.4)',
                        }} />
                        <span style={{
                            fontSize: '13px',
                            color: isEnabled ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                        }}>
                            {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                </InfoRow>

                {/* Value */}
                {nodeData.value !== undefined && nodeData.value !== null && (
                    <InfoRow label="Current Value">
                        {isJsonValue ? (
                            <pre style={{
                                margin: 0,
                                padding: '10px',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.04)',
                                fontSize: '11px',
                                color: '#10b981',
                                overflow: 'auto',
                                maxHeight: '160px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}>
                                {JSON.stringify(nodeData.value, null, 2)}
                            </pre>
                        ) : (
                            <span style={{ color: '#38bdf8' }}>
                                {formatValue(nodeData.value)}
                            </span>
                        )}
                    </InfoRow>
                )}

                {/* Rollout */}
                {nodeData.rolloutPercentage != null && (
                    <InfoRow label="Rollout">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <div style={{
                                flex: 1,
                                height: '4px',
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${nodeData.rolloutPercentage}%`,
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${accent}, rgba(${accentRgb},0.5))`,
                                    borderRadius: '2px',
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                            <span style={{
                                fontSize: '12px',
                                color: accent,
                                fontWeight: 600,
                                minWidth: '36px',
                                textAlign: 'right',
                            }}>
                                {nodeData.rolloutPercentage}%
                            </span>
                        </div>
                    </InfoRow>
                )}

                {/* Dependencies */}
                {deps.length > 0 && (
                    <InfoRow label={`Dependencies (${deps.length})`}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            marginTop: '4px',
                        }}>
                            {deps.map((dep, i) => (
                                <DependencyChip key={i} flagKey={dep.flagKey} value={dep.value} />
                            ))}
                        </div>
                    </InfoRow>
                )}
            </div>
        </div>
    );
});

GraphSidePanel.displayName = 'GraphSidePanel';

export default GraphSidePanel;
