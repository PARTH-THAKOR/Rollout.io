import React, { memo } from 'react';
import { Controls as ReactFlowControls } from '@xyflow/react';

// ═══════════════════════════════════════════════════════════
//  GraphControls — Custom zoom controls for the dependency graph.
//  Wraps React Flow's built-in Controls with dark theme styling.
//  Fully isolated — no shared CSS dependencies.
// ═══════════════════════════════════════════════════════════

const GraphControls = memo(({ onFitView }) => (
    <ReactFlowControls
        showInteractive={false}
        position="top-left"
        style={{
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
    />
));

GraphControls.displayName = 'GraphControls';

export default GraphControls;
