import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { controlPlaneApi } from '../../api/apiClient';
import { ENDPOINTS } from '../../api/config';
import {
    useDependentFlags, useToggleDependentFlag,
    dependentFlagKeys, unwrapResponse
} from '../../api/queries';
import useAllCoreFlags from '../../hooks/useAllCoreFlags';
import FlagRow from './core-flag/FlagRow';
import CoreFlagSkeleton from './core-flag/CoreFlagSkeleton';
import FlagContextMenu from './core-flag/FlagContextMenu';
import ViewToggle from './dependant-flag/ViewToggle';

// ── Lazy-loaded components ──────────────────────────────────
const DependentFlagForm = lazy(() => import('./dependant-flag/DependentFlagForm'));
const UpdateDependentFlagModal = lazy(() => import('./dependant-flag/UpdateDependentFlagModal'));
const DeleteFlagModal = lazy(() => import('./core-flag/DeleteFlagModal'));
const DependencyGraph = lazy(() => import('./dependant-flag/DependencyGraph'));

// Inline fallback for Suspense
const ModalLoader = () => (
    <div className="modal-overlay" style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <i className="ri-loader-4-line spin" style={{ fontSize: '28px', color: '#f59e0b' }}></i>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Loading form...</span>
        </div>
    </div>
);

// ═════════════════════════════════════════════════════════════
//  DependantFlagTab — Enterprise-grade Dependent Flag management
//  Unified with Core/JSON flag UI using FlagRow + CoreFlagSkeleton.
//  Includes List View (table) and Graph View (SVG visualization).
//  Full CRUD, dependency builder, search, filter, toggle,
//  skeleton loading, toast, keyboard shortcuts.
// ═════════════════════════════════════════════════════════════

