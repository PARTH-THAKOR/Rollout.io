import React, { useState, memo, useMemo, useCallback } from 'react';
import LogicTreeView from './LogicTreeView';
import DependencyStats from './DependencyStats';

// ═══════════════════════════════════════════════════════════
//  DependenciesPanel — Advanced right-side dependencies panel.
//
//  Replaces the flat list side panel with a structured,
//  production-grade dependency visualization UI.
//
//  Features:
//    ┌─────────────────────────────────────────────────┐
//    │ Header: Flag info + category badge              │
//    │ View Toggle: Formatted / Raw JSON               │
//    │ Stats: conditions, groups, flags, operators      │
//    │ Logic Tree: nested AND/OR groups + condition     │
//    │             chips with collapsible JSON values   │
//    │ Flag Details: key, type, status, value, rollout  │
//    └─────────────────────────────────────────────────┘
//
//  Syncs with graph:
//    • Hover condition → highlights graph node
//    • Click condition → focuses graph node
//
//  Fully isolated — no shared CSS or component dependencies.
// ═══════════════════════════════════════════════════════════

// ─── JSON syntax highlighter (inline, isolated) ──────────────
const syntaxHighlight = (json) => {
    if (!json) return '';
    let processed = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return processed.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        function (match) {
            let color = '#bd93f9';
            if (/^"/.test(match)) {
                color = /:$/.test(match) ? '#8be9fd' : '#f1fa8c';
            } else if (/true|false/.test(match)) {
                color = '#ff79c6';
            } else if (/null/.test(match)) {
                color = '#6272a4';
            }
            return `<span style="color: ${color}">${match}</span>`;
        }
    );
};

const formatValue = (val) => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') {
        try { return JSON.stringify(val, null, 2); }
        catch { return '{...}'; }
    }
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    return String(val);
};

// ─── Section Divider ──────────────────────────────────────────
const SectionLabel = ({ label, icon }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 0 6px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        marginTop: '4px',
    }}>
        {icon && <i className={icon} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }} />}
        <span style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
        }}>
            {label}
        </span>
    </div>
);

// ─── View Mode Toggle (Formatted / Raw) ─────────────────────
const ViewModeToggle = memo(({ mode, onChange }) => (
    <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        padding: '2px',
        border: '1px solid rgba(255,255,255,0.05)',
    }}>
        {['formatted', 'raw'].map(m => (
            <button
                key={m}
                onClick={() => onChange(m)}
                style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: mode === m ? '#f1f5f9' : 'rgba(255,255,255,0.35)',
                    textTransform: 'capitalize',
                }}
            >
                {m === 'formatted' ? (
                    <><i className="ri-node-tree" style={{ marginRight: '4px', fontSize: '11px' }} />Tree</>
                ) : (
                    <><i className="ri-code-s-slash-line" style={{ marginRight: '4px', fontSize: '11px' }} />Raw</>
                )}
            </button>
        ))}
    </div>
));
ViewModeToggle.displayName = 'ViewModeToggle';

// ─── Info Row ─────────────────────────────────────────────────
const InfoRow = ({ label, children }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
    }}>
        <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: 500,
        }}>
            {label}
        </span>
        <div style={{
            fontSize: '12px',
            color: '#e2e8f0',
            fontFamily: '"Fira Code", monospace',
        }}>
            {children}
        </div>
    </div>
);

