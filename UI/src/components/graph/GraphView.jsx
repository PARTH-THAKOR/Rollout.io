import React, { useState, useCallback, useRef, Component } from 'react';
import {
    ReactFlow,
    Background,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import GraphNode from './GraphNode';
import GraphEdge from './GraphEdge';
import GraphLegend from './GraphLegend';
import GraphMiniMap from './GraphMiniMap';
import GraphControls from './GraphControls';
import DependenciesPanel from './DependenciesPanel';
import useGraphLayout from './hooks/useGraphLayout';

// ═══════════════════════════════════════════════════════════
//  GraphView — Premium React Flow graph visualization.
//
//  Receives depFlags and coreFlagsMap from DependencyGraph.jsx.
//  Fully isolated — no shared CSS or UI component dependencies.
//
//  Features:
//    • Stitch-style premium background (grid + gradients + glow)
//    • DAG layout (Core flags left → Dependent flags right)
//    • Custom nodes with radial glow effects
//    • Custom edges with neon bezier curves
//    • Path highlighting on node click
//    • Advanced Dependencies Panel (logic tree, stats, raw JSON)
//    • Minimap + zoom controls
//    • Circular dependency detection + warning
//    • Empty state handling
//    • Performance: memoized node/edge types + layout
// ═══════════════════════════════════════════════════════════

// Register custom node/edge types (MUST be stable reference)
const nodeTypes = { graphNode: GraphNode };
const edgeTypes = { graphEdge: GraphEdge };

/**
 * Inner graph component (requires ReactFlowProvider context).
 */
const GraphViewInner = ({ depFlags, coreFlagsMap }) => {
    const { fitView } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState(null);
    const [highlightedIds, setHighlightedIds] = useState(new Set());
    const initialFitDone = useRef(false);

    // Compute layout from raw data
    const {
        nodes: layoutedNodes,
        edges: layoutedEdges,
        hasCycles,
        isEmpty,
    } = useGraphLayout(depFlags, coreFlagsMap);

    // React Flow state
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Sync layout into React Flow state when data changes
    React.useEffect(() => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        // Fit view on first load or data change
        if (layoutedNodes.length > 0) {
            requestAnimationFrame(() => {
                fitView({ padding: 0.25, duration: 400 });
                initialFitDone.current = true;
            });
        }
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

    /**
     * On node click: highlight connected path + open dependencies panel.
     */
    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);

        // Find all connected nodes (both directions)
        const connectedNodeIds = new Set([node.id]);
        const connectedEdgeIds = new Set();

        edges.forEach(edge => {
            if (edge.source === node.id || edge.target === node.id) {
                connectedNodeIds.add(edge.source);
                connectedNodeIds.add(edge.target);
                connectedEdgeIds.add(edge.id);
            }
        });

        setHighlightedIds(connectedNodeIds);

        // Update edge selection state for highlighting
        setEdges(prev => prev.map(e => ({
            ...e,
            selected: connectedEdgeIds.has(e.id),
        })));

        // Update node selection state
        setNodes(prev => prev.map(n => ({
            ...n,
            selected: connectedNodeIds.has(n.id),
        })));
    }, [edges, setEdges, setNodes]);

    /**
     * On pane click: deselect everything.
     */
    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setHighlightedIds(new Set());
        setEdges(prev => prev.map(e => ({ ...e, selected: false })));
        setNodes(prev => prev.map(n => ({ ...n, selected: false })));
    }, [setEdges, setNodes]);

    /**
     * Close dependencies panel.
     */
    const closePanel = useCallback(() => {
        setSelectedNode(null);
        setHighlightedIds(new Set());
        setEdges(prev => prev.map(e => ({ ...e, selected: false })));
        setNodes(prev => prev.map(n => ({ ...n, selected: false })));
    }, [setEdges, setNodes]);

    /**
     * Highlight a graph node (from panel hover).
     */
    const handleHighlightNode = useCallback((flagId) => {
        if (!flagId) {
            // Clear highlight
            setNodes(prev => prev.map(n => ({
                ...n,
                selected: highlightedIds.has(n.id),
            })));
            return;
        }
        setNodes(prev => prev.map(n => ({
            ...n,
            selected: n.id === flagId || highlightedIds.has(n.id),
        })));
    }, [setNodes, highlightedIds]);

    /**
     * Focus a graph node (from panel click).
     */
    const handleFocusNode = useCallback((flagId) => {
        if (!flagId) return;
        const target = nodes.find(n => n.id === flagId);
        if (target) {
            fitView({
                nodes: [target],
                padding: 0.5,
                duration: 500,
            });
        }
    }, [nodes, fitView]);

    // Empty state
    if (isEmpty) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '400px',
                gap: '16px',
                background: 'linear-gradient(180deg, #0b0f1a 0%, #05070d 100%)',
                borderRadius: '12px',
            }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: 'rgba(167, 139, 250, 0.05)',
                    border: '1px solid rgba(167, 139, 250, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <i className="ri-mind-map" style={{
                        fontSize: '32px',
                        color: 'rgba(167, 139, 250, 0.3)',
                    }} />
                </div>
                <div style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '15px',
                    fontWeight: 600,
                }}>
                    No dependency graph available
                </div>
                <div style={{
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: '13px',
                    maxWidth: '300px',
                    textAlign: 'center',
                    lineHeight: 1.5,
                }}>
                    Create dependent flags to visualize the relationships between your feature flags
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            borderRadius: '0 0 12px 12px',
            overflow: 'hidden',
        }}>
            {/* ── Premium Stitch-Style Background ── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, #0b0f1a 0%, #070a14 50%, #05070d 100%)',
                zIndex: 0,
            }}>
                {/* Radial glow center */}
                <div style={{
                    position: 'absolute',
                    top: '30%',
                    left: '40%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                }} />
                {/* Secondary glow */}
                <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '30%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.03) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                }} />
                {/* Vignette overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,7,13,0.5) 100%)',
                    pointerEvents: 'none',
                }} />
                {/* Noise texture */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.015,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px 128px',
                    pointerEvents: 'none',
                }} />
            </div>

            {/* Circular dependency warning */}
            {hasCycles && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 15,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px',
                    backdropFilter: 'blur(12px)',
                    animation: 'graphFadeIn 0.3s ease',
                }}>
                    <i className="ri-error-warning-fill" style={{
                        color: '#ef4444',
                        fontSize: '16px',
                    }} />
                    <span style={{
                        fontSize: '12px',
                        color: '#fca5a5',
                        fontWeight: 600,
                    }}>
                        Circular dependency detected — review highlighted edges
                    </span>
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                minZoom={0.15}
                maxZoom={2.5}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                panOnScroll={true}
                selectionOnDrag={true}
                panOnDrag={[1, 2]}
                style={{
                    background: 'transparent',
                }}
            >
                {/* Stitch-style grid dots */}
                <Background
                    variant="dots"
                    gap={20}
                    size={0.8}
                    color="rgba(56,189,248,0.06)"
                />
                <GraphMiniMap />
                <GraphControls />
            </ReactFlow>

            {/* Legend */}
            <GraphLegend hasCycles={hasCycles} />

            {/* Advanced Dependencies Panel */}
            <DependenciesPanel
                node={selectedNode}
                onClose={closePanel}
                coreFlagsMap={coreFlagsMap}
                onHighlightNode={handleHighlightNode}
                onFocusNode={handleFocusNode}
            />

            {/* ── Scoped CSS ── */}
            <style>{`
                @keyframes graphPanelSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes graphFadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }

                @keyframes graphTreeExpand {
                    from { opacity: 0; max-height: 0; }
                    to { opacity: 1; max-height: 500px; }
                }

                @keyframes graphNodePulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0); }
                    50% { box-shadow: 0 0 20px 4px rgba(56,189,248,0.08); }
                }

                @keyframes graphEdgeDash {
                    to { stroke-dashoffset: -20; }
                }

                /* ── React Flow Controls (dark theme) ─────────── */
                .react-flow__controls {
                    background: rgba(8,12,24,0.92) !important;
                    border: 1px solid rgba(255,255,255,0.06) !important;
                    border-radius: 10px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
                }

                .react-flow__controls-button {
                    background: transparent !important;
                    border: none !important;
                    border-bottom: 1px solid rgba(255,255,255,0.03) !important;
                    fill: rgba(255,255,255,0.45) !important;
                    width: 34px !important;
                    height: 34px !important;
                    padding: 7px !important;
                    transition: all 0.2s ease !important;
                }

                .react-flow__controls-button:hover {
                    background: rgba(56,189,248,0.06) !important;
                    fill: rgba(56,189,248,0.8) !important;
                }

                .react-flow__controls-button:last-child {
                    border-bottom: none !important;
                }

                /* ── Minimap (dark theme) ─────────────────────── */
                .react-flow__minimap {
                    background: rgba(8,12,24,0.92) !important;
                    border: 1px solid rgba(255,255,255,0.06) !important;
                    border-radius: 10px !important;
                    overflow: hidden !important;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
                }

                /* ── Node hover glow ─────────────────────────── */
                .graph-v2-node {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                .graph-v2-node:hover {
                    box-shadow:
                        0 0 32px rgba(56,189,248,0.1),
                        0 0 60px rgba(56,189,248,0.04),
                        0 12px 40px rgba(0,0,0,0.35) !important;
                    transform: translateY(-2px) !important;
                }

                /* ── Edge cursor ─────────────────────────────── */
                .react-flow__edge-path {
                    cursor: pointer;
                }

                /* ── Selection box ───────────────────────────── */
                .react-flow__selection {
                    background: rgba(56,189,248,0.05) !important;
                    border: 1px solid rgba(56,189,248,0.2) !important;
                }

                /* ── Scrollbar (panel) ───────────────────────── */
                .react-flow * ::-webkit-scrollbar {
                    width: 4px;
                }
                .react-flow * ::-webkit-scrollbar-track {
                    background: transparent;
                }
                .react-flow * ::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.08);
                    border-radius: 2px;
                }
                .react-flow * ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.15);
                }

                /* Dep panel scrollbar */
                div[style*="overflow"] ::-webkit-scrollbar {
                    width: 4px;
                }
                div[style*="overflow"] ::-webkit-scrollbar-track {
                    background: transparent;
                }
                div[style*="overflow"] ::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.08);
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
};

/**
 * Error boundary to prevent graph crashes from killing the entire page.
 */
class GraphErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('[GraphView] Render error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '100%', minHeight: '400px', gap: '12px',
                    background: 'rgba(15,23,42,0.5)', borderRadius: '12px',
                }}>
                    <i className="ri-error-warning-line" style={{ fontSize: '36px', color: '#ef4444', opacity: 0.6 }} />
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 600 }}>
                        Graph rendering error
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', maxWidth: '300px', textAlign: 'center' }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            marginTop: '8px', padding: '6px 16px', fontSize: '12px',
                            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
                            borderRadius: '8px', color: '#38bdf8', cursor: 'pointer',
                        }}
                    >
                        <i className="ri-refresh-line" style={{ marginRight: '6px' }} />
                        Retry
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * GraphView wrapper with ReactFlowProvider + ErrorBoundary.
 * This is the public API component consumed by DependencyGraph.jsx.
 */
const GraphView = ({ depFlags, coreFlagsMap }) => (
    <GraphErrorBoundary>
        <ReactFlowProvider>
            <GraphViewInner depFlags={depFlags} coreFlagsMap={coreFlagsMap} />
        </ReactFlowProvider>
    </GraphErrorBoundary>
);

export default GraphView;
