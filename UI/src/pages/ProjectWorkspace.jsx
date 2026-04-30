import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import '../styles/welcome.css';
import '../styles/dashboard.css';
import 'remixicon/fonts/remixicon.css';
import '../styles/workspace-tabs.css';
import EnvironmentSelector from '../components/workspace-tabs/EnvironmentSelector';
import AdminProfile from '../components/AdminProfile';
import OverviewTab from '../components/workspace-tabs/OverviewTab';
import WorkspaceSkeleton from '../components/workspace/WorkspaceSkeleton';
import WorkspaceEmptyState from '../components/workspace/WorkspaceEmptyState';
import CreateEnvironmentModal from '../components/workspace/CreateEnvironmentModal';
import { controlPlaneApi } from '../api/apiClient';
import { ENDPOINTS } from '../api/config';
import { unwrapResponse } from '../api/queries';

// ─── Workspace tabs ──────────────────────────────────────
import CoreFlagTab from '../components/workspace-tabs/CoreFlagTab';
import JsonFlagTab from '../components/workspace-tabs/JsonFlagTab';
import DependantFlagTab from '../components/workspace-tabs/DependantFlagTab';
import AuditLogTab from '../components/workspace-tabs/AuditLogTab';
import SettingsTab from '../components/workspace-tabs/SettingsTab';

// Inline spinner for tab transitions
const TabLoader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);
import {
    useProjectById,
    useEnvironments,
    useFlags,
    useCreateEnvironment,
    environmentKeys,
    flagKeys,
} from '../api/queries';

