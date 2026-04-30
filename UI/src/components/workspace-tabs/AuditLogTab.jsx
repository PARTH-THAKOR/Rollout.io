import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { List, useDynamicRowHeight } from 'react-window';
import { useAuditLogs, useDependentFlags } from '../../api/queries';
import useAllCoreFlags from '../../hooks/useAllCoreFlags';

// ═══════════════════════════════════════════════════════════
//  AuditLogTab — Production-grade system activity timeline
//  • Virtualized rendering (react-window v2)
//  • Date-based grouping (Today, Yesterday, This Week, Older)
//  • Expandable rows with before/after change diffs
//  • Lightweight action + resource filtering
//  • Skeleton loading & empty state
// ═══════════════════════════════════════════════════════════

// ─── Action Metadata ────────────────────────────────────────
// Backend action strings: CREATE_FLAG, UPDATE_FLAG, DELETE_FLAG, TOGGLE_FLAG
const ACTION_META = {
    CREATE_FLAG:  { icon: 'ri-add-circle-line',      color: '#10b981', label: 'Created',  verb: 'Created'  },
    UPDATE_FLAG:  { icon: 'ri-edit-line',             color: '#38bdf8', label: 'Updated',  verb: 'Updated'  },
    DELETE_FLAG:  { icon: 'ri-delete-bin-line',       color: '#ef4444', label: 'Deleted',  verb: 'Deleted'  },
    TOGGLE_FLAG:  { icon: 'ri-toggle-line',           color: '#f59e0b', label: 'Toggled',  verb: 'Toggled'  },
    // Also support short forms
    CREATED:      { icon: 'ri-add-circle-line',       color: '#10b981', label: 'Created',  verb: 'Created'  },
    UPDATED:      { icon: 'ri-edit-line',              color: '#38bdf8', label: 'Updated',  verb: 'Updated'  },
    DELETED:      { icon: 'ri-delete-bin-line',        color: '#ef4444', label: 'Deleted',  verb: 'Deleted'  },
    TOGGLED:      { icon: 'ri-toggle-line',            color: '#f59e0b', label: 'Toggled',  verb: 'Toggled'  },
    ENABLED:      { icon: 'ri-checkbox-circle-line',   color: '#10b981', label: 'Enabled',  verb: 'Enabled'  },
    DISABLED:     { icon: 'ri-close-circle-line',      color: '#ef4444', label: 'Disabled', verb: 'Disabled' },
};

const getActionMeta = (action) => {
    if (!action) return { icon: 'ri-flashlight-line', color: '#9ca3af', label: 'Activity', verb: 'Modified' };
    const upper = action.toUpperCase();
    if (ACTION_META[upper]) return ACTION_META[upper];
    // Fallback: create a readable label from the raw action string
    const readable = upper.replace(/_/g, ' ').replace(/\b\w/g, c => c).toLowerCase()
        .replace(/\b\w/, c => c.toUpperCase());
    return { icon: 'ri-flashlight-line', color: '#a78bfa', label: readable, verb: readable };
};

// ─── Human-readable description builder ─────────────────────
const buildMessage = (log, flagKeyMap = {}) => {
    const meta = getActionMeta(log.action);
    const changes = log.changes;
    const resource = log.resourceType?.toLowerCase() || 'resource';

    let detail = '';
    let extractedKey = '';
    let expandable = false;

    if (typeof changes === 'string') {
        if (changes.startsWith('Target state:')) {
            const state = changes.includes('true');
            Object.assign(meta, {
                verb: state ? 'Enabled' : 'Disabled',
                icon: state ? 'ri-checkbox-circle-line' : 'ri-close-circle-line',
                color: state ? '#10b981' : '#ef4444'
            });
            detail = '';
            extractedKey = '';
            expandable = false;
        } else if (log.action === 'CREATE_FLAG' || log.action === 'DELETE_FLAG') {
             // For CREATE/DELETE, changes is actually the flag key string.
             extractedKey = changes;
             detail = ''; 
             expandable = false; // Nothing more to show
        } else {
             detail = changes;
             // If changes is a JSON string, we might want to expand.
             if (changes.includes('{') || changes.includes('[')) {
                 expandable = true;
             } else {
                 expandable = false;
             }
        }
    } else if (changes && typeof changes === 'object') {
        expandable = true;
        detail = 'Configuration modified';
    }

    if (!extractedKey) {
         // Fallback to lookup map for UPDATE and TOGGLE
         const flagObj = flagKeyMap[log.resource];
         if (flagObj && flagObj.key) {
              extractedKey = flagObj.key;
         }
    }

    return { ...meta, detail, extractedKey, expandable };
};

