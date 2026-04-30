import React, { useState, memo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════
//  LogicTreeView — Visual dependency logic tree renderer.
//
//  Renders a nested RuleNode tree as a collapsible visual
//  tree with AND/OR group labels and condition chips.
//
//  Features:
//    • AND groups (blue) / OR groups (purple)
//    • Collapsible/expandable groups with smooth animation
//    • Condition chips: flagKey → operator → value
//    • JSON values collapsible ({...} → expand on click)
//    • Hover → highlight condition
//    • Click condition → callback to focus graph node
//    • Deep nesting support
//
//  Fully isolated — no shared CSS or component dependencies.
// ═══════════════════════════════════════════════════════════

// ─── JSON syntax highlighter (from JsonViewerModal pattern) ────
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

// ─── Value Display ────────────────────────────────────────────
const ValueDisplay = memo(({ value }) => {
    const [expanded, setExpanded] = useState(false);

    if (value === null || value === undefined) {
        return <span style={{ color: '#6272a4', fontStyle: 'italic' }}>null</span>;
    }

    if (typeof value === 'boolean') {
        return (
            <span style={{
                color: value ? '#10b981' : '#ef4444',
                fontWeight: 600,
            }}>
                {String(value)}
            </span>
        );
    }

    if (typeof value === 'object') {
        const jsonStr = JSON.stringify(value, null, 2);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
                <div style={{ display: 'flex' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        style={{
                            background: 'rgba(139,233,253,0.08)',
                            border: '1px solid rgba(139,233,253,0.15)',
                            borderRadius: '5px',
                            color: '#8be9fd',
                            fontSize: '11px',
                            fontFamily: '"Fira Code", monospace',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <i className={expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}
                            style={{ fontSize: '12px' }} />
                        {expanded ? 'Collapse' : '{...}'}
                    </button>
                </div>
                {expanded && (
                    <div style={{ width: '100%', overflowX: 'auto', marginTop: '6px' }}>
                        <pre style={{
                            margin: 0,
                            padding: '10px 12px',
                            background: 'rgba(0,0,0,0.4)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.04)',
                            fontSize: '11px',
                            fontFamily: '"Fira Code", monospace',
                            lineHeight: 1.5,
                            overflow: 'auto',
                            maxHeight: '250px',
                            width: 'fit-content',
                            minWidth: '100%',
                            boxSizing: 'border-box',
                            animation: 'graphTreeExpand 0.2s ease-out',
                        }}
                            dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonStr) }}
                        />
                    </div>
                )}
            </div>
        );
    }

    const str = String(value);
    return (
        <span style={{
            color: typeof value === 'number' ? '#bd93f9' : '#f1fa8c',
            fontFamily: '"Fira Code", monospace',
        }}>
            {str.length > 30 ? str.slice(0, 27) + '...' : str}
        </span>
    );
});
ValueDisplay.displayName = 'ValueDisplay';

// ─── Condition Chip ───────────────────────────────────────────
const ConditionChip = memo(({ condition, coreFlagsMap, isHighlighted, onHover, onClick }) => {
    const flag = coreFlagsMap[condition.flagId];
    const flagKey = flag?.key || condition.flagId;
    const operator = condition.operator || 'EQUALS';

    const operatorLabel = {
        EQUALS: 'IS',
        NOT_EQUALS: 'IS NOT',
        GREATER_THAN: '>',
        LESS_THAN: '<',
        GREATER_THAN_OR_EQUAL: '>=',
        LESS_THAN_OR_EQUAL: '<=',
        CONTAINS: 'IN',
    }[operator] || operator;

    return (
        <div
            onMouseEnter={() => onHover?.(condition.flagId)}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => onClick?.(condition.flagId)}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 12px',
                background: isHighlighted
                    ? 'rgba(56,189,248,0.1)'
                    : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isHighlighted ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            {/* Flag key */}
            <span style={{
                color: '#38bdf8',
                fontSize: '12.5px',
                fontWeight: 600,
                fontFamily: '"Fira Code", monospace',
                flexShrink: 0,
                lineHeight: '20px',
            }}>
                {flagKey}
            </span>

            {/* Operator */}
            <span style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                flexShrink: 0,
                lineHeight: '20px',
                padding: '0 2px',
            }}>
                {operatorLabel}
            </span>

            {/* Value */}
            <div style={{
                flex: 1,
                minWidth: 0,
                lineHeight: '20px',
                fontSize: '12.5px',
            }}>
                <ValueDisplay value={condition.expectedValue} />
            </div>
        </div>
    );
});
ConditionChip.displayName = 'ConditionChip';

