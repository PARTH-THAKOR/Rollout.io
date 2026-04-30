 import React, { useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import '../styles/welcome.css';
import '../styles/dashboard.css';
import 'remixicon/fonts/remixicon.css';

import Sidebar from '../components/Sidebar';
import ProjectCardSkeleton from '../components/dashboard/ProjectCardSkeleton';
import DashboardErrorState from '../components/dashboard/DashboardErrorState';
import DashboardEmptyState from '../components/dashboard/DashboardEmptyState';
import ProjectCard from '../components/dashboard/ProjectCard';
import ProjectModal from '../components/dashboard/ProjectModal';

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
        try {
            await createProjectMutation.mutateAsync({
                name: newProject.name,
                description: newProject.description,
            });
        } catch (error) {
            console.error('Create project error:', error);
        }
        setIsCreateModalOpen(false);
        setNewProject({ name: '', description: '' });
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        const original = projects.find(p => p.id === projectToUpdate.id);
        try {
            await updateProjectMutation.mutateAsync({
                id: projectToUpdate.id,
                name: projectToUpdate.name,
                description: projectToUpdate.description,
                originalName: original?.name,
                originalDescription: original?.description,
            });
        } catch (error) {
            console.error('Update project error:', error);
        }
        setIsUpdateModalOpen(false);
    };

    const handleDeleteProject = async (id) => {
        setActionMenuOpenId(null);
        try {
            await deleteProjectMutation.mutateAsync(id);
        } catch (error) {
            console.error('Delete project error:', error);
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
                    <ProjectCardSkeleton count={6} />
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
                {/* Collapsible Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="main-wrapper">
                    {/* Workspace Top Bar */}
                    <header className="workspace-header">
                        <div className="header-left">
                            {projects.length > 0 && <div className="badge-outline" style={{ marginBottom: 0 }}>Your Projects</div>}
                        </div>

                        <div className="header-right">
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

            {/* Update Project Modal */}
            {isUpdateModalOpen && projectToUpdate && (
                <ProjectModal
                    title="Update Project"
                    values={projectToUpdate}
                    onChange={(field, value) => setProjectToUpdate({ ...projectToUpdate, [field]: value })}
                    onSubmit={handleUpdateProject}
                    onClose={() => setIsUpdateModalOpen(false)}
                    submitLabel="Update changes"
                />
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <ProjectModal
                    title="Create New Project"
                    values={newProject}
                    onChange={(field, value) => setNewProject({ ...newProject, [field]: value })}
                    onSubmit={handleCreateProject}
                    onClose={() => setIsCreateModalOpen(false)}
                    submitLabel="Create Project"
                    namePlaceholder="e.g. Authentication Service"
                    descPlaceholder="What does this project do?"
                />
            )}
        </>
    );
};

export default Dashboard;