// ─── Date Grouping ──────────────────────────────────────────
const getDateGroup = (ts) => {
    if (!ts) return 'Unknown';
    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);

    if (d >= today) return 'Today';
    if (d >= yesterday) return 'Yesterday';
    if (d >= weekAgo) return 'This Week';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// ─── Skeleton ───────────────────────────────────────────────
const AuditLogSkeleton = () => (
    <div style={{ padding: '0 24px' }}>
        {[...Array(8)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 4px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="skeleton-pulse" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton-pulse" style={{ width: `${140 + (i % 3) * 80}px`, height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                    <div className="skeleton-pulse" style={{ width: `${60 + (i % 2) * 30}px`, height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}></div>
                </div>
            </div>
        ))}
    </div>
);

// ─── Empty State ────────────────────────────────────────────
const EmptyState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{
            width: '72px', height: '72px', borderRadius: '20px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(56,189,248,0.08) 100%)',
            border: '1px solid rgba(16,185,129,0.1)',
        }}>
            <i className="ri-history-line" style={{ fontSize: '32px', color: '#10b981', opacity: 0.7 }}></i>
        </div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>No activity yet</h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, maxWidth: '320px' }}>
            When flags are created, updated, toggled, or deleted, a timeline of system events will appear here.
        </p>
    </div>
);

// ─── Diff Viewer ────────────────────────────────────────────
const renderValue = (val) => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

const ChangeDiff = memo(({ changes }) => {
    const wrapStyle = {
        margin: '8px 0 4px 50px', padding: '12px 14px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    };
    const emptyStyle = { ...wrapStyle, color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontStyle: 'italic' };

    if (!changes || (typeof changes === 'string' && !changes.includes('{'))) {
        // Simple string description from backend
        if (typeof changes === 'string' && changes.length > 0) {
            return (
                <div style={wrapStyle}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '6px', wordBreak: 'break-all' }}>
                        <i className="ri-information-line" style={{ fontSize: '13px' }}></i>
                        {changes}
                    </div>
                </div>
            );
        }
        return <div style={emptyStyle}>No detailed changes recorded.</div>;
    }

    if (typeof changes !== 'object') return <div style={emptyStyle}>No detailed changes recorded.</div>;

    const hasBefore = changes.before && typeof changes.before === 'object';
    const hasAfter = changes.after && typeof changes.after === 'object';

    if (hasBefore || hasAfter) {
        const before = changes.before || {};
        const after = changes.after || {};
        const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
        if (allKeys.length === 0) return <div style={emptyStyle}>No changes detected.</div>;

        return (
            <div style={wrapStyle}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>Changes</div>
                {allKeys.map((key) => {
                    const oldVal = before[key];
                    const newVal = after[key];
                    const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
                    return (
                        <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '4px 0', fontSize: '12px' }}>
                            <span style={{ width: '110px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0, paddingTop: '2px' }}>{key}</span>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                {oldVal !== undefined && <span style={{ color: '#ef4444', fontFamily: '"Fira Code", monospace', fontSize: '11.5px', textDecoration: 'line-through', opacity: 0.7, wordBreak: 'break-all' }}>{renderValue(oldVal)}</span>}
                                {changed && oldVal !== undefined && newVal !== undefined && <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>→</span>}
                                {newVal !== undefined && <span style={changed ? { color: '#10b981', fontFamily: '"Fira Code", monospace', fontSize: '11.5px', fontWeight: 600, wordBreak: 'break-all' } : { color: 'rgba(255,255,255,0.5)', fontFamily: '"Fira Code", monospace', fontSize: '11.5px', wordBreak: 'break-all' }}>{renderValue(newVal)}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Flat changes object
    const entries = Object.entries(changes);
    if (entries.length === 0) return <div style={emptyStyle}>No changes detected.</div>;

    return (
        <div style={wrapStyle}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>Details</div>
            {entries.map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '4px 0', fontSize: '12px' }}>
                    <span style={{ width: '110px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0, paddingTop: '2px' }}>{key}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"Fira Code", monospace', fontSize: '11.5px', wordBreak: 'break-all' }}>{renderValue(val)}</span>
                </div>
            ))}
        </div>
    );
});
ChangeDiff.displayName = 'ChangeDiff';

// ─── Build Flat List (logs + group headers) ─────────────────
const buildTimeline = (logs) => {
    const sorted = [...logs].sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
    });

    const items = [];
    let lastGroup = null;
    for (const log of sorted) {
        const group = getDateGroup(log.timestamp);
        if (group !== lastGroup) {
            items.push({ type: 'header', group });
            lastGroup = group;
        }
        items.push({ type: 'event', data: log });
    }
    return items;
};

