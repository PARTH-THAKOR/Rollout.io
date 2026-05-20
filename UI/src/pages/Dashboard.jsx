import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import '../styles/welcome.css';
import '../styles/dashboard.css';
import 'remixicon/fonts/remixicon.css';

import AdminProfile from '../components/common/AdminProfile';
import DeleteProjectModal from '../components/common/DeleteProjectModal';
import ProjectCardSkeleton from '../components/dashboard/ProjectCardSkeleton';
import DashboardErrorState from '../components/dashboard/DashboardErrorState';
import DashboardEmptyState from '../components/dashboard/DashboardEmptyState';
import ProjectCard from '../components/dashboard/ProjectCard';
import ProjectModal from '../components/dashboard/ProjectModal';
import { getFriendlyErrorMessage } from '../utils/errorFormatter';

import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, projectKeys, unwrapResponse } from '../api/queries';
import { ENDPOINTS } from '../api/config';
import { controlPlaneApi } from '../api/apiClient';

const Dashboard = () => {
    const queryClient = useQueryClient();

    // ─── Server State (TanStack Query) ──────────────────────
    const { data: projects = [], isLoading, isError, error, refetch } = useProjects();
    const createProjectMutation = useCreateProject();
    const updateProjectMutation = useUpdateProject();
    const deleteProjectMutation = useDeleteProject();

    // ─── Local UI State (useState) ──────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [projectToUpdate, setProjectToUpdate] = useState({ id: null, name: '', description: '' });
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [createError, setCreateError] = useState(null);
    const [updateError, setUpdateError] = useState(null);

    // Toast state
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Delete modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ─── Derived State ──────────────────────────────────────
    // Only show empty state if we successfully fetched and got zero results.
    // Do NOT show empty state when the query errored (e.g., 401 auth failure).
    const isAllProjectsDeleted = projects.length === 0 && !isLoading && !isError;

    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) return projects;
        const query = searchQuery.toLowerCase();
        return projects.filter(project =>
            project.name.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query)
        );
    }, [projects, searchQuery]);

    // ─── Side Effects ───────────────────────────────────────

    // Close action menus on outside click
    useEffect(() => {
        const closeMenu = () => setActionMenuOpenId(null);
        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    }, []);

    // Cursor glow effect
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



    // ─── Mutation Handlers ──────────────────────────────────

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setCreateError(null);
        try {
            await createProjectMutation.mutateAsync({
                name: newProject.name,
                description: newProject.description,
            });
            showToast('Project created successfully!', 'success');
            setIsCreateModalOpen(false);
            setNewProject({ name: '', description: '' });
        } catch (error) {
            console.error('Create project error:', error);
            const msg = getFriendlyErrorMessage(error);
            setCreateError(msg);
        }
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        setUpdateError(null);
        const original = projects.find(p => p.id === projectToUpdate.id);
        try {
            await updateProjectMutation.mutateAsync({
                id: projectToUpdate.id,
                name: projectToUpdate.name,
                description: projectToUpdate.description,
                originalName: original?.name,
                originalDescription: original?.description,
            });
            showToast('Project updated successfully!', 'success');
            setIsUpdateModalOpen(false);
        } catch (error) {
            console.error('Update project error:', error);
            const msg = getFriendlyErrorMessage(error);
            setUpdateError(msg);
        }
    };

    const handleDeleteProject = (id) => {
        setActionMenuOpenId(null);
        const proj = projects.find(p => p.id === id);
        if (proj) {
            setProjectToDelete(proj);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDeleteProject = async (id) => {
        setIsDeleting(true);
        try {
            await deleteProjectMutation.mutateAsync(id);
            showToast('Project deleted successfully!', 'success');
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Delete project error:', error);
            showToast('Failed to delete project.', 'error');
        } finally {
            setIsDeleting(false);
            setProjectToDelete(null);
        }
    };

    /**
     * Open the update modal and populate it with the latest data from backend.
     * Shows the modal immediately with cached card data, then refreshes
     * via `queryClient.fetchQuery` so React Query also caches the result.
     */
    const openUpdateModalWithLatestData = async (project, e) => {
        e.preventDefault();
        e.stopPropagation();
        setActionMenuOpenId(null);

        // Show modal immediately with current card data
        setUpdateError(null);
        setProjectToUpdate({ id: project.id, name: project.name, description: project.description });
        setIsUpdateModalOpen(true);

        // Fetch fresh data through React Query cache
        try {
            const latest = await queryClient.fetchQuery({
                queryKey: projectKeys.detail(project.id),
                queryFn: async () => {
                    return await unwrapResponse(
                        await controlPlaneApi(ENDPOINTS.PROJECT_BY_ID(project.id))
                    );
                },
                staleTime: 0, // Always fetch fresh for modal population
            });
            setProjectToUpdate({
                id: latest.id || project.id,
                name: latest.name || project.name,
                description: latest.description || project.description,
            });
        } catch (error) {
            console.warn("Could not fetch project by ID from API, using cached data:", error);
        }
    };

    // ─── Render Helpers ─────────────────────────────────────

    const renderContent = () => {
        // 1. Loading — show skeleton cards
        if (isLoading) {
            return (
                <div className="projects-grid">
                    <ProjectCardSkeleton count={8} />
                </div>
            );
        }

        // 2. Error — show error state with retry
        if (isError) {
            return <DashboardErrorState message={error?.message} onRetry={() => refetch()} />;
        }

        // 3. Empty — no projects at all
        if (isAllProjectsDeleted) {
            return <DashboardEmptyState onCreateClick={() => setIsCreateModalOpen(true)} />;
        }

        // 4. Data present — show card grid
        return (
            <div className="projects-grid">
                {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isMenuOpen={actionMenuOpenId === project.id}
                            onToggleMenu={() => setActionMenuOpenId(actionMenuOpenId === project.id ? null : project.id)}
                            onUpdate={openUpdateModalWithLatestData}
                            onDelete={handleDeleteProject}
                        />
                    ))
                ) : (
                    <div className="search-no-results">
                        <i className="ri-search-line" />
                        <p>No projects match your search query.</p>
                    </div>
                )}
            </div>
        );
    };

    // ─── JSX ────────────────────────────────────────────────

    return (
        <>
            <div id="cursor-glow" />
            <div className="stars small" />
            <div className="stars medium" />
            <div className="stars large" />

            <div className="dashboard-layout">
                {/* Main Content Area */}
                <div className="main-wrapper">
                    {/* Workspace Top Bar */}
                    <header className="workspace-header">
                        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <Link to="/dashboard" className="logo" style={{ marginBottom: 0, textDecoration: 'none' }}>
                                Rollout<span className="dot">.</span>io
                            </Link>
                            <div className="desktop-only"
                                style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '20px', height: '24px', cursor: 'default' }}>
                                <span
                                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px', color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.5px' }}>TechParaglide.inc</span>
                            </div>
                            {projects.length > 0 && <div className="badge-outline" style={{ marginBottom: 0, marginLeft: '10px' }}>Your Projects</div>}
                        </div>

                        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {projects.length > 0 && (
                                <>
                                    <div className="search-bar glass-panel">
                                        <i className="ri-search-line" />
                                        <input
                                            type="text"
                                            placeholder="Search projects... (Ctrl+K)"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-primary btn-icon btn-stable" onClick={() => setIsCreateModalOpen(true)} style={{ padding: '10px 20px', fontSize: '14px' }}>
                                        <i className="ri-add-line" /> New Project
                                    </button>
                                </>
                            )}
                            <AdminProfile
                                isOpen={activeDropdown === 'profile'}
                                onToggle={(open) => setActiveDropdown(open ? 'profile' : null)}
                            />
                        </div>
                    </header>

                    {/* Dashboard Inner Content */}
                    <main className="dashboard-content">
                        <div className="glass-card projects-hub">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>

            {/* Toast notifications */}
            {toast && (
                <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ zIndex: 100000 }}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ fontSize: '18px' }}></i>
                    {toast.message}
                </div>
            )}

            {/* Update Project Modal */}
            {isUpdateModalOpen && projectToUpdate && (
                <ProjectModal
                    title="Update Project"
                    values={projectToUpdate}
                    onChange={(field, value) => {
                        setProjectToUpdate({ ...projectToUpdate, [field]: value });
                        setUpdateError(null);
                    }}
                    onSubmit={handleUpdateProject}
                    onClose={() => {
                        setIsUpdateModalOpen(false);
                        setUpdateError(null);
                    }}
                    submitLabel="Update changes"
                    serverError={updateError}
                    isSubmitting={updateProjectMutation.isPending}
                />
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <ProjectModal
                    title="Create New Project"
                    values={newProject}
                    onChange={(field, value) => {
                        setNewProject({ ...newProject, [field]: value });
                        setCreateError(null);
                    }}
                    onSubmit={handleCreateProject}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setCreateError(null);
                    }}
                    submitLabel="Create Project"
                    namePlaceholder="e.g. Authentication Service"
                    descPlaceholder="What does this project do?"
                    serverError={createError}
                    isSubmitting={createProjectMutation.isPending}
                />
            )}

            {/* Delete Project Confirmation Modal */}
            {isDeleteModalOpen && projectToDelete && (
                <DeleteProjectModal
                    project={projectToDelete}
                    isDeleting={isDeleting}
                    onConfirm={confirmDeleteProject}
                    onClose={() => {
                        if (!isDeleting) setIsDeleteModalOpen(false);
                    }}
                />
            )}
        </>
    );
};

export default Dashboard;
