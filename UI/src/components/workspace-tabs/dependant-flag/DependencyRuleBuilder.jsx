import React, { useCallback, useMemo, useState, useEffect, memo } from 'react';
import { SELECT_ARROW_BG, OPTION_BG } from '../core-flag/constants';
import JsonEditor from '../json-flag/JsonEditor';

// ═══════════════════════════════════════════════════════════
//  DependencyRuleBuilder — Recursive visual builder for the
//  RuleNode tree.
//  Dribbble-inspired "inline sentence" UI with vertical trunk.
// ═══════════════════════════════════════════════════════════

// ─── Style Constants ────────────────────────────────────────
const GROUP_COLORS = {
    AND: {
        border: '#0ea5e9',
        bg: 'rgba(14, 165, 233, 0.05)',
        glow: 'inset 2px 0 10px rgba(14, 165, 233, 0.1)',
        label: '#38bdf8'
    },
    OR: {
        border: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.04)',
        glow: 'inset 2px 0 10px rgba(168, 85, 247, 0.1)',
        label: '#c084fc'
    }
};

// ─── Immutable Update Utility ───────────────────────────────
const cloneNode = (node) => JSON.parse(JSON.stringify(node));

// ─── Helper: create empty tree nodes ────────────────────────
export const emptyCondition = () => ({ condition: { flagId: '', expectedValue: '' } });
export const emptyGroup = (op = 'AND') => ({ operator: op, children: [] });

/**
 * Clean the tree before submission: remove groups with no children,
 * remove conditions without flagId/expectedValue, and strip any
 * internal state — returning only backend-expected fields.
 */
export const cleanRuleNode = (node) => {
    if (!node) return null;

    // Leaf condition: return only { condition: { flagId, expectedValue } }
    if (node.condition) {
        const { flagId, expectedValue } = node.condition;
        if (!flagId || expectedValue === '' || expectedValue === null || expectedValue === undefined) return null;
        return { condition: { flagId, expectedValue } };
    }

    // Group: recursively clean children
    if (node.operator && node.children) {
        const cleanedChildren = node.children.map(cleanRuleNode).filter(Boolean);
        if (cleanedChildren.length === 0) return null;
        // Single-child group with an operator child → unwrap
        if (cleanedChildren.length === 1 && cleanedChildren[0].operator) {
            return cleanedChildren[0];
        }
        // Single-child group with a condition → still wrap in the group (backend expects operator+children)
        return { operator: node.operator, children: cleanedChildren };
    }

    return null;
};

/**
 * Validate the tree recursively. Returns true if every condition has flagId + expectedValue.
 */
export const isTreeValid = (node) => {
    if (!node) return false;
    if (node.condition) {
        return !!node.condition.flagId && node.condition.expectedValue !== '' && node.condition.expectedValue !== null && node.condition.expectedValue !== undefined;
    }
    if (node.operator && node.children) {
        return node.children.length > 0 && node.children.every(isTreeValid);
    }
    return false;
};