// ─── Row Component for react-window v2 ──────────────────────
const TimelineRow = memo(({ index, style, items, expandedId, toggleExpand, flagKeyMap }) => {
    const item = items?.[index];
    if (!item) return null;

    if (item.type === 'header') {
        return (
            <div style={style}>
                <div style={{
                    padding: '12px 28px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '1px', color: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', gap: '8px', height: '100%', boxSizing: 'border-box',
                }}>
                    <i className="ri-calendar-event-line" style={{ fontSize: '12px', opacity: 0.6 }}></i>
                    {item.group}
                </div>
            </div>
        );
    }

    const log = item.data;
    const msg = buildMessage(log, flagKeyMap);
    const isExpanded = log.id === expandedId;
    const hasChanges = msg.expandable;

    // Shorten resource ID for display (it's a MongoDB ObjectId)
    const shortResource = log.resource
        ? (log.resource.length > 20 ? `${log.resource.slice(0, 8)}...${log.resource.slice(-6)}` : log.resource)
        : '';
        
    const displayKey = msg.extractedKey || shortResource;

    return (
        <div style={style}>
            <div
                style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    padding: '14px 28px', cursor: hasChanges ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                    background: isExpanded ? 'rgba(56,189,248,0.04)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    borderLeft: isExpanded ? '2px solid rgba(56,189,248,0.3)' : '2px solid transparent',
                }}
                onClick={() => toggleExpand(log.id, hasChanges)}
                onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = isExpanded ? 'rgba(56,189,248,0.04)' : 'transparent'; }}
            >
                {/* Icon */}
                <div style={{
                    width: '34px', height: '34px', borderRadius: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: `${msg.color}12`, border: `1px solid ${msg.color}18`,
                }}>
                    <i className={msg.icon} style={{ fontSize: '15px', color: msg.color }}></i>
                </div>

                {/* Body Wrapper */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '20px' }}>
                    
                    {/* Left: Message */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ color: msg.color, fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{msg.verb}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400, fontSize: '13px' }}>{log.resourceType?.toLowerCase() || 'resource'}</span>
                        {displayKey && (
                            <code style={{
                                background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px',
                                fontFamily: '"Fira Code", monospace', fontSize: '12px', color: '#e2e8f0',
                                border: '1px solid rgba(255,255,255,0.06)', wordBreak: 'break-all'
                            }}>
                                {displayKey}
                            </code>
                        )}
                        {msg.detail && (
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 400, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}></span>
                                {msg.detail}
                            </span>
                        )}
                    </div>

                    {/* Right: Metadata & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{timeAgo(log.timestamp)}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{formatTime(log.timestamp)}</div>
                        </div>

                        <div style={{ width: '110px', display: 'flex', justifyContent: 'flex-end' }}>
                            {hasChanges && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        padding: '5px 12px', background: isExpanded ? 'rgba(56,189,248,0.1)' : 'transparent',
                                        border: isExpanded ? '1px solid rgba(56,189,248,0.2)' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px', color: isExpanded ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                                        fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>
                                        <i className="ri-code-s-slash-line"></i>
                                        {isExpanded ? 'Hide' : 'Diff'}
                                    </div>
                                    <i className="ri-arrow-right-s-line" style={{
                                        fontSize: '18px', color: 'rgba(255,255,255,0.3)', transition: 'transform 0.2s',
                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                    }}></i>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Diff */}
            {isExpanded && <ChangeDiff changes={log.changes} />}
        </div>
    );
});
TimelineRow.displayName = 'TimelineRow';

