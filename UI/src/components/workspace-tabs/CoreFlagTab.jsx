import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { controlPlaneApi } from '../../api/apiClient';
import { flagKeys, useCreateFlag, useToggleFlag, unwrapResponse } from '../../api/queries';
import { ENDPOINTS } from '../../api/config';
import FlagRow from './core-flag/FlagRow';
import FlagContextMenu from './core-flag/FlagContextMenu';
import CoreFlagSkeleton from './core-flag/CoreFlagSkeleton';
import { MULTI_VALUE_OPERATORS } from './core-flag/constants';

// ─── Lazy-loaded heavy components ───────────────────────────
const FlagForm = lazy(() => import('./core-flag/FlagForm'));
const UpdateFlagModal = lazy(() => import('./core-flag/UpdateFlagModal'));
const DeleteFlagModal = lazy(() => import('./core-flag/DeleteFlagModal'));

// Inline fallback for Suspense while FlagForm chunk loads
const ModalLoader = () => (
    <div className="modal-overlay" style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <i className="ri-loader-4-line spin" style={{ fontSize: '28px', color: '#38bdf8' }}></i>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Loading form...</span>
        </div>
    </div>
);

// ═════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const CoreFlagTab = ({ flags, setFlags, env, envId, isFlagsLoading }) => {
    const queryClient = useQueryClient();
    const createFlagMutation = useCreateFlag();
    const toggleFlagMutation = useToggleFlag();

    // ─── UI State ───────────────────────────────────────────
    const [flagSearch, setFlagSearch] = useState('');
    const [flagFilter, setFlagFilter] = useState('all');
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFlag, setEditFlag] = useState(null);
    const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // Auto-collapse expanded row when filtering or searching
    useEffect(() => {
        setExpandedId(null);
    }, [flagSearch, flagFilter]);
    // ─── Create modal state ─────────────────────────────────
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Toast state ────────────────────────────────────────
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // ─── Memoized Computed Values ───────────────────────────
    const filteredFlags = useMemo(() => flags.filter(flag => {
        const q = flagSearch.toLowerCase();
        const matchesSearch = !q
            || (flag.displayName || '').toLowerCase().includes(q)
            || (flag.key || '').toLowerCase().includes(q)
            || (flag.name || '').toLowerCase().includes(q)
            || (flag.description || '').toLowerCase().includes(q);
        const matchesFilter = flagFilter === 'all'
            || (flagFilter === 'active' && flag.status)
            || (flagFilter === 'inactive' && !flag.status);
        return matchesSearch && matchesFilter;
    }), [flags, flagSearch, flagFilter]);

    const activeCount = useMemo(() => flags.filter(f => f.status).length, [flags]);
    const inactiveCount = useMemo(() => flags.length - activeCount, [flags.length, activeCount]);
    const selectedFlag = useMemo(() => flags.find(f => f.id === menuOpenId) || null, [flags, menuOpenId]);
    const existingKeys = useMemo(() => new Set(flags.map(f => f.key)), [flags]);

    // ─── API Handlers ───────────────────────────────────────


    const toggleFlagStatus = async (id) => {
        const flagToToggle = flags.find(f => f.id === id);
        if (!flagToToggle) return;

        const previousFlags = [...flags];
        // Optimistic: flip locally
        setFlags(flags.map(f => f.id === id ? { ...f, status: !f.status, enabled: !f.enabled } : f));

        try {
            await toggleFlagMutation.mutateAsync({ flagId: id });
            queryClient.invalidateQueries({ queryKey: flagKeys.byEnv(envId) });
        } catch (error) {
            console.error('Failed to toggle flag:', error);
            setFlags(previousFlags); // Rollback on failure
        }
    };

    /**
     * Called by FlagForm with the fully-constructed payload.
     * Handles optimistic UI, API call, rollback on error.
     */
    const handleCreateFlag = (payload) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Optimistic UI
        const tempId = 'temp-' + Date.now();
        const typeDisplay = { BOOLEAN: 'Boolean', STRING: 'String', INTEGER: 'Integer', DOUBLE: 'Double' }[payload.type] || payload.type;
        const flagObj = {
            id: tempId, name: payload.displayName, displayName: payload.displayName,
            key: payload.key, description: payload.description || '',
            type: typeDisplay, status: false, enabled: false, date: 'Just now',
            updatedAt: new Date().toISOString(),
            rolloutPercentage: payload.rolloutPercentage ?? null,
            value: payload.value, targetingRules: payload.targetingRules || [],
        };
        setFlags(prev => [flagObj, ...prev]);
        setIsCreateModalOpen(false);

        // Async API call via centralized mutation
        (async () => {
            try {
                const result = await createFlagMutation.mutateAsync({ envId, payload });
                if (result) {
                    setFlags(prev => prev.map(f => f.id === tempId ? {
                        ...f, id: result.id || f.id,
                        date: new Date(result.createdAt || Date.now()).toLocaleString()
                    } : f));
                }
                showToast('Core flag created successfully!', 'success');
            } catch (error) {
                console.error('Failed to create flag:', error);
                setFlags(prev => prev.filter(f => f.id !== tempId));
                showToast('Failed to create core flag. Please try again.', 'error');
            } finally {
                setIsSubmitting(false);
            }
        })();
    };

    const openMenu = (flag) => {
        setMenuOpenId(flag.id);
        setEditFlag(null);
        setIsEditModalOpen(false);
        setIsRemoveConfirmOpen(false);
    };

    const closeMenu = useCallback(() => setMenuOpenId(null), []);

    const handleOpenEdit = (flag) => {
        setEditFlag(flag);
        setIsEditModalOpen(true);
        closeMenu();
    };

    const handleUpdateSuccess = (updatedData) => {
        setFlags(prev => prev.map(f => f.id === updatedData.id ? { 
            ...f, 
            name: updatedData.displayName || updatedData.key,
            description: updatedData.description,
            value: updatedData.value,
            status: updatedData.status ?? f.status,
            type: updatedData.type,
            targetingRules: updatedData.targetingRules
        } : f));
        setIsEditModalOpen(false);
        setEditFlag(null);
        showToast('Core flag updated successfully!', 'success');
        queryClient.invalidateQueries({ queryKey: flagKeys.byEnv(envId) });
        queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    };

    const handleOpenRemove = (flag) => {
        setEditFlag(flag);
        setIsRemoveConfirmOpen(true);
        closeMenu();
    };

    const handleDeleteSuccess = (flagId) => {
        setFlags(prev => prev.filter(f => f.id !== flagId));
        setIsRemoveConfirmOpen(false);
        setEditFlag(null);
        showToast('Flag deleted successfully.', 'success');
        queryClient.invalidateQueries({ queryKey: flagKeys.byEnv(envId) });
        queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    };

    const handleDeleteError = (flagId) => {
        setIsRemoveConfirmOpen(false);
        showToast('Failed to delete flag.', 'error');
    };

    // ─── Keyboard Shortcut ──────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                closeMenu();
                setIsEditModalOpen(false);
                setIsRemoveConfirmOpen(false);
                setIsCreateModalOpen(false);
                setExpandedId(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [closeMenu]);

    // ─── Render ─────────────────────────────────────────────
    return (
        <>
            {/* ── Toast Notification ─────────────────────── */}
            {toast && (
                <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ fontSize: '18px' }}></i>
                    {toast.message}
                </div>
            )}

            {/* ── Flags List Section ─────────────────────── */}
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '75vh' }}>
                {/* Toolbar: Search + Filters + Create */}
                <div className="tab-toolbar">
                    <div className="toolbar-left">
                        <h3 className="toolbar-title">Core Flags</h3>
                        <span className="toolbar-badge">{filteredFlags.length}</span>
                    </div>
                    <div className="toolbar-right">
                        {/* Filter Chips */}
                        <div className="filter-chips">
                            {[{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'inactive', label: 'Inactive' }].map(f => (
                                <button key={f.key} onClick={() => setFlagFilter(f.key)}
                                    className={`filter-chip ${flagFilter === f.key ? 'active' : ''}`}
                                >{f.label}</button>
                            ))}
                        </div>
                        {/* Search */}
                        <div className="search-input-wrapper">
                            <i className="ri-search-line" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}></i>
                            <input type="text" value={flagSearch} onChange={(e) => setFlagSearch(e.target.value)} placeholder="Search flags..." />
                            {flagSearch && <i className="ri-close-line" onClick={() => setFlagSearch('')} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px' }}></i>}
                        </div>
                        {/* New Core Flag Button */}
                        <button onClick={() => setIsCreateModalOpen(true)} className="btn-gradient" style={{ padding: '7px 16px', fontSize: '13px' }}>
                            <i className="ri-add-line" style={{ fontSize: '16px' }}></i> New Core Flag
                        </button>
                    </div>
                </div>

                {/* ── Table ───────────────────────────────── */}
                <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Flag</th>
                                <th style={{ width: '10%' }}>Type</th>
                                <th style={{ width: '18%' }}>Rollout</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '14%' }}>Updated</th>
                                <th style={{ width: '8%' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isFlagsLoading ? (
                                <CoreFlagSkeleton count={4} />
                            ) : flags.length === 0 ? (
                                <tr key="empty-all" className="table-empty-row">
                                    <td colSpan="6">
                                        <i className="ri-flag-2-line table-empty-icon"></i>
                                        <div className="table-empty-title">No core flags yet</div>
                                        <div className="table-empty-subtitle" style={{marginBottom: '16px'}}>Create your first core flag to start managing feature rollouts for this environment.</div>
                                        <button onClick={() => setIsCreateModalOpen(true)} className="btn-gradient">
                                            <i className="ri-add-line" style={{ fontSize: '16px' }}></i> New Core Flag
                                        </button>
                                    </td>
                                </tr>
                            ) : filteredFlags.length > 0 ? filteredFlags.map((flag) => (
                                <FlagRow
                                    key={flag.id}
                                    flag={flag}
                                    isExpanded={expandedId === flag.id}
                                    onToggle={() => toggleFlagStatus(flag.id)}
                                    onExpand={() => setExpandedId(expandedId === flag.id ? null : flag.id)}
                                    onMenuOpen={() => openMenu(flag)}
                                />
                            )) : (
                                <tr className="table-empty-row">
                                    <td colSpan="6">
                                        <i className="ri-search-line table-empty-icon"></i>
                                        <div className="table-empty-title">No flags found matching "{flagSearch}"</div>
                                        <div className="table-empty-subtitle">Try a different search term or filter</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="card-footer">
                    <span>Showing {filteredFlags.length} of {flags.length} flags</span>
                    <span>{activeCount} active · {inactiveCount} inactive</span>
                </div>
            </div>

            {/* ════════════════════════════════════════════════
                 CREATE CORE FLAG MODAL (Lazy Loaded)
                ════════════════════════════════════════════════ */}
            {isCreateModalOpen && (
                <Suspense fallback={<ModalLoader />}>
                    <FlagForm
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateFlag}
                        isSubmitting={isSubmitting}
                        existingKeys={existingKeys}
                    />
                </Suspense>
            )}

            {/* ════════════════════════════════════════════════
                 CONTEXT MENU, EDIT MODAL, REMOVE CONFIRM
                ════════════════════════════════════════════════ */}
            {(menuOpenId || isEditModalOpen || isRemoveConfirmOpen) && (
                <div className="modal-overlay" onClick={() => { closeMenu(); setIsEditModalOpen(false); setIsRemoveConfirmOpen(false); }}>
                    {/* Context Menu */}
                    {menuOpenId && !isEditModalOpen && !isRemoveConfirmOpen && selectedFlag && (
                        <FlagContextMenu
                            flag={selectedFlag}
                            onClose={closeMenu}
                            onEdit={handleOpenEdit}
                            onDelete={handleOpenRemove}
                        />
                    )}

                    {/* Edit Modal */}
                    {isEditModalOpen && editFlag && (
                        <Suspense fallback={<ModalLoader />}>
                            <UpdateFlagModal
                                flag={editFlag}
                                onClose={() => { setIsEditModalOpen(false); setEditFlag(null); }}
                                onSubmit={handleUpdateSuccess}
                            />
                        </Suspense>
                    )}

                    {/* Remove Confirmation Modal */}
                    {isRemoveConfirmOpen && editFlag && (
                        <Suspense fallback={<ModalLoader />}>
                            <DeleteFlagModal
                                flag={editFlag}
                                onClose={() => { setIsRemoveConfirmOpen(false); setEditFlag(null); }}
                                onDeleteSuccess={handleDeleteSuccess}
                                onDeleteError={handleDeleteError}
                            />
                        </Suspense>
                    )}
                </div>
            )}


        </>
    );
};

export default CoreFlagTab;
