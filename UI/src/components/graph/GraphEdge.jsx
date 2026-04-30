import React, { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

// ═══════════════════════════════════════════════════════════
//  GraphEdge — Premium custom React Flow edge.
//
//  Features:
//    • Smooth bezier curves with adjustable curvature
//    • Neon glow on selected/hovered edges
//    • Condition labels at midpoint with glass effect
//    • Color-coded by operator type
//    • Animated dashed stroke for cycle edges
//    • Multi-layer rendering (glow + main line)
// ═══════════════════════════════════════════════════════════

const GraphEdge = memo(({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    style,
}) => {
    const isCycle = data?.isCycle;
    const label = data?.label || '';
    const operator = data?.operator || 'EQUALS';

    // Operator-based color scheme
    const getEdgeColor = () => {
        if (isCycle) return '#ef4444';
        if (selected) return '#f59e0b';
        switch (operator) {
            case 'EQUALS': return 'rgba(56,189,248,0.5)';
            case 'NOT_EQUALS': return 'rgba(168,85,247,0.5)';
            case 'GREATER_THAN': return 'rgba(16,185,129,0.5)';
            case 'LESS_THAN': return 'rgba(251,146,60,0.5)';
            case 'CONTAINS': return 'rgba(236,72,153,0.5)';
            default: return 'rgba(148,163,184,0.35)';
        }
    };

    const getGlowColor = () => {
        if (isCycle) return 'rgba(239,68,68,0.2)';
        if (selected) return 'rgba(245,158,11,0.2)';
        switch (operator) {
            case 'EQUALS': return 'rgba(56,189,248,0.08)';
            case 'NOT_EQUALS': return 'rgba(168,85,247,0.08)';
            default: return 'rgba(148,163,184,0.05)';
        }
    };

    const edgeColor = getEdgeColor();
    const glowColor = getGlowColor();

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.35,
    });

    return (
        <>
            {/* Layer 1: Wide glow (always visible, very subtle) */}
            <BaseEdge
                path={edgePath}
                style={{
                    stroke: glowColor,
                    strokeWidth: (selected || isCycle) ? 12 : 6,
                    fill: 'none',
                    transition: 'stroke-width 0.3s ease',
                }}
            />

            {/* Layer 2: Neon glow (selected/cycle only) */}
            {(selected || isCycle) && (
                <BaseEdge
                    path={edgePath}
                    style={{
                        stroke: edgeColor,
                        strokeWidth: 5,
                        strokeOpacity: 0.15,
                        fill: 'none',
                    }}
                />
            )}

            {/* Layer 3: Main edge line */}
            <BaseEdge
                path={edgePath}
                style={{
                    ...style,
                    stroke: edgeColor,
                    strokeWidth: selected ? 2.5 : 1.5,
                    strokeDasharray: isCycle ? '8 4' : 'none',
                    fill: 'none',
                    transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                }}
            />

            {/* Edge label */}
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            pointerEvents: 'none',
                            fontSize: '10px',
                            fontFamily: '"Fira Code", monospace',
                            fontWeight: 500,
                            color: selected ? '#f59e0b' : 'rgba(255,255,255,0.55)',
                            background: selected
                                ? 'rgba(245,158,11,0.1)'
                                : 'rgba(8,12,24,0.88)',
                            padding: '3px 10px',
                            borderRadius: '5px',
                            border: `1px solid ${selected ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            backdropFilter: 'blur(10px)',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease',
                            boxShadow: selected
                                ? '0 0 12px rgba(245,158,11,0.08)'
                                : '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
});

GraphEdge.displayName = 'GraphEdge';

export default GraphEdge;