// ─── Main Component ─────────────────────────────────────────
const AuditLogTab = ({ env, envId }) => {
    const { data: rawLogs = [], isLoading: isLogsLoading } = useAuditLogs(envId);
    
    const { coreFlagsMap, isLoading: isCoreFlagsLoading } = useAllCoreFlags(envId);
    const { data: dependentFlags = [], isLoading: isDepFlagsLoading } = useDependentFlags(envId);

    const isLoading = isLogsLoading || isCoreFlagsLoading || isDepFlagsLoading;

    const flagKeyMap = useMemo(() => {
        const map = { ...coreFlagsMap };
        dependentFlags.forEach(f => { map[f.id] = f; });
        
        // Recover keys for deleted flags from the audit logs
        rawLogs.forEach(log => {
            if (log.action === 'CREATE_FLAG' || log.action === 'DELETE_FLAG') {
                if (log.resource && log.changes && typeof log.changes === 'string') {
                    if (!map[log.resource]) {
                        map[log.resource] = { id: log.resource, key: log.changes };
                    }
                }
            }
        });
        
        return map;
    }, [coreFlagsMap, dependentFlags, rawLogs]);

    const [actionFilter, setActionFilter] = useState('all');
    const [resourceSearch, setResourceSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const BATCH = 50;
    const [visibleCount, setVisibleCount] = useState(BATCH);

    const containerRef = useRef(null);
    const [dims, setDims] = useState({ width: 0, height: 0 });

    useEffect(() => { setVisibleCount(BATCH); setExpandedId(null); }, [actionFilter, resourceSearch]);

    // Unique action types for filter chips
    const actionTypes = useMemo(() => {
        const set = new Set(rawLogs.map(l => l.action?.toUpperCase()).filter(Boolean));
        return [...set].sort();
    }, [rawLogs]);

    const filteredLogs = useMemo(() => {
        return rawLogs.filter(log => {
            if (actionFilter !== 'all' && log.action?.toUpperCase() !== actionFilter) return false;
            if (resourceSearch) {
                const q = resourceSearch.toLowerCase();
                const matchRes = (log.resource || '').toLowerCase().includes(q);
                const matchChanges = typeof log.changes === 'string' && log.changes.toLowerCase().includes(q);
                if (!matchRes && !matchChanges) return false;
            }
            return true;
        });
    }, [rawLogs, actionFilter, resourceSearch]);

    const visibleLogs = useMemo(() => filteredLogs.slice(0, visibleCount), [filteredLogs, visibleCount]);
    const timelineItems = useMemo(() => buildTimeline(visibleLogs), [visibleLogs]);

    const dynamicHeight = useDynamicRowHeight({ defaultRowHeight: 66 });

    const toggleExpand = useCallback((id, hasChanges) => {
        if (!hasChanges) return;
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(entries => {
            for (const entry of entries) {
                setDims({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const handleItemsRendered = useCallback(({ stopIndex }) => {
        if (stopIndex >= timelineItems.length - 5 && visibleCount < filteredLogs.length) {
            setVisibleCount(prev => Math.min(prev + BATCH, filteredLogs.length));
        }
    }, [timelineItems.length, visibleCount, filteredLogs.length]);

    const rowData = useMemo(() => ({
        items: timelineItems,
        expandedId,
        toggleExpand,
        flagKeyMap,
    }), [timelineItems, expandedId, toggleExpand, flagKeyMap]);

    return (
        <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '75vh' }}>
            {/* Toolbar */}
            <div className="tab-toolbar">
                <div className="toolbar-left">
                    <i className="ri-pulse-line" style={{ fontSize: '20px', color: '#10b981' }}></i>
                    <h3 className="toolbar-title">Activity Timeline</h3>
                    <span className="toolbar-badge">{filteredLogs.length}</span>
                </div>
                <div className="toolbar-right">
                    {/* Action Filter Chips */}
                    <div className="filter-chips">
                        {['all', ...actionTypes].map(action => {
                            const active = actionFilter === action;
                            const meta = action === 'all' ? null : getActionMeta(action);
                            return (
                                <button
                                    key={action}
                                    onClick={() => setActionFilter(action)}
                                    className={`filter-chip ${active ? 'active' : ''}`}
                                >
                                    {action === 'all' ? 'All' : meta?.label}
                                </button>
                            );
                        })}
                    </div>
                    {/* Resource Search */}
                    <div className="search-input-wrapper">
                        <i className="ri-search-line" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}></i>
                        <input
                            type="text"
                            value={resourceSearch}
                            onChange={(e) => setResourceSearch(e.target.value)}
                            placeholder="Search activity..."
                        />
                        {resourceSearch && <i className="ri-close-line" onClick={() => setResourceSearch('')} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px' }}></i>}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {isLoading ? (
                    <AuditLogSkeleton />
                ) : filteredLogs.length === 0 ? (
                    <EmptyState />
                ) : dims.height > 0 ? (
                    <List
                        height={dims.height}
                        width={dims.width}
                        rowCount={timelineItems.length}
                        rowHeight={dynamicHeight}
                        rowComponent={TimelineRow}
                        rowProps={rowData}
                        overscanCount={5}
                        onRowsRendered={handleItemsRendered}
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
                    />
                ) : null}
            </div>

            {/* Load more indicator */}
            {visibleCount < filteredLogs.length && !isLoading && (
                <div style={{
                    padding: '8px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0,
                }}>
                    Showing {visibleCount} of {filteredLogs.length} events · Scroll for more
                </div>
            )}
        </div>
    );
};

export default AuditLogTab;