// ═══════════════════════════════════════════════════════════
//  ConditionRow — A single leaf: flag selector + expected value
// ═══════════════════════════════════════════════════════════
const ConditionRow = memo(({ node, index, coreFlags, onUpdate, onRemove, canRemove }) => {
    const { flagId, expectedValue } = node.condition;

    const selectedFlag = useMemo(() => coreFlags.find(f => f.id === flagId), [coreFlags, flagId]);
    const flagType = selectedFlag ? (selectedFlag.rawType || selectedFlag.type || 'BOOLEAN').toUpperCase() : null;

    // Buffer state to decouple the exact user keystrokes from the parsed object
    const [localJsonStr, setLocalJsonStr] = useState(null);

    const handleFlagChange = useCallback((newFlagId) => {
        const flag = coreFlags.find(f => f.id === newFlagId);
        let defaultVal = '';
        if (flag) {
            const t = (flag.rawType || flag.type || 'BOOLEAN').toUpperCase();
            const defaults = { BOOLEAN: true, STRING: '', INTEGER: 0, DOUBLE: 0.0, JSON: {} };
            defaultVal = defaults[t] ?? '';
        }
        setLocalJsonStr(null); // Force the local buffer to rebuild on flag switch
        onUpdate({ condition: { flagId: newFlagId, expectedValue: defaultVal } });
    }, [coreFlags, onUpdate]);

    const handleValueChange = useCallback((val) => {
        onUpdate({ condition: { flagId, expectedValue: val } });
    }, [flagId, onUpdate]);

    // ─── Render expected value input based on type ───────────
    const renderValueInput = () => {
        if (!flagType) return <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Select a flag first</span>;

        const inputStyle = { width: '100%', boxSizing: 'border-box', height: '36px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0 12px', color: '#fff', fontSize: '13px' };

        switch (flagType) {
            case 'BOOLEAN':
                return (
                    <div style={{ display: 'flex', gap: '4px', height: '36px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '4px', border: '1px solid rgba(255,255,255,0.08)', boxSizing: 'border-box' }}>
                        {[true, false].map(val => (
                            <button key={String(val)} type="button"
                                onClick={() => handleValueChange(val)}
                                style={{
                                    flex: 1, padding: '0 16px', borderRadius: '4px', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '12px', transition: 'all 0.2s', border: 'none',
                                    background: expectedValue === val
                                        ? (val ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)')
                                        : 'transparent',
                                    color: expectedValue === val
                                        ? (val ? '#10b981' : '#ef4444')
                                        : 'rgba(255,255,255,0.3)',
                                }}
                            >
                                {val ? 'true' : 'false'}
                            </button>
                        ))}
                    </div>
                );
            case 'STRING':
                return (
                    <input type="text" value={expectedValue || ''}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder="Expected string..."
                        style={inputStyle} />
                );
            case 'INTEGER':
                return (
                    <input type="number" value={expectedValue ?? ''}
                        onChange={(e) => handleValueChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        placeholder="Expected integer..."
                        style={inputStyle} />
                );
            case 'DOUBLE':
                return (
                    <input type="number" step="any" value={expectedValue ?? ''}
                        onChange={(e) => handleValueChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Expected decimal..."
                        style={inputStyle} />
                );
            default:
                return null;
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', animation: 'fadeIn 0.2s ease-out',
            marginBottom: '10px'
        }}>
            {/* The horizontal branch line connecting to the main vertical trunk */}
            <div style={{ position: 'absolute', left: '-20px', top: '18px', width: '20px', height: '2px', background: 'rgba(255,255,255,0.06)' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                
                {/* Core Flag Input */}
                <div style={{ width: '260px', flexShrink: 0 }}>
                    <select value={flagId}
                        onChange={(e) => handleFlagChange(e.target.value)}
                        style={{ 
                            width: '100%', boxSizing: 'border-box', appearance: 'none', 
                            background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='rgba(255,255,255,0.4)'%3E%3Cpath d='M12 16L6 10H18L12 16Z'%3E%3C/path%3E%3C/svg%3E") no-repeat right 10px center, rgba(255,255,255,0.03)`, 
                            cursor: 'pointer', padding: '0 32px 0 14px', fontSize: '13px', 
                            height: '36px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)',
                            color: flagId ? '#fff' : 'rgba(255,255,255,0.4)',
                            transition: 'all 0.2s', fontFamily: '"Fira Code", monospace'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                    >
                        <option value="" style={{ background: '#0a0514', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Select prerequisite flag...</option>
                        {coreFlags.map(f => (
                            <option key={f.id} value={f.id} style={{ background: '#0f0a1a', color: '#fff', fontFamily: '"Fira Code", monospace' }}>
                                {f.key} {f.type ? `(${f.type.toUpperCase()})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Operator "IS" */}
                {flagId && (
                    <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>IS</div>
                )}

                {/* Expected Value Input */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                    {flagType !== 'JSON' && renderValueInput()}
                    {flagType === 'JSON' && (
                        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontStyle: 'italic', paddingLeft: '4px' }}>
                            (JSON value defined below)
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                <button type="button" onClick={onRemove}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'transparent'; }}>
                    <i className="ri-close-line" style={{ fontSize: '18px' }}></i>
                </button>
            </div>

            {/* JSON Editor Expanded Panel */}
            {flagType === 'JSON' && (
                <div style={{ width: '100%', boxSizing: 'border-box', marginTop: '4px' }}>
                    <div style={{ 
                        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                        minWidth: '400px',
                        width: '100%'
                    }}>
                        <div style={{ height: '240px' }}>
                            <JsonEditor
                                value={localJsonStr !== null ? localJsonStr : (typeof expectedValue === 'object' ? JSON.stringify(expectedValue, null, 2) : String(expectedValue || '{\n  "key": "value"\n}'))}
                                onChange={(newVal) => {
                                    setLocalJsonStr(newVal);
                                    try { handleValueChange(JSON.parse(newVal)); }
                                    catch { handleValueChange(newVal); }
                                }}
                                height="100%"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
ConditionRow.displayName = 'ConditionRow';


// ═══════════════════════════════════════════════════════════
//  GroupNode — Recursive component rendering an AND/OR group
// ═══════════════════════════════════════════════════════════
const GroupNode = memo(({ node, coreFlags, depth, onUpdate, onRemove, isRoot }) => {
    const palette = GROUP_COLORS[node.operator] || GROUP_COLORS.AND;
    const children = node.children || [];

    // ─── Immutable tree updates ─────────────────────────────
    const updateChild = useCallback((childIndex, updatedChild) => {
        const next = cloneNode(node);
        next.children[childIndex] = updatedChild;
        onUpdate(next);
    }, [node, onUpdate]);

    const removeChild = useCallback((childIndex) => {
        const next = cloneNode(node);
        next.children.splice(childIndex, 1);
        onUpdate(next);
    }, [node, onUpdate]);

    const addCondition = useCallback(() => {
        const next = cloneNode(node);
        next.children.push(emptyCondition());
        onUpdate(next);
    }, [node, onUpdate]);

    const addNestedGroup = useCallback(() => {
        const next = cloneNode(node);
        const subOp = node.operator === 'AND' ? 'OR' : 'AND';
        next.children.push(emptyGroup(subOp));
        onUpdate(next);
    }, [node, onUpdate]);

    const toggleOperator = useCallback(() => {
        const next = cloneNode(node);
        next.operator = next.operator === 'AND' ? 'OR' : 'AND';
        onUpdate(next);
    }, [node, onUpdate]);

    let conditionCounter = 0;

    return (
        <div style={{
            position: 'relative',
            marginTop: isRoot ? '0' : '16px',
            animation: 'fadeIn 0.25s ease-out'
        }}>
            {/* The horizontal branch line connecting this group to its parent's vertical trunk */}
            {!isRoot && (
                <div style={{ position: 'absolute', left: '-20px', top: '18px', width: '20px', height: '2px', background: 'rgba(255,255,255,0.06)' }}></div>
            )}

            {/* Operator and Group Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Compact Operator Toggle */}
                    <div style={{ 
                        display: 'flex', 
                        borderRadius: '6px', 
                        overflow: 'hidden', 
                        border: `1px solid ${palette.border}`, 
                        background: 'rgba(0,0,0,0.3)',
                        height: '28px'
                    }}>
                        {['AND', 'OR'].map(op => (
                            <button key={op} type="button" onClick={() => { if (op !== node.operator) toggleOperator(); }}
                                style={{
                                    padding: '0 12px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 800,
                                    fontFamily: '"Fira Code", monospace', transition: 'all 0.2s',
                                    background: node.operator === op ? `${palette.border}` : 'transparent',
                                    color: node.operator === op ? '#fff' : 'rgba(255,255,255,0.3)',
                                }}>
                                {op}
                            </button>
                        ))}
                    </div>
                    {!isRoot && (
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>SUB-GROUP</div>
                    )}
                </div>

                {/* Remove group (not root) */}
                {!isRoot && (
                    <button type="button" onClick={onRemove}
                        style={{ 
                            background: 'rgba(239,68,68,0.06)', 
                            border: '1px solid rgba(239,68,68,0.15)', 
                            cursor: 'pointer', 
                            color: '#ef4444', 
                            padding: '5px 12px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
                    >
                        <i className="ri-delete-bin-line" style={{ fontSize: '13px' }}></i> Remove
                    </button>
                )}
            </div>

            {/* Content Area with Vertical Trunk */}
            <div style={{ display: 'flex', position: 'relative', marginTop: '16px' }}>
                
                {/* Vertical trunk line */}
                <div style={{ width: '2px', background: 'rgba(255,255,255,0.06)', marginLeft: '12px', marginRight: '20px', flexShrink: 0, borderRadius: '2px', position: 'relative' }}></div>

                {/* Children and Action Buttons */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'visible' }}>
                    
                    {children.map((child, i) => {
                        const isCondition = !!child.condition;
                        const isGroup = !!child.operator;

                        if (isCondition) {
                            const idx = conditionCounter++;
                            return (
                                <ConditionRow
                                    key={`cond-${idx}-${i}`}
                                    node={child}
                                    index={idx}
                                    coreFlags={coreFlags}
                                    onUpdate={(updated) => updateChild(i, updated)}
                                    onRemove={() => removeChild(i)}
                                    canRemove={true}
                                />
                            );
                        }

                        if (isGroup) {
                            return (
                                <GroupNode
                                    key={`grp-${i}`}
                                    node={child}
                                    coreFlags={coreFlags}
                                    depth={depth + 1}
                                    onUpdate={(updated) => updateChild(i, updated)}
                                    onRemove={() => removeChild(i)}
                                    isRoot={false}
                                />
                            );
                        }
                        return null;
                    })}

                    {/* Empty group hint */}
                    {children.length === 0 && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '12px 16px', 
                            background: 'rgba(255,255,255,0.01)', 
                            borderRadius: '6px', 
                            border: '1px dashed rgba(255,255,255,0.06)', 
                            color: 'rgba(255,255,255,0.15)', 
                            fontSize: '12px', 
                            fontStyle: 'italic', 
                            position: 'relative', 
                            marginBottom: '12px'
                        }}>
                            <div style={{ position: 'absolute', left: '-20px', top: '50%', width: '20px', height: '2px', background: 'rgba(255,255,255,0.06)' }}></div>
                            Empty Group
                        </div>
                    )}

                    {/* Action Buttons (Branching from the trunk) */}
                    <div style={{ display: 'flex', gap: '8px', position: 'relative', alignItems: 'center', height: '36px', marginTop: children.length > 0 ? '6px' : '0' }}>
                        {/* Horizontal branch for action buttons */}
                        <div style={{ position: 'absolute', left: '-20px', top: '18px', width: '20px', height: '2px', background: 'rgba(255,255,255,0.06)' }}></div>
                        
                        {children.length < 15 && (
                            <button type="button" onClick={addCondition}
                                style={{
                                    padding: '0 14px', borderRadius: '6px', cursor: 'pointer', height: '32px',
                                    border: `1px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.02)',
                                    color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; e.currentTarget.style.color = '#38bdf8'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                            >
                                <i className="ri-add-line" style={{ fontSize: '14px' }}></i> Add Condition
                            </button>
                        )}
                        {depth < 3 && (
                            <button type="button" onClick={addNestedGroup}
                                style={{
                                    padding: '0 14px', borderRadius: '6px', cursor: 'pointer', height: '32px',
                                    border: '1px solid rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.05)',
                                    color: '#d8b4fe', fontSize: '11px', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.05)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'; e.currentTarget.style.color = '#d8b4fe'; }}
                            >
                                <i className="ri-node-tree" style={{ fontSize: '14px' }}></i> Nested Group <span style={{ opacity: 0.5, fontSize: '10px', fontWeight: 400 }}>[{depth + 1}/3]</span>
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
});
GroupNode.displayName = 'GroupNode';


// ═══════════════════════════════════════════════════════════
//  DependencyRuleBuilder — Top-level component
//  Props:
//   - coreFlags: array of available flags to select from
//   - ruleNode:  the tree state { operator, children } or null
//   - onRuleNodeChange: (newTree) => void
// ═══════════════════════════════════════════════════════════
const DependencyRuleBuilder = memo(({ coreFlags = [], ruleNode, onRuleNodeChange }) => {
    // If tree is null/empty, initialize with a default group
    const tree = ruleNode && ruleNode.operator ? ruleNode : emptyGroup('AND');

    const handleUpdate = useCallback((updatedTree) => {
        onRuleNodeChange(updatedTree);
    }, [onRuleNodeChange]);

    // Validation
    const valid = useMemo(() => isTreeValid(tree), [tree]);

    return (
        <div style={{ marginBottom: '16px' }}>
            <div className="section-heading">
                <span className="section-label" style={{ color: '#f59e0b' }}>
                    <i className="ri-git-branch-line" style={{ marginRight: '6px' }}></i>
                    Dependency Rules <span className="form-required">*</span>
                </span>
                <div className="section-divider"></div>
            </div>

            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Define which Core Flags must match specific values for this flag to activate. Use nested groups for complex logic.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', overflowX: 'auto' }}>
                <GroupNode
                    node={tree}
                    coreFlags={coreFlags}
                    depth={0}
                    onUpdate={handleUpdate}
                    onRemove={() => {}}
                    isRoot={true}
                />
            </div>

            {/* Validation hint */}
            {!valid && tree.children && tree.children.length > 0 && (
                <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ri-error-warning-line" style={{ fontSize: '14px' }}></i>
                    All conditions must have a selected flag and expected value.
                </div>
            )}
        </div>
    );
});

DependencyRuleBuilder.displayName = 'DependencyRuleBuilder';

export default DependencyRuleBuilder;
