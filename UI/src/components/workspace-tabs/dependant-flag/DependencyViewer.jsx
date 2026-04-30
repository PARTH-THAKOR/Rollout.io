import React, { useMemo, memo } from 'react';

// ═══════════════════════════════════════════════════════════
//  DependencyViewer — Renders a dependency rule tree as chips
//  Supports nested AND/OR groups and leaf conditions.
//  Shows: [flagName = value] AND [flagB = 10]
//  Nested: (A AND B) OR (C AND D)
// ═══════════════════════════════════════════════════════════

/**
 * Format a value for display.
 * Objects → "{...}", nulls → "null", rest → string.
 */
const formatValue = (val) => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return '{...}';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    return String(val);
};

/**
 * Parse a dependency RuleNode tree into a renderable structure.
 */
const parseNode = (node, coreFlagsMap = {}) => {
    if (!node) return null;

    // Leaf condition
    if (node.condition) {
        const flag = coreFlagsMap[node.condition.flagId];
        const flagKey = flag ? flag.key : node.condition.flagId;
        const val = formatValue(node.condition.expectedValue);
        return { type: 'leaf', flagKey, val };
    }

    // Group with children
    if (node.operator && node.children) {
        const kids = node.children
            .map(c => parseNode(c, coreFlagsMap))
            .filter(Boolean);
        if (kids.length === 0) return null;
        if (kids.length === 1) return kids[0]; // Unwrap single-child groups
        return { type: 'group', operator: node.operator, children: kids };
    }

    return null;
};

const LeafNode = ({ flagKey, val }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', width: 'fit-content' }}>
        <span style={{ color: '#fff', fontWeight: 600, fontFamily: '"Fira Code", monospace', fontSize: '13px' }}>{flagKey}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>IS</span>
        <span style={{ color: '#38bdf8', fontFamily: '"Fira Code", monospace', fontSize: '13px', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{val}</span>
    </div>
);

const NodeRenderer = ({ node, depth = 0 }) => {
    if (!node) return null;

    if (node.type === 'leaf') {
        return <LeafNode flagKey={node.flagKey} val={node.val} />;
    }

    if (node.type === 'group') {
        const isNested = depth > 0;
        const opColor = node.operator === 'AND' ? '#0ea5e9' : '#a855f7';
        const opBg = node.operator === 'AND' ? 'rgba(14,165,233,0.1)' : 'rgba(168,85,247,0.1)';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: isNested ? '16px' : '0', borderLeft: isNested ? `2px solid ${opBg}` : 'none', marginTop: isNested ? '8px' : '0' }}>
                {isNested && (
                    <div style={{ fontSize: '10px', fontWeight: 800, color: opColor, letterSpacing: '1px', marginBottom: '-4px' }}>{node.operator}</div>
                )}
                {node.children.map((child, i) => (
                    <React.Fragment key={i}>
                        <NodeRenderer node={child} depth={depth + 1} />
                        {i < node.children.length - 1 && !isNested && (
                            <div style={{ fontSize: '10px', fontWeight: 800, color: opColor, letterSpacing: '1px', background: opBg, padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>
                                {node.operator}
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    }

    return null;
};

const DependencyViewer = memo(({ dependency, coreFlagsMap = {} }) => {
    const tree = useMemo(() => parseNode(dependency, coreFlagsMap), [dependency, coreFlagsMap]);

    if (!tree) {
        return (
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                No dependencies
            </span>
        );
    }

    return (
        <div className="dep-viewer">
            <NodeRenderer node={tree} />
        </div>
    );
});
DependencyViewer.displayName = 'DependencyViewer';

export default DependencyViewer;
