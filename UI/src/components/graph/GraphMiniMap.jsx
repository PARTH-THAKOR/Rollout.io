import React, { memo } from 'react';
import { MiniMap as ReactFlowMiniMap } from '@xyflow/react';

// ═══════════════════════════════════════════════════════════
//  GraphMiniMap — Styled minimap for the dependency graph.
//  Uses React Flow's built-in MiniMap with custom dark theme.
//  Fully isolated — no shared CSS dependencies.
// ═══════════════════════════════════════════════════════════

const nodeColor = (node) => {
    if (node.data?.category === 'CORE') return '#38bdf8';
    if (node.data?.category === 'DEPENDENT') return '#f59e0b';
    return '#64748b';
};

const GraphMiniMap = memo(() => (
    <ReactFlowMiniMap
        nodeColor={nodeColor}
        nodeStrokeWidth={2}
        maskColor="rgba(10, 15, 30, 0.8)"
        style={{
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            overflow: 'hidden',
        }}
        pannable
        zoomable
        position="bottom-left"
    />
));

GraphMiniMap.displayName = 'GraphMiniMap';

export default GraphMiniMap;