const DependantFlagTab = ({ env, envId }) => {
    const queryClient = useQueryClient();

    // ─── Server State ───────────────────────────────────────
    const { data: fetchedFlags, isLoading: isQueryLoading } = useDependentFlags(envId);
    const { allCoreFlags, coreFlagsMap } = useAllCoreFlags(envId);
    const toggleMut = useToggleDependentFlag();

    // ─── Local UI State ─────────────────────────────────────
    const [depFlags, setDepFlags] = useState(() => fetchedFlags || []);
    const [flagSearch, setFlagSearch] = useState('');
    const [flagFilter, setFlagFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    // View toggle (list/graph) - Always defaults to 'list' on mount for consistent UX
    const [activeView, setActiveView] = useState('list');

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createError, setCreateError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
    const [editFlag, setEditFlag] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // ─── Sync server → local state ─────────────────────────
    useEffect(() => {
        if (fetchedFlags) setDepFlags(fetchedFlags);
    }, [fetchedFlags]);

    const isLoading = isQueryLoading && depFlags.length === 0;

    // Auto-collapse expanded row when filtering, searching, or switching views
    useEffect(() => {
        setExpandedId(null);
    }, [flagSearch, flagFilter, activeView]);

    // ─── Memoized Computed Values ───────────────────────────
    const filteredFlags = useMemo(() => depFlags.filter(flag => {
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
    }), [depFlags, flagSearch, flagFilter]);

    const activeCount = useMemo(() => depFlags.filter(f => f.status || f.enabled).length, [depFlags]);
    const inactiveCount = useMemo(() => depFlags.length - activeCount, [depFlags.length, activeCount]);
    const selectedFlag = useMemo(() => depFlags.find(f => f.id === menuOpenId) || null, [depFlags, menuOpenId]);
    const existingKeys = useMemo(() => new Set([...depFlags.map(f => f.key), ...allCoreFlags.map(f => f.key)]), [depFlags, allCoreFlags]);

    // ─── Toggle ─────────────────────────────────────────────
    const handleToggle = useCallback(async (id) => {
        const prev = [...depFlags];
        setDepFlags(curr => curr.map(f => f.id === id ? { ...f, enabled: !f.enabled, status: !f.status } : f));
        try {
            await toggleMut.mutateAsync({ flagId: id });
            queryClient.invalidateQueries({ queryKey: dependentFlagKeys.byEnv(envId) });
        } catch {
            setDepFlags(prev);
            showToast('Failed to toggle flag.', 'error');
        }
    }, [depFlags, toggleMut, queryClient, envId, showToast]);

    // ─── Create ─────────────────────────────────────────────
    const handleCreate = useCallback(async (payload) => {
        setCreateError('');
        setIsCreating(true);
        try {
            await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.DEPENDENT_FLAGS(envId), {
                    method: 'POST', body: JSON.stringify(payload)
                })
            );
            showToast('Dependent flag created successfully!', 'success');
            setIsCreateModalOpen(false);
            setCreateError('');
            setActiveView('list');
            queryClient.invalidateQueries({ queryKey: dependentFlagKeys.byEnv(envId) });
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
        } catch (err) {
            setCreateError(err.message || 'Failed to create flag. Please check your inputs and try again.');
        } finally {
            setIsCreating(false);
        }
    }, [envId, queryClient, showToast, setActiveView]);

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
        setDepFlags(prev => prev.map(f => f.id === updatedData.id ? {
            ...f,
            name: updatedData.displayName || updatedData.key,
            displayName: updatedData.displayName || updatedData.key,
            description: updatedData.description,
            value: updatedData.value,
            enabled: updatedData.enabled ?? f.enabled,
            status: updatedData.enabled ?? f.status,
            rolloutPercentage: updatedData.rolloutPercentage,
            targetingRules: updatedData.targetingRules,
            dependency: updatedData.dependency,
        } : f));
        setIsEditModalOpen(false);
        setEditFlag(null);
        showToast('Dependent flag updated successfully!', 'success');
        queryClient.invalidateQueries({ queryKey: dependentFlagKeys.byEnv(envId) });
        queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }, [queryClient, envId, showToast]);

    const handleOpenRemove = useCallback((flag) => {
        setEditFlag(flag);
        setIsRemoveConfirmOpen(true);
        closeMenu();
    }, [closeMenu]);

    const handleDeleteSuccess = useCallback((flagId) => {
        setDepFlags(prev => prev.filter(f => f.id !== flagId));
        setIsRemoveConfirmOpen(false);
        setEditFlag(null);
        showToast('Dependent flag deleted.', 'success');
        queryClient.invalidateQueries({ queryKey: dependentFlagKeys.byEnv(envId) });
        queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }, [queryClient, envId, showToast]);

    const handleDeleteError = useCallback(() => {
        setIsRemoveConfirmOpen(false);
        showToast('Failed to delete flag.', 'error');
    }, [showToast]);

    // ─── Keyboard Shortcuts ─────────────────────────────────
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

            {/* ── Flags Section ───────────────────────────── */}
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '75vh' }}>
                {/* Toolbar: View Toggle + Search + Filters + Create */}
                <div className="tab-toolbar">
                    <div className="toolbar-left">
                        <h3 className="toolbar-title">Dependent Flags</h3>
                        <span className="toolbar-badge">{filteredFlags.length}</span>
                        <ViewToggle activeView={activeView} onViewChange={setActiveView} />
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
                            <input type="text" value={flagSearch} onChange={(e) => setFlagSearch(e.target.value)} placeholder="Search dependent flags..." />
                            {flagSearch && <i className="ri-close-line" onClick={() => setFlagSearch('')} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px' }}></i>}
                        </div>
                        {/* New Dependent Flag Button */}
                        <button onClick={() => setIsCreateModalOpen(true)} className="btn-gradient" style={{ padding: '7px 16px', fontSize: '13px', background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)', color: '#000' }}>
                            <i className="ri-add-line" style={{ fontSize: '16px' }}></i> New Dependent Flag
                        </button>
                    </div>
                </div>

                {/* ── Content: List View or Graph View ────── */}
                {activeView === 'list' ? (
                    <>
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
                                    {isLoading ? (
                                        <CoreFlagSkeleton count={4} />
                                    ) : depFlags.length === 0 ? (
                                        <tr key="empty-all" className="table-empty-row">
                                            <td colSpan="6">
                                                <i className="ri-git-branch-line table-empty-icon"></i>
                                                <div className="table-empty-title">No dependent flags yet</div>
                                                <div className="table-empty-subtitle" style={{marginBottom: '16px'}}>Create conditional flags that activate based on Core Flag prerequisites.</div>
                                                <button onClick={() => setIsCreateModalOpen(true)} className="btn-gradient" style={{ background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)', color: '#000' }}>
                                                    <i className="ri-add-line" style={{ fontSize: '16px' }}></i> Create First Dependent Flag
                                                </button>
                                            </td>
                                        </tr>
                                    ) : filteredFlags.length > 0 ? filteredFlags.map((flag) => (
                                        <FlagRow
                                            key={flag.id}
                                            flag={flag}
                                            category="DEPENDENT"
                                            isExpanded={expandedId === flag.id}
                                            onToggle={() => handleToggle(flag.id)}
                                            onExpand={() => setExpandedId(expandedId === flag.id ? null : flag.id)}
                                            onMenuOpen={() => openMenu(flag)}
                                            coreFlagsMap={coreFlagsMap}
                                            coreFlags={allCoreFlags}
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
                            <span>Showing {filteredFlags.length} of {depFlags.length} flags</span>
                            <span>{activeCount} active · {inactiveCount} inactive</span>
                        </div>
                    </>
                ) : (
                    /* Graph View */
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <Suspense fallback={
                            <div className="graph-empty-state">
                                <i className="ri-loader-4-line spin" style={{ fontSize: '32px', color: '#f59e0b', opacity: 0.6 }}></i>
                                <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading graph view...</div>
                            </div>
                        }>
                            <DependencyGraph envId={envId} />
                        </Suspense>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════
                 CREATE DEPENDENT FLAG MODAL
                ════════════════════════════════════════════════ */}
            {isCreateModalOpen && (
                <Suspense fallback={<ModalLoader />}>
                    <DependentFlagForm
                        coreFlags={allCoreFlags}
                        onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }}
                        onSubmit={handleCreate}
                        isSubmitting={isCreating}
                        existingKeys={existingKeys}
                        serverError={createError}
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
                            <UpdateDependentFlagModal
                                flag={editFlag}
                                coreFlags={allCoreFlags}
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
                                deleteEndpoint={ENDPOINTS.DEPENDENT_FLAG_BY_ID}
                            />
                        </Suspense>
                    )}
                </div>
            )}
        </>
    );
};

export default DependantFlagTab;