// ═════════════════════════════════════════════════════════════
//  MAIN PANEL
// ═════════════════════════════════════════════════════════════
const DependenciesPanel = memo(({
    node,
    onClose,
    coreFlagsMap = {},
    onHighlightNode,
    onFocusNode,
}) => {
    const [viewMode, setViewMode] = useState('formatted');
    const [copied, setCopied] = useState(false);

    const nodeData = node ? (node.data || {}) : {};

    const rawJson = useMemo(() => {
        if (!nodeData.dependency) return '';
        try { return JSON.stringify(nodeData.dependency, null, 2); }
        catch { return '{}'; }
    }, [nodeData.dependency]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(rawJson).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(console.error);
    }, [rawJson]);

    // ── IMPORTANT: Early return MUST be after all hooks ──
    if (!node) return null;

    const isCore = nodeData.category === 'CORE';
    const accent = isCore ? '#38bdf8' : '#f59e0b';
    const accentRgb = isCore ? '56,189,248' : '245,158,11';
    const isEnabled = nodeData.enabled !== false;
    const hasDependency = !isCore && nodeData.dependency;
    const isJsonValue = typeof nodeData.value === 'object' && nodeData.value !== null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '420px',
                background: 'rgba(10,15,30,0.95)',
                backdropFilter: 'blur(32px)',
                borderLeft: `1px solid rgba(255,255,255,0.06)`,
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'graphPanelSlideIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: '-12px 0 48px rgba(0,0,0,0.5)',
            }}
        >
            {/* ── Header ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: `1px solid rgba(255,255,255,0.05)`,
                background: `linear-gradient(180deg, rgba(255,255,255,0.03), transparent)`,
                flexShrink: 0,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flex: 1,
                    minWidth: 0,
                }}>
                    {/* Status dot */}
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isEnabled ? '#10b981' : '#ef4444',
                        boxShadow: isEnabled
                            ? '0 0 8px rgba(16,185,129,0.5)'
                            : '0 0 8px rgba(239,68,68,0.4)',
                        flexShrink: 0,
                    }} />

                    {/* Flag key */}
                    <span style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#ffffff',
                        fontFamily: '"Fira Code", monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {nodeData.label || nodeData.flagId}
                    </span>

                    {/* Category badge */}
                    <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `rgba(${accentRgb},0.12)`,
                        color: accent,
                        letterSpacing: '0.6px',
                        flexShrink: 0,
                    }}>
                        {isCore ? 'CORE' : 'DEP'}
                    </span>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '7px',
                        color: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                    }}
                    title="Close panel"
                >
                    <i className="ri-close-line" />
                </button>
            </div>

            {/* ── Content ── */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 24px 24px',
            }}>
                {/* Flag Details Section */}
                <SectionLabel label="Flag Details" icon="ri-information-line" />

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                }}>
                    {nodeData.displayName && (
                        <InfoRow label="Display Name">
                            <span style={{ fontFamily: 'inherit', color: '#e2e8f0' }}>
                                {nodeData.displayName}
                            </span>
                        </InfoRow>
                    )}

                    <InfoRow label="Type">
                        <span style={{
                            padding: '2px 8px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            fontSize: '11px',
                        }}>
                            {nodeData.type || 'Unknown'}
                        </span>
                    </InfoRow>

                    <InfoRow label="Status">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: isEnabled ? '#10b981' : '#ef4444',
                            }} />
                            <span style={{
                                fontSize: '11px',
                                color: isEnabled ? '#10b981' : '#ef4444',
                                fontWeight: 600,
                            }}>
                                {isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </InfoRow>

                    {/* Value */}
                    {nodeData.value !== undefined && nodeData.value !== null && (
                        <div style={{ padding: '6px 0' }}>
                            <span style={{
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.35)',
                                fontWeight: 500,
                                display: 'block',
                                marginBottom: '4px',
                            }}>
                                Value
                            </span>
                            {isJsonValue ? (
                                <pre style={{
                                    margin: 0,
                                    padding: '8px 10px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    fontSize: '11px',
                                    fontFamily: '"Fira Code", monospace',
                                    lineHeight: 1.5,
                                    overflow: 'auto',
                                    maxHeight: '120px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(formatValue(nodeData.value)) }}
                                />
                            ) : (
                                <span style={{
                                    color: '#38bdf8',
                                    fontSize: '12px',
                                    fontFamily: '"Fira Code", monospace',
                                }}>
                                    {formatValue(nodeData.value)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Rollout */}
                    <InfoRow label="Rollout">
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            <div style={{
                                width: '60px', height: '3px',
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: '2px', overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${nodeData.rolloutPercentage ?? 100}%`,
                                    height: '100%',
                                    background: accent,
                                    borderRadius: '2px',
                                }} />
                            </div>
                            <span style={{
                                fontSize: '11px', color: accent, fontWeight: 600,
                            }}>
                                {nodeData.rolloutPercentage ?? 100}%
                            </span>
                        </div>
                    </InfoRow>
                </div>

                {/* ── Dependencies Section (Dependent flags only) ── */}
                {hasDependency && (
                    <>
                        {/* Stats */}
                        <SectionLabel label="Dependency Stats" icon="ri-bar-chart-box-line" />
                        <DependencyStats
                            dependency={nodeData.dependency}
                            coreFlagsMap={coreFlagsMap}
                        />

                        {/* Dependency Logic */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                            marginTop: '4px',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                                <i className="ri-git-branch-line" style={{
                                    fontSize: '12px', color: 'rgba(255,255,255,0.25)',
                                }} />
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                }}>
                                    Dependency Logic
                                </span>
                            </div>
                            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
                        </div>

                        {/* Formatted View */}
                        {viewMode === 'formatted' ? (
                            <div style={{ marginTop: '10px' }}>
                                <LogicTreeView
                                    dependency={nodeData.dependency}
                                    coreFlagsMap={coreFlagsMap}
                                    highlightedFlagId={null}
                                    onHover={onHighlightNode}
                                    onClick={onFocusNode}
                                />
                            </div>
                        ) : (
                            /* Raw JSON View */
                            <div style={{ marginTop: '10px' }}>
                                {/* Copy bar */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '6px 10px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px 8px 0 0',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    borderBottom: 'none',
                                }}>
                                    <span style={{
                                        fontSize: '10px',
                                        color: 'rgba(255,255,255,0.3)',
                                        fontFamily: '"Fira Code", monospace',
                                    }}>
                                        dependency.json
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: copied ? '#10b981' : 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            padding: '2px 6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <i className={copied ? 'ri-check-line' : 'ri-clipboard-line'} />
                                        <span style={{ fontSize: '10px' }}>
                                            {copied ? 'Copied' : 'Copy'}
                                        </span>
                                    </button>
                                </div>

                                {/* JSON content */}
                                <pre style={{
                                    margin: 0,
                                    padding: '12px',
                                    background: 'rgba(0,0,0,0.35)',
                                    borderRadius: '0 0 8px 8px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    fontSize: '11px',
                                    fontFamily: '"Fira Code", monospace',
                                    lineHeight: 1.5,
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(rawJson) }}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Core flag: no dependency section */}
                {isCore && (
                    <div style={{
                        marginTop: '12px',
                        padding: '16px',
                        background: 'rgba(56,189,248,0.03)',
                        border: '1px solid rgba(56,189,248,0.08)',
                        borderRadius: '10px',
                        textAlign: 'center',
                    }}>
                        <i className="ri-shield-check-line" style={{
                            fontSize: '20px', color: 'rgba(56,189,248,0.4)',
                        }} />
                        <div style={{
                            marginTop: '6px',
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.35)',
                        }}>
                            Core flags are source nodes — they don't depend on other flags.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

DependenciesPanel.displayName = 'DependenciesPanel';

export default DependenciesPanel;