const ProjectWorkspace = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const projectId = searchParams.get('id');
    const defaultProjectName = searchParams.get('name') || '';
    const queryClient = useQueryClient();

    // ─── Server State (TanStack Query) ──────────────────────
    const { data: projectDetails, isLoading: isProjectLoading } = useProjectById(projectId);
    const { data: environmentsData = [], isLoading: isEnvLoading } = useEnvironments(projectDetails?.id);

    // Combined loading state: wait for both project and environments
    const isLoading = isProjectLoading || isEnvLoading;
    const createEnvironmentMutation = useCreateEnvironment();

    // ─── Derived from environments ──────────────────────────
    const environments = environmentsData.map(e => e.name);

    // ─── Local UI State ─────────────────────────────────────
    const VALID_TABS = ['overview', 'core-flag', 'json-flag', 'dependant-flag', 'audit-log', 'settings'];
    const urlTab = searchParams.get('tab');
    let activeTab = (urlTab && VALID_TABS.includes(urlTab)) ? urlTab : 'overview';

    // Edge Case Fix: If no environments exist, forcefully override deep linking to other tabs
    if (!isLoading && environments.length === 0) {
        activeTab = 'overview';
    }

    const setActiveTab = useCallback((tab) => {
        // Refetch environments on tab switch to detect external deletions (e.g. via Postman)
        if (projectDetails?.id) {
            queryClient.invalidateQueries({ queryKey: environmentKeys.byProject(projectDetails.id) });
        }
        
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (tab === 'overview') {
                next.delete('tab');
            } else {
                next.set('tab', tab);
            }
            return next;
        }, { replace: true });
    }, [setSearchParams, projectDetails?.id, queryClient]);

    const [env, setEnv] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isCreateEnvModalOpen, setIsCreateEnvModalOpen] = useState(false);
    const [newEnvName, setNewEnvName] = useState('');
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    const tabsRef = React.useRef([]);

    // ─── Flags: fetched via TanStack Query, but also kept in local state
    //     because CoreFlagTab mutates flags optimistically via setFlags.
    //     This is a bridge pattern: query data seeds local state, but child
    //     components can do immediate optimistic updates without waiting
    //     for a cache invalidation round-trip.
    const currentEnvData = environmentsData.find(e => e.name === env) || environmentsData[0];
    const effectiveEnv = currentEnvData?.name;
    const envId = currentEnvData?.id;
    const { data: fetchedFlags, isLoading: isFlagsLoading } = useFlags(envId);
    const [flags, setFlags] = useState(() => fetchedFlags || []);

    // Sync query data → local state whenever query data changes
    useEffect(() => {
        if (fetchedFlags) {
            setFlags(fetchedFlags);
        }
    }, [fetchedFlags]);

    // ─── If project was looked up by name instead of id ─────
    const [projectDetailsByName, setProjectDetailsByName] = useState(null);

    useEffect(() => {
        if (projectId || projectDetails) return; // Already have it
        const name = searchParams.get('name');
        if (!name) return;

        const fetchByName = async () => {
            try {
                const data = await unwrapResponse(
                    await controlPlaneApi(`${ENDPOINTS.PROJECT_BY_NAME}?name=${encodeURIComponent(name)}`)
                );
                setProjectDetailsByName(Array.isArray(data) ? data[0] : data);
            } catch (error) {
                console.warn("API fetch project by name failed:", error);
            }
        };
        fetchByName();
    }, [searchParams, projectId, projectDetails]);

    // Effective project details (prefer query data, fallback to name-based lookup)
    const effectiveProject = projectDetails || projectDetailsByName;

    // Fix 5: Sync URL name parameter if it doesn't match the actual project name
    useEffect(() => {
        if (effectiveProject && effectiveProject.name && effectiveProject.name !== defaultProjectName) {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('name', effectiveProject.name);
                return next;
            }, { replace: true });
        }
    }, [effectiveProject, defaultProjectName, setSearchParams]);

    // Fix 3: Sync state to effective environment if the selected one is invalid or deleted
    useEffect(() => {
        if (effectiveEnv && env !== effectiveEnv) {
            setEnv(effectiveEnv);
        }
    }, [effectiveEnv, env]);

    // ─── Cursor glow ────────────────────────────────────────
    useEffect(() => {
        const cursor = document.getElementById('cursor-glow');
        const moveCursor = (e) => {
            if (cursor) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }
        };
        document.addEventListener('mousemove', moveCursor);
        return () => document.removeEventListener('mousemove', moveCursor);
    }, []);

    const navItems = [
        { id: 'overview', icon: 'ri-dashboard-line', label: 'Overview', activeBg: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', iconColor: '#38bdf8' },
        { id: 'core-flag', icon: 'ri-flag-2-line', label: 'Core Flag', activeBg: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', iconColor: '#38bdf8' },
        { id: 'json-flag', icon: 'ri-toggle-line', label: 'JSON Flag', activeBg: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', iconColor: '#ef4444' },
        { id: 'dependant-flag', icon: 'ri-node-tree', label: 'Dependent Flag', activeBg: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308', iconColor: '#eab308' },
        { id: 'audit-log', icon: 'ri-history-line', label: 'Audit Log', activeBg: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', iconColor: '#10b981' },
        { id: 'settings', icon: 'ri-settings-3-line', label: 'Settings', activeBg: 'rgba(156, 163, 175, 0.15)', borderColor: '#9ca3af', iconColor: '#9ca3af' }
    ];

    useEffect(() => {
        const activeIndex = navItems.findIndex(item => item.id === activeTab);
        if (activeIndex !== -1 && tabsRef.current[activeIndex]) {
            const el = tabsRef.current[activeIndex];
            setIndicatorStyle({
                left: el.offsetLeft,
                width: el.offsetWidth
            });
        }
    }, [activeTab]);

    // ─── Handlers ───────────────────────────────────────────

    const handleCreateEnvironment = async (e) => {
        e.preventDefault();
        if (!newEnvName.trim() || !effectiveProject?.id) return;

        const envName = newEnvName.trim();
        try {
            await createEnvironmentMutation.mutateAsync({
                projectId: effectiveProject.id,
                name: envName,
            });
        } catch (error) {
            console.error('Create environment error:', error);
        }

        setEnv(envName);
        setIsCreateEnvModalOpen(false);
        setNewEnvName('');
    };

    // ─── Setter bridge for SettingsTab ──────────────────────
    // SettingsTab needs to modify environmentsData locally (e.g., after SDK key rotation).
    // This function wraps queryClient.setQueryData to maintain compatibility.
    const setEnvironmentsData = (updater) => {
        if (!effectiveProject?.id) return;
        queryClient.setQueryData(
            environmentKeys.byProject(effectiveProject.id),
            typeof updater === 'function'
                ? updater
                : () => updater
        );
    };

    return (
        <>
            <div id="cursor-glow"></div>

            <div className="dashboard-layout">
                {/* Main Content */}
                <div className="main-wrapper">
                    <div className="workspace-header" style={{ background: '#07030edf' }}>
                        <div className="header-left" style={{ flex: 1, paddingLeft: '4px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '4px 14px 4px 6px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 2px 8px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)' }}>
                                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.55)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s ease', padding: '5px 10px', borderRadius: '6px' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)'; e.currentTarget.style.background = 'transparent'; }}>
                                    <i className="ri-dashboard-horizontal-line" style={{ fontSize: '15px' }}></i>
                                    Projects
                                </Link>
                                
                                <i className="ri-arrow-right-s-line" style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '16px', margin: '0 4px' }}></i>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                        <i className="ri-folder-3-fill" style={{ fontSize: '13px', color: '#38bdf8' }}></i>
                                    </div>
                                    <span style={{ color: '#fff', fontSize: '13.5px', fontWeight: 600, letterSpacing: '0.2px' }}>{effectiveProject?.name || defaultProjectName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Centered Menubar inside Header */}
                        <div className="header-menubar" style={{ display: 'flex', height: '100%', alignItems: 'center', position: 'relative' }}>
                            {navItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    ref={el => tabsRef.current[index] = el}
                                    onClick={() => {
                                        if (environments.length === 0 && item.id !== 'overview') return;
                                        setActiveTab(item.id);
                                    }}
                                    style={{
                                        cursor: environments.length === 0 && item.id !== 'overview' ? 'not-allowed' : 'pointer',
                                        opacity: environments.length === 0 && item.id !== 'overview' ? 0.4 : 1,
                                        fontSize: '14.5px',
                                        fontFamily: '"Inter", "Outfit", "Segoe UI", sans-serif',
                                        fontWeight: activeTab === item.id ? 600 : 500,
                                        color: activeTab === item.id ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 24px',
                                        transition: 'color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        letterSpacing: '0.4px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== item.id) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== item.id) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                                    }}
                                >
                                    {item.label}
                                </div>
                            ))}
                            {/* Sliding Indicator */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: `${indicatorStyle.left}px`,
                                    width: `${indicatorStyle.width}px`,
                                    height: '3px',
                                    background: 'linear-gradient(90deg, rgba(56, 189, 248, 1) 0%, rgba(147, 51, 234, 1) 100%)',
                                    borderTopLeftRadius: '3px',
                                    borderTopRightRadius: '3px',
                                    boxShadow: '0 -4px 12px rgba(147, 51, 234, 0.5)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            ></div>
                        </div>

                        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end' }}>
                            {/* Environment Dropdown */}
                            <EnvironmentSelector
                                environments={environments}
                                isLoading={isLoading}
                                currentEnv={env}
                                onSelectEnv={setEnv}
                                onCreateClick={() => setIsCreateEnvModalOpen(true)}
                                isOpen={activeDropdown === 'env'}
                                onToggle={(open) => setActiveDropdown(open ? 'env' : null)}
                            />
                            <AdminProfile
                                isOpen={activeDropdown === 'profile'}
                                onToggle={(open) => setActiveDropdown(open ? 'profile' : null)}
                            />
                        </div>
                    </div>

                    <main className="dashboard-content" style={{ padding: '30px', background: '#07030edf', minHeight: 'calc(100vh - 76px)', overflowY: 'auto' }}>
                        {isLoading || (isFlagsLoading && !env) ? (
                            <WorkspaceSkeleton activeTab={activeTab} />
                        ) : (
                                <div key={activeTab} style={{ animation: 'slideUpFade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards', height: '100%' }}>
                                    {activeTab === 'overview' && (
                                        environments.length === 0 ? (
                                            <WorkspaceEmptyState onCreateClick={() => setIsCreateEnvModalOpen(true)} />
                                        ) : (
                                            <OverviewTab env={effectiveEnv} envId={envId} flags={flags} sdkKey={currentEnvData?.sdkKey} />
                                        )
                                    )}
                                    {activeTab === 'core-flag' && <CoreFlagTab flags={flags} setFlags={setFlags} env={effectiveEnv} envId={envId} isFlagsLoading={isFlagsLoading} />}
                                    {activeTab === 'json-flag' && <JsonFlagTab env={effectiveEnv} envId={envId} />}
                                    {activeTab === 'dependant-flag' && <DependantFlagTab env={effectiveEnv} envId={envId} />}
                                    {activeTab === 'audit-log' && <AuditLogTab env={effectiveEnv} envId={envId} />}
                                    {activeTab === 'settings' && <SettingsTab projectDetails={effectiveProject} env={effectiveEnv} setEnv={setEnv} environmentsData={environmentsData} setEnvironmentsData={setEnvironmentsData} />}
                                </div>
                        )}
                    </main>

                </div>
            </div>
            {/* Create Environment Modal */}
            {isCreateEnvModalOpen && (
                <CreateEnvironmentModal
                    onClose={() => setIsCreateEnvModalOpen(false)}
                    onSubmit={(name) => {
                        setNewEnvName(name); // State updates then handleCreateEnvironment will be triggered implicitly or explicitly
                        // Wait, handleCreateEnvironment uses newEnvName from state, but the child manages its own state now.
                        // I should pass a callback that takes the submitted name.
                        if (!name.trim() || !effectiveProject?.id) return;
                        createEnvironmentMutation.mutateAsync({
                            projectId: effectiveProject.id,
                            name: name.trim(),
                        }).then(() => {
                            setEnv(name.trim());
                            setIsCreateEnvModalOpen(false);
                        }).catch(console.error);
                    }}
                />
            )}

            <style>
                {`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUpFade { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                @keyframes skeleton-pulse { 50% { opacity: 0.5; } }
                @keyframes pulseDot {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.4); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.6; }
                }
                `}
            </style>
        </>
    );
};

export default ProjectWorkspace;
