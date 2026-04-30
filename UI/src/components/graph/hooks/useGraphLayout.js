import { useMemo } from 'react';
import { buildGraphData, layoutNodes, layoutEdges } from '../utils/graphTransformer';

// ═══════════════════════════════════════════════════════════
//  useGraphLayout — Hook that transforms raw flag data into
//  positioned React Flow nodes + edges.
//
//  Memoizes all computations to prevent unnecessary re-renders.
//  Returns ready-to-use data for the ReactFlow component.
// ═══════════════════════════════════════════════════════════

const useGraphLayout = (depFlags, coreFlagsMap) => {
    // Build raw graph data from backend objects
    const graphData = useMemo(
        () => buildGraphData(depFlags, coreFlagsMap),
        [depFlags, coreFlagsMap]
    );

    // Position nodes in a two-column DAG layout
    const nodes = useMemo(
        () => layoutNodes(graphData.nodes),
        [graphData.nodes]
    );

    // Transform edges into React Flow edge objects
    const edges = useMemo(
        () => layoutEdges(graphData.edges, graphData.cycleEdgeIds),
        [graphData.edges, graphData.cycleEdgeIds]
    );

    return {
        nodes,
        edges,
        hasCycles: graphData.hasCycles,
        cycleEdgeIds: graphData.cycleEdgeIds,
        isEmpty: graphData.nodes.length === 0,
    };
};

export default useGraphLayout;