// ─── Group Node (AND/OR) ──────────────────────────────────────
const GroupNode = memo(({ node, depth, coreFlagsMap, highlightedFlagId, onHover, onClick }) => {
    const [collapsed, setCollapsed] = useState(false);
    const isAnd = node.operator === 'AND';
    const accentColor = isAnd ? '#38bdf8' : '#a855f7';
    const accentRgb = isAnd ? '56,189,248' : '168,85,247';
    const label = isAnd ? 'AND' : 'OR';
    const sublabel = isAnd ? 'All must be true' : 'Any can be true';
    const childCount = node.children?.length || 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            marginLeft: depth > 0 ? '16px' : '0',
            borderLeft: depth > 0 ? `2px solid rgba(${accentRgb},0.15)` : 'none',
            paddingLeft: depth > 0 ? '12px' : '0',
        }}>
            {/* Group header */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    background: `rgba(${accentRgb},0.06)`,
                    border: `1px solid rgba(${accentRgb},0.12)`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: collapsed ? '0' : '8px',
                }}
            >
                {/* Collapse arrow */}
                <i className={collapsed ? 'ri-arrow-right-s-fill' : 'ri-arrow-down-s-fill'}
                    style={{
                        fontSize: '14px',
                        color: accentColor,
                        transition: 'transform 0.2s ease',
                    }}
                />

                {/* Label badge */}
                <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    color: accentColor,
                    background: `rgba(${accentRgb},0.12)`,
                    padding: '2px 8px',
                    borderRadius: '4px',
                }}>
                    {label}
                </span>

                {/* Sublabel */}
                <span style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.35)',
                    fontStyle: 'italic',
                }}>
                    {sublabel}
                </span>

                {/* Child count */}
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.25)',
                    fontFamily: '"Fira Code", monospace',
                }}>
                    {childCount}
                </span>
            </button>

            {/* Children (conditionally rendered) */}
            {!collapsed && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    animation: 'graphTreeExpand 0.2s ease-out',
                }}>
                    {(node.children || []).map((child, idx) => (
                        <TreeNode
                            key={idx}
                            node={child}
                            depth={depth + 1}
                            coreFlagsMap={coreFlagsMap}
                            highlightedFlagId={highlightedFlagId}
                            onHover={onHover}
                            onClick={onClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
GroupNode.displayName = 'GroupNode';

// ─── Tree Node Dispatcher ─────────────────────────────────────
const TreeNode = memo(({ node, depth = 0, coreFlagsMap, highlightedFlagId, onHover, onClick }) => {
    if (!node) return null;

    // Leaf: has a condition
    if (node.condition) {
        return (
            <div style={{
                marginLeft: depth > 0 ? '16px' : '0',
                paddingLeft: depth > 0 ? '12px' : '0',
                borderLeft: depth > 0 ? '2px solid rgba(255,255,255,0.04)' : 'none',
            }}>
                <ConditionChip
                    condition={node.condition}
                    coreFlagsMap={coreFlagsMap}
                    isHighlighted={highlightedFlagId === node.condition.flagId}
                    onHover={onHover}
                    onClick={onClick}
                />
            </div>
        );
    }

    // Group: has operator + children
    if (node.operator && node.children) {
        return (
            <GroupNode
                node={node}
                depth={depth}
                coreFlagsMap={coreFlagsMap}
                highlightedFlagId={highlightedFlagId}
                onHover={onHover}
                onClick={onClick}
            />
        );
    }

    return null;
});
TreeNode.displayName = 'TreeNode';

// ─── Main LogicTreeView ───────────────────────────────────────
const LogicTreeView = memo(({ dependency, coreFlagsMap, highlightedFlagId, onHover, onClick }) => {
    if (!dependency) {
        return (
            <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.25)',
                fontSize: '13px',
                fontStyle: 'italic',
            }}>
                No dependency rules configured
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '2px 0',
        }}>
            <TreeNode
                node={dependency}
                depth={0}
                coreFlagsMap={coreFlagsMap}
                highlightedFlagId={highlightedFlagId}
                onHover={onHover}
                onClick={onClick}
            />
        </div>
    );
});
LogicTreeView.displayName = 'LogicTreeView';

export default LogicTreeView;
