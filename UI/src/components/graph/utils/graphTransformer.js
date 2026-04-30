// ═══════════════════════════════════════════════════════════
//  graphTransformer.js — Transforms backend flag data into
//  React Flow nodes + edges for the dependency graph.
//
//  Core Flags → left column (source nodes)
//  Dependent Flags → right column (target nodes)
//  Conditions → edges with labels
//
//  Handles:
//    • Only flags that participate in dependency chains
//    • Edge label formatting (boolean, object, primitives)
//    • Circular dependency detection
//    • Auto-layout with vertical stacking per column
// ═══════════════════════════════════════════════════════════

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;
const COLUMN_GAP = 320;
const ROW_GAP = 40;
const LEFT_MARGIN = 60;
const TOP_MARGIN = 60;

/**
 * Format edge label value for display.
 */
export const formatEdgeLabel = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return '= {...}';
    if (typeof val === 'boolean') return `= ${val}`;
    const str = String(val);
    return str.length > 20 ? `= ${str.slice(0, 17)}...` : `= ${str}`;
};

/**
 * Determine display type label from raw backend type string.
 */
export const formatTypeBadge = (rawType) => {
    const map = {
        BOOLEAN: 'Boolean',
        STRING: 'String',
        INTEGER: 'Integer',
        DOUBLE: 'Double',
        JSON: 'JSON',
    };
    return map[rawType?.toUpperCase()] || rawType || 'Unknown';
};

/**
 * Detect circular dependencies in the dependency graph.
 * Returns an array of edge IDs that form a cycle.
 */
export const detectCircularDependencies = (edges) => {
    const adj = {};
    edges.forEach(e => {
        if (!adj[e.source]) adj[e.source] = [];
        adj[e.source].push({ target: e.target, edgeId: e.id });
    });

    const visited = new Set();
    const stack = new Set();
    const cycleEdges = [];

    const dfs = (nodeId, path) => {
        if (stack.has(nodeId)) {
            // Found a cycle — mark all edges in the cycle path
            const cycleStart = path.indexOf(nodeId);
            if (cycleStart >= 0) {
                for (let i = cycleStart; i < path.length - 1; i++) {
                    const src = path[i];
                    const tgt = path[i + 1];
                    const edge = edges.find(e => e.source === src && e.target === tgt);
                    if (edge) cycleEdges.push(edge.id);
                }
            }
            return;
        }
        if (visited.has(nodeId)) return;

        visited.add(nodeId);
        stack.add(nodeId);

        (adj[nodeId] || []).forEach(({ target }) => {
            dfs(target, [...path, target]);
        });

        stack.delete(nodeId);
    };

    Object.keys(adj).forEach(nodeId => {
        if (!visited.has(nodeId)) dfs(nodeId, [nodeId]);
    });

    return cycleEdges;
};

/**
 * Build React Flow nodes + edges from dependent flags and core flags map.
 * Only includes flags that are actually part of dependency chains.
 *
 * @param {Array} depFlags - Array of dependent flag objects
 * @param {Object} coreFlagsMap - { flagId: flagObject } lookup
 * @returns {{ nodes: Array, edges: Array, hasCycles: boolean, cycleEdgeIds: string[] }}
 */
export const buildGraphData = (depFlags, coreFlagsMap) => {
    if (!depFlags.length) return { nodes: [], edges: [], hasCycles: false, cycleEdgeIds: [] };

    const nodes = [];
    const edges = [];
    const addedNodeIds = new Set();

    // Add node helper (prevents duplicates)
    const ensureNode = (id, data) => {
        if (addedNodeIds.has(id)) return;
        addedNodeIds.add(id);
        nodes.push({ id, data });
    };

    // Walk dependency tree, create edges from core → dependent
    const walkDependency = (node, depFlagId, depFlagKey) => {
        if (!node) return;
        if (node.condition && node.condition.flagId) {
            const coreId = node.condition.flagId;
            const coreFlag = coreFlagsMap[coreId];

            ensureNode(coreId, {
                label: coreFlag ? coreFlag.key : coreId,
                displayName: coreFlag?.displayName || coreFlag?.key || coreId,
                category: 'CORE',
                type: formatTypeBadge(coreFlag?.rawType || coreFlag?.type),
                rawType: coreFlag?.rawType || coreFlag?.type || '',
                enabled: coreFlag?.enabled !== false,
                value: coreFlag?.value,
                flagId: coreId,
            });

            const edgeLabel = formatEdgeLabel(node.condition.expectedValue);
            const edgeId = `${coreId}-${depFlagId}-${edges.length}`;

            edges.push({
                id: edgeId,
                source: coreId,
                target: depFlagId,
                data: {
                    label: edgeLabel,
                    operator: node.condition.operator || 'EQUALS',
                    expectedValue: node.condition.expectedValue,
                },
            });
        }
        if (node.children) {
            node.children.forEach(child => walkDependency(child, depFlagId, depFlagKey));
        }
    };

    // Process each dependent flag
    depFlags.forEach(df => {
        ensureNode(df.id, {
            label: df.key || df.displayName || df.name,
            displayName: df.displayName || df.key || df.name || '',
            category: 'DEPENDENT',
            type: formatTypeBadge(df.rawType || df.type),
            rawType: df.rawType || df.type || '',
            enabled: df.enabled !== false,
            value: df.value,
            flagId: df.id,
            rolloutPercentage: df.rolloutPercentage,
            dependency: df.dependency,
        });

        if (df.dependency) {
            walkDependency(df.dependency, df.id, df.key);
        }
    });

    // Detect circular dependencies
    const cycleEdgeIds = detectCircularDependencies(edges);
    const hasCycles = cycleEdgeIds.length > 0;

    return { nodes, edges, hasCycles, cycleEdgeIds };
};

/**
 * Auto-layout: place CORE nodes on the left, DEPENDENT on the right.
 * Returns positioned nodes with { x, y } coordinates.
 *
 * @param {Array} nodes - Raw nodes from buildGraphData
 * @returns {Array} - Nodes with position: { x, y } added
 */
export const layoutNodes = (nodes) => {
    if (!nodes.length) return [];

    const coreNodes = nodes.filter(n => n.data.category === 'CORE');
    const depNodes = nodes.filter(n => n.data.category === 'DEPENDENT');

    const positionColumn = (columnNodes, xOffset) => {
        const totalHeight = columnNodes.length * NODE_HEIGHT + (columnNodes.length - 1) * ROW_GAP;
        const startY = Math.max(TOP_MARGIN, 300 - totalHeight / 2);

        return columnNodes.map((node, idx) => ({
            ...node,
            type: 'graphNode',
            position: {
                x: xOffset,
                y: startY + idx * (NODE_HEIGHT + ROW_GAP),
            },
        }));
    };

    const positionedCore = positionColumn(coreNodes, LEFT_MARGIN);
    const positionedDep = positionColumn(depNodes, LEFT_MARGIN + NODE_WIDTH + COLUMN_GAP);

    return [...positionedCore, ...positionedDep];
};

/**
 * Transform raw edges into React Flow edge objects.
 */
export const layoutEdges = (rawEdges, cycleEdgeIds = []) => {
    return rawEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'graphEdge',
        animated: cycleEdgeIds.includes(edge.id),
        data: {
            ...edge.data,
            isCycle: cycleEdgeIds.includes(edge.id),
        },
    }));
};

export { NODE_WIDTH, NODE_HEIGHT };
