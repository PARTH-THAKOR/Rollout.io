import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJsonFlags, flagKeys, useCreateFlag, useToggleFlag } from '../../../api/queries';
import FlagRow from '../core-flag/FlagRow';
import CoreFlagSkeleton from '../core-flag/CoreFlagSkeleton';
import FlagContextMenu from '../core-flag/FlagContextMenu';
import FlagTableHeader from '../core-flag/FlagTableHeader';
import { getFriendlyErrorMessage } from '../../../utils/errorFormatter';

// ─── Lazy-loaded heavy components ───────────────────────────
const FlagForm = lazy(() => import('../core-flag/FlagForm'));
const UpdateFlagModal = lazy(() => import('../core-flag/UpdateFlagModal'));
const DeleteFlagModal = lazy(() => import('../core-flag/DeleteFlagModal'));

// Inline fallback for Suspense
const ModalLoader = () => (
    <div className="modal-overlay" style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <i className="ri-loader-4-line spin" style={{ fontSize: '28px', color: '#38bdf8' }}></i>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Loading form...</span>
        </div>
    </div>
);

// ═════════════════════════════════════════════════════════════
//  JSON FLAG TAB — Unified with Core Flag UI
//  Uses same FlagRow table layout, FlagForm (with JSON type),
//  UpdateFlagModal, and CoreFlagSkeleton.
// ═════════════════════════════════════════════════════════════
const JsonFlagTab = ({ env, envId }) => {
    const queryClient = useQueryClient();
    const createFlagMutation = useCreateFlag();
    const toggleFlagMutation = useToggleFlag();

    // ─── Server State (TanStack Query) ──────────────────────
    const { data: fetchedJsonFlags, isLoading: isQueryLoading } = useJsonFlags(envId);

    // ─── Local UI State ─────────────────────────────────────
    const [jsonFlags, setJsonFlags] = useState(() => fetchedJsonFlags || []);
    const [flagSearch, setFlagSearch] = useState('');
    const [flagFilter, setFlagFilter] = useState('all');
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFlag, setEditFlag] = useState(null);
    const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFlagError, setCreateFlagError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // Auto-collapse expanded row when filtering or searching
    useEffect(() => {
        setExpandedId(null);
    }, [flagSearch, flagFilter]);
    // ─── Toast ──────────────────────────────────────────────
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // Bridge: sync query data → local state for optimistic updates
    useEffect(() => {
        if (fetchedJsonFlags) {
            setJsonFlags(fetchedJsonFlags);
        }
    }, [fetchedJsonFlags]);

    const isLoading = isQueryLoading;
    const displayFlags = jsonFlags.length === 0 && fetchedJsonFlags && fetchedJsonFlags.length > 0 ? fetchedJsonFlags : jsonFlags;

    // ─── Memoized Computed Values ───────────────────────────
    const filteredFlags = useMemo(() => displayFlags.filter(flag => {
        const q = flagSearch.toLowerCase();
        const matchesSearch = !q
            || (flag.displayName || '').toLowerCase().includes(q)
            || (flag.key || '').toLowerCase().includes(q)
            || (flag.name || '').toLowerCase().includes(q)
            || (flag.description || '').toLowerCase().includes(q);
        const matchesFilter = flagFilter === 'all'
            || (flagFilter === 'active' && (flag.status || flag.enabled))
            || (flagFilter === 'inactive' && !(flag.status || flag.enabled));
        return matchesSearch && matchesFilter;
    }), [displayFlags, flagSearch, flagFilter]);

    const activeCount = useMemo(() => displayFlags.filter(f => f.status || f.enabled).length, [displayFlags]);
    const inactiveCount = useMemo(() => displayFlags.length - activeCount, [displayFlags.length, activeCount]);
    const selectedFlag = useMemo(() => displayFlags.find(f => f.id === menuOpenId) || null, [displayFlags, menuOpenId]);
    const existingKeys = useMemo(() => new Set(displayFlags.map(f => f.key)), [displayFlags]);

    // ─── API Handlers ───────────────────────────────────────

    const toggleFlagStatus = useCallback(async (id) => {
        const flagToToggle = jsonFlags.find(f => f.id === id);
        if (!flagToToggle) return;

        const previousFlags = [...jsonFlags];
        setJsonFlags(jsonFlags.map(f => f.id === id ? { ...f, status: !f.status, enabled: !f.enabled } : f));

        try {
            await toggleFlagMutation.mutateAsync({ flagId: id });
            queryClient.invalidateQueries({ queryKey: flagKeys.json(envId) });
        } catch (error) {
            console.error('Failed to toggle JSON flag:', error);
            setJsonFlags(previousFlags);
            showToast('Failed to toggle flag.', 'error');
        }
    }, [jsonFlags, toggleFlagMutation, queryClient, envId, showToast]);

    const handleCreateFlag = useCallback((payload) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setCreateFlagError(null);

        (async () => {
            try {
                const result = await createFlagMutation.mutateAsync({ envId, payload });
                if (result) {
                    const flagObj = {
                        id: result.id,
                        name: payload.displayName,
                        displayName: payload.displayName,
                        key: payload.key,
                        description: payload.description || '',
                        type: 'JSON',
                        status: false,
                        enabled: false,
                        date: new Date(result.createdAt || Date.now()).toLocaleString(),
                        updatedAt: result.updatedAt || new Date().toISOString(),
                        rolloutPercentage: payload.rolloutPercentage ?? null,
                        value: payload.value,
                        targetingRules: payload.targetingRules || [],
                    };
                    setJsonFlags(prev => [flagObj, ...prev]);
                    queryClient.invalidateQueries({ queryKey: flagKeys.json(envId) });
                }
                showToast('JSON flag created successfully!', 'success');
                setIsCreateModalOpen(false);
                setCreateFlagError(null);
            } catch (error) {
                console.error('Failed to create JSON flag:', error);
                const msg = getFriendlyErrorMessage(error);
                setCreateFlagError(msg);
            } finally {
                setIsSubmitting(false);
            }
        })();
    }, [isSubmitting, createFlagMutation, envId, showToast, queryClient]);

    // ─── Menu Handlers ──────────────────────────────────────
    const openMenu = useCallback((flag) => {
        setMenuOpenId(flag.id);
        setEditFlag(null);
        setIsEditModalOpen(false);
        setIsRemoveConfirmOpen(false);
    }, []);

    const closeMenu = useCallback(() => setMenuOpenId(null), []);

    const handleOpenEdit = useCallback((flag) => {
        setEditFlag(flag);
        setIsEditModalOpen(true);
        closeMenu();
    }, [closeMenu]);

    const handleUpdateSuccess = useCallback((updatedData) => {
        setJsonFlags(prev => prev.map(f => f.id === updatedData.id ? {
            ...f,
            name: updatedData.displayName || updatedData.key,
            displayName: updatedData.displayName || updatedData.key,
            description: updatedData.description,
            value: updatedData.value,
            status: updatedData.enabled ?? f.status,
            enabled: updatedData.enabled ?? f.enabled,
            rolloutPercentage: updatedData.rolloutPercentage,
            targetingRules: updatedData.targetingRules
        } : f));
        setIsEditModalOpen(false);
        setEditFlag(null);
        showToast('JSON flag updated successfully!', 'success');
        queryClient.invalidateQueries({ queryKey: flagKeys.json(envId) });
        queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }, [queryClient, envId, showToast]);

    const handleOpenRemove = useCallback((flag) => {
        setEditFlag(flag);
        setIsRemoveConfirmOpen(true);
        closeMenu();
    }, [closeMenu]);

    const handleDeleteSuccess = useCallback((flagId) => {
        setJsonFlags(prev => prev.filter(f => f.id !== flagId));
        setIsRemoveConfirmOpen(false);
        setEditFlag(null);
        showToast('JSON flag deleted successfully.', 'success');
        queryClient.invalidateQueries({ queryKey: flagKeys.json(envId) });
        queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }, [queryClient, envId, showToast]);

    const handleDeleteError = useCallback(() => {
        setIsRemoveConfirmOpen(false);
        showToast('Failed to delete flag.', 'error');
    }, [showToast]);

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
            {/* Toast Notification */}
            {toast && (
                <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ fontSize: '18px' }}></i>
                    {toast.message}
                </div>
            )}

            {/* ── Flags List Section ─────────────────────── */}
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
                {/* Toolbar: Search + Filters + Create */}
                <div className="tab-toolbar">
                    <div className="toolbar-left">
                        <h3 className="toolbar-title">JSON Flags</h3>
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
                        {/* New JSON Flag Button */}
                        <button onClick={() => setIsCreateModalOpen(true)} className="btn-gradient" style={{ padding: '7px 16px', fontSize: '13px' }}>
                            <i className="ri-add-line" style={{ fontSize: '16px' }}></i> New JSON Flag
                        </button>
                    </div>
                </div>

                {/* ── Table (matches CoreFlagTab exactly) ──── */}
                <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="data-table">
                        <FlagTableHeader />
                        <tbody>
                            {isLoading ? (
                                <CoreFlagSkeleton count={4} />
                            ) : displayFlags.length === 0 ? (
                                <tr key="empty-all" className="table-empty-row">
                                    <td colSpan="6">
                                        <i className="ri-braces-line table-empty-icon"></i>
                                        <div className="table-empty-title">No JSON flags yet</div>
                                        <div className="table-empty-subtitle" style={{marginBottom: '16px'}}>Create your first JSON flag to manage complex configuration settings.</div>
                                        <button onClick={() => setIsCreateModalOpen(true)} className="btn-gradient">
                                            <i className="ri-add-line" style={{ fontSize: '16px' }}></i> New JSON Flag
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
                    <span>Showing {filteredFlags.length} of {displayFlags.length} flags</span>
                    <span>{activeCount} active · {inactiveCount} inactive</span>
                </div>
            </div>

            {/* ════════════════════════════════════════════════
                 CREATE FLAG MODAL (Reuses core FlagForm with JSON type)
                ════════════════════════════════════════════════ */}
            {isCreateModalOpen && (
                <Suspense fallback={<ModalLoader />}>
                    <FlagForm
                        onClose={() => {
                            setIsCreateModalOpen(false);
                            setCreateFlagError(null);
                        }}
                        onSubmit={handleCreateFlag}
                        isSubmitting={isSubmitting}
                        defaultType="JSON"
                        existingKeys={existingKeys}
                        serverError={createFlagError}
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

                    {/* Edit Modal (Reuses core UpdateFlagModal) */}
                    {isEditModalOpen && editFlag && (
                        <Suspense fallback={<ModalLoader />}>
                            <UpdateFlagModal
                                flag={editFlag}
                                onClose={() => { setIsEditModalOpen(false); setEditFlag(null); }}
                                onSubmit={handleUpdateSuccess}
                            />
                        </Suspense>
                    )}

                    {/* Remove Confirmation */}
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

            {toast && (
                <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ zIndex: 100000 }}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ fontSize: '18px' }}></i>
                    {toast.message}
                </div>
            )}
        </>
    );
};

export default JsonFlagTab;
