import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

// ═══════════════════════════════════════════════════════════
//  GraphNode — Premium custom React Flow node.
//
//  Displays:
//    • Flag key (monospace)
//    • Type badge (CORE / DEP)
//    • Data type (Boolean / String / Integer / Double / JSON)
//    • Status indicator (green = enabled, red = disabled)
//
//  Visual:
//    • Dark glass card with category-based accent
//    • Radial glow behind active/selected nodes
//    • Top accent line with gradient
//    • Hover elevation + scale effect
//    • Neon handle connectors
//    • Smooth transitions
// ═══════════════════════════════════════════════════════════

const GraphNode = memo(({ data, selected }) => {
    const isCore = data.category === 'CORE';
    const isEnabled = data.enabled !== false;

    // Color palette
    const accent = isCore ? '#38bdf8' : '#f59e0b';
    const accentRgb = isCore ? '56,189,248' : '245,158,11';
    const statusColor = isEnabled ? '#10b981' : '#ef4444';
    const statusGlow = isEnabled ? '16,185,129' : '239,68,68';

    return (
        <div style={{ position: 'relative' }}>
            {/* Radial glow behind node (visible when selected) */}
            {selected && (
                <div style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '-30px',
                    right: '-30px',
                    bottom: '-30px',
                    background: `radial-gradient(ellipse at center, rgba(${accentRgb},0.12) 0%, transparent 70%)`,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    animation: 'graphNodePulse 3s ease-in-out infinite',
                }} />
            )}

            <div
                style={{
                    width: '180px',
                    minHeight: '60px',
                    borderRadius: '14px',
                    background: selected
                        ? `linear-gradient(145deg, rgba(${accentRgb},0.12), rgba(${accentRgb},0.04))`
                        : `linear-gradient(145deg, rgba(${accentRgb},0.06), rgba(${accentRgb},0.015))`,
                    border: `1px solid ${selected ? `rgba(${accentRgb},0.4)` : `rgba(${accentRgb},0.15)`}`,
                    padding: '12px 14px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: selected
                        ? `0 0 30px rgba(${accentRgb},0.12), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(${accentRgb},0.1)`
                        : `0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)`,
                    position: 'relative',
                    overflow: 'hidden',
                }}
                className="graph-v2-node"
            >
                {/* Top accent gradient line */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: selected ? '2.5px' : '1.5px',
                    background: `linear-gradient(90deg, transparent 5%, rgba(${accentRgb},${selected ? 0.7 : 0.35}) 50%, transparent 95%)`,
                    borderRadius: '14px 14px 0 0',
                    transition: 'height 0.3s ease, background 0.3s ease',
                }} />

                {/* Inner shine overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
                    borderRadius: '14px 14px 0 0',
                    pointerEvents: 'none',
                }} />

                {/* Source handle (right side — outgoing for CORE) */}
                {isCore && (
                    <Handle
                        type="source"
                        position={Position.Right}
                        style={{
                            width: '10px',
                            height: '10px',
                            background: accent,
                            border: `2px solid rgba(8,12,24,0.9)`,
                            boxShadow: `0 0 10px rgba(${accentRgb},0.5)`,
                            transition: 'box-shadow 0.3s ease',
                        }}
                    />
                )}

                {/* Target handle (left side — incoming for DEP) */}
                {!isCore && (
                    <Handle
                        type="target"
                        position={Position.Left}
                        style={{
                            width: '10px',
                            height: '10px',
                            background: accent,
                            border: `2px solid rgba(8,12,24,0.9)`,
                            boxShadow: `0 0 10px rgba(${accentRgb},0.5)`,
                            transition: 'box-shadow 0.3s ease',
                        }}
                    />
                )}

                {/* Flag Key */}
                <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: selected ? '#ffffff' : '#e2e8f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '8px',
                    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                    letterSpacing: '-0.2px',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    {data.label || data.flagId}
                </div>

                {/* Meta row: category badge + type + status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'nowrap',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    {/* Category badge */}
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '5px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        background: `rgba(${accentRgb},0.12)`,
                        color: accent,
                        flexShrink: 0,
                    }}>
                        {isCore ? 'CORE' : 'DEP'}
                    </span>

                    {/* Data type */}
                    {data.type && (
                        <span style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.4)',
                            fontFamily: '"Fira Code", monospace',
                            flexShrink: 0,
                        }}>
                            {data.type}
                        </span>
                    )}

                    {/* Rollout percentage (dependent only) */}
                    {!isCore && (
                        <span style={{
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.3)',
                            fontFamily: '"Fira Code", monospace',
                            marginLeft: 'auto',
                            flexShrink: 0,
                        }}>
                            {data.rolloutPercentage ?? 100}%
                        </span>
                    )}

                    {/* Status indicator */}
                    <div style={{
                        marginLeft: !isCore ? '0' : 'auto',
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: statusColor,
                        boxShadow: `0 0 10px rgba(${statusGlow},0.5)`,
                        flexShrink: 0,
                        transition: 'all 0.3s ease',
                    }} />
                </div>

                {/* Display name removed as per request */}
            </div>
        </div>
    );
});

GraphNode.displayName = 'GraphNode';

export default GraphNode;
