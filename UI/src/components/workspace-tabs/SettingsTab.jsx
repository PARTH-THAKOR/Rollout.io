import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { controlPlaneApi } from '../../api/apiClient';
import { ENDPOINTS } from '../../api/config';
import { environmentKeys, projectKeys, unwrapResponse } from '../../api/queries';

const SettingsTab = ({ projectDetails, env, setEnv, environmentsData, setEnvironmentsData }) => {
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Form States
    const [projectName, setProjectName] = useState(projectDetails?.name || '');
    const [projectDesc, setProjectDesc] = useState(projectDetails?.description || '');
    const [envNameInput, setEnvNameInput] = useState(env);

    useEffect(() => {
        setEnvNameInput(env);
    }, [env]);

    // SDK Key masking
    const [isKeyVisible, setIsKeyVisible] = useState(false);

    // Look up the SDK Key from the environmentsData for the current env
    const currentEnvironmentData = environmentsData?.find(e => e.name === env);
    const displayedSdkKey = currentEnvironmentData?.sdkKey || "sdk_not_found";

    const maskedKey = displayedSdkKey !== 'sdk_not_found' 
        ? `sdk_${'*'.repeat(16)}${displayedSdkKey.slice(-4)}`
        : 'sdk_not_found';

    const [isRotating, setIsRotating] = useState(false);

    // Fetch the latest environment data by ID right when viewing settings
    useEffect(() => {
        const fetchLatestEnvironment = async () => {
            if (currentEnvironmentData?.id) {
                try {
                    const data = await unwrapResponse(
                        await controlPlaneApi(ENDPOINTS.ENVIRONMENT_BY_ID(currentEnvironmentData.id))
                    );
                    if (setEnvironmentsData) {
                        setEnvironmentsData(prev => prev.map(e => e.id === currentEnvironmentData.id ? data : e));
                    }
                } catch (err) {
                    console.warn("Failed to fetch environment:", err);
                }
            }
        };
        fetchLatestEnvironment();
    }, [currentEnvironmentData?.id]); 

    // Validation
    const hasChanges = useMemo(() => {
        return (
            projectName.trim() !== (projectDetails?.name || '') ||
            projectDesc.trim() !== (projectDetails?.description || '') ||
            envNameInput.trim() !== env
        );
    }, [projectName, projectDesc, envNameInput, projectDetails, env]);

    const isValid = projectName.trim().length > 0 && envNameInput.trim().length > 0;

    const handleSave = async () => {
        if (!hasChanges || !isValid) return;
        setIsSaving(true);

        try {
            // Environment Name Update via PATCH API
            if (envNameInput.trim() !== env && currentEnvironmentData?.id) {
                const data = await unwrapResponse(
                    await controlPlaneApi(`${ENDPOINTS.ENVIRONMENT_UPDATE_NAME(currentEnvironmentData.id)}?newName=${encodeURIComponent(envNameInput.trim())}`, {
                        method: 'PATCH'
                    })
                );
                if (setEnvironmentsData) {
                    setEnvironmentsData(prev => prev.map(e => e.id === currentEnvironmentData.id ? data : e));
                }
                if (setEnv) {
                    setEnv(data.name);
                }
            }

            // Project Name Update
            if (projectName.trim() !== projectDetails?.name && projectDetails?.id) {
                await unwrapResponse(
                    await controlPlaneApi(`${ENDPOINTS.PROJECT_UPDATE_NAME(projectDetails.id)}?newName=${encodeURIComponent(projectName.trim())}`, {
                        method: 'PATCH'
                    })
                );
            }

            // Project Desc Update
            if (projectDesc.trim() !== projectDetails?.description && projectDetails?.id) {
                await unwrapResponse(
                    await controlPlaneApi(`${ENDPOINTS.PROJECT_UPDATE_DESC(projectDetails.id)}?newDescription=${encodeURIComponent(projectDesc.trim())}`, {
                        method: 'PATCH'
                    })
                );
            }

            if (projectDetails?.id) {
                queryClient.invalidateQueries({ queryKey: environmentKeys.byProject(projectDetails.id) });
                queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectDetails.id) });
                queryClient.invalidateQueries({ queryKey: projectKeys.all });
            }
            
            showToast('Settings saved successfully!', 'success');
        } catch (e) {
            console.error('Error saving settings:', e);
            showToast('Failed to save settings.', 'error');
        }

        setIsSaving(false);
    };

    const handleRotateSdkKey = async () => {
        if (!currentEnvironmentData?.id) return;

        setIsRotating(true);
        try {
            const data = await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.ENVIRONMENT_ROTATE_KEY(currentEnvironmentData.id), {
                    method: 'PATCH'
                })
            );
            if (setEnvironmentsData) {
                setEnvironmentsData(prev => prev.map(e => e.name === env ? data : e));
            }
            if (projectDetails?.id) {
                queryClient.invalidateQueries({ queryKey: environmentKeys.byProject(projectDetails.id) });
            }
            showToast('SDK Key rotated successfully.', 'success');
        } catch (error) {
            console.error('Error rotating SDK key:', error);
            showToast('Failed to rotate SDK key.', 'error');
        } finally {
            setIsRotating(false);
        }
    };

    const handleCopySdkKey = () => {
        navigator.clipboard.writeText(displayedSdkKey);
        showToast('SDK Key copied to clipboard', 'success');
    };

    // ─── Modal States ────────────────────────────────────────
    const [isDeleteEnvOpen, setIsDeleteEnvOpen] = useState(false);
    const [deleteEnvInput, setDeleteEnvInput] = useState('');
    const [isDeletingEnv, setIsDeletingEnv] = useState(false);

    const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
    const [deleteProjectInput, setDeleteProjectInput] = useState('');
    const [isDeletingProject, setIsDeletingProject] = useState(false);

    const handleDeleteEnvironment = async () => {
        if (!currentEnvironmentData?.id) return;
        setIsDeletingEnv(true);

        try {
            await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.ENVIRONMENT_BY_ID(currentEnvironmentData.id), {
                    method: 'DELETE'
                })
            );
            showToast('Environment deleted successfully.', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch (error) {
            console.error('Error deleting environment:', error);
            showToast('Failed to delete environment.', 'error');
            setIsDeletingEnv(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!projectDetails?.id) return;
        setIsDeletingProject(true);

        try {
            await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.PROJECT_BY_ID(projectDetails.id), {
                    method: 'DELETE'
                })
            );
            showToast('Project deleted successfully.', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch (error) {
            console.error('Error deleting project:', error);
            showToast('Failed to delete project.', 'error');
            setIsDeletingProject(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 24px', width: '100%', height: '100%', position: 'relative' }}>
            {toast && (
                <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ zIndex: 100 }}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ fontSize: '18px' }}></i>
                    {toast.message}
                </div>
            )}
            <div className="glass-card" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', height: '100%', position: 'relative' }}>
                <div style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#fff', letterSpacing: '-0.02em' }}>Settings</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Manage project configuration, environments, and access keys.</p>
                </div>

                <div style={{ padding: '32px 40px 100px 40px', display: 'flex', flexDirection: 'column', gap: '40px', overflowY: 'auto' }}>
                    {/* General Section */}
                    <div>
                        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="ri-settings-4-line" style={{ color: '#38bdf8' }}></i> General
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Project Name</label>
                                <input type="text" className={`login-input ${projectName.trim().length === 0 ? 'input-error' : ''}`} value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ width: '100%' }} />
                                {projectName.trim().length === 0 && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>Project name cannot be empty.</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="login-input" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Environment Section */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
                        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="ri-cloud-line" style={{ color: '#10b981' }}></i> Environment Configuration
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Active Environment Name ({env})</label>
                                <input type="text" className={`login-input ${envNameInput.trim().length === 0 ? 'input-error' : ''}`} value={envNameInput} onChange={(e) => setEnvNameInput(e.target.value)} style={{ width: '100%' }} />
                                {envNameInput.trim().length === 0 && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>Environment name cannot be empty.</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">SDK Key</label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <input type="text" readOnly className="login-input" value={isKeyVisible ? displayedSdkKey : maskedKey} style={{ width: '100%', opacity: 0.8, fontFamily: 'monospace', paddingRight: '40px' }} />
                                        <i className={isKeyVisible ? "ri-eye-off-line" : "ri-eye-line"} onClick={() => setIsKeyVisible(!isKeyVisible)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}></i>
                                    </div>
                                    <button className="btn" onClick={handleCopySdkKey} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)' }}><i className="ri-file-copy-line"></i></button>
                                    <button className="btn" disabled={isRotating} onClick={handleRotateSdkKey} style={{ padding: '12px 20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', opacity: isRotating ? 0.6 : 1 }}>
                                        {isRotating ? <i className="ri-loader-4-line spin"></i> : <i className="ri-refresh-line"></i>} Rotate Key
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
                        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="ri-error-warning-fill"></i> Danger Zone
                        </h4>
                        <div style={{ background: 'rgba(239,68,68,0.03)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.3)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h4 style={{ margin: '0 0 6px 0', color: '#ef4444', fontSize: '15px', fontWeight: '600' }}>Delete Environment</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                                        Permanently delete the environment <strong>{env}</strong>. This removes all flags and SDK keys for this environment.
                                    </p>
                                </div>
                                <button className="btn" onClick={() => setIsDeleteEnvOpen(true)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.5)', padding: '10px 20px', fontWeight: '500' }}>Delete Environment</button>
                            </div>
                            <div style={{ height: '1px', background: 'rgba(239,68,68,0.15)' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h4 style={{ margin: '0 0 6px 0', color: '#ef4444', fontSize: '15px', fontWeight: '600' }}>Delete Project</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                                        This action cannot be undone. All environments, flags, and data will be permanently deleted.
                                    </p>
                                </div>
                                <button className="btn" onClick={() => setIsDeleteProjectOpen(true)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 24px', fontWeight: '500', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>Delete Project</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(7, 3, 14, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 40px', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px', zIndex: 10 }}>
                    <button className="btn btn-primary" disabled={isSaving || !hasChanges || !isValid} onClick={handleSave} style={{ padding: '10px 28px', background: (!hasChanges || !isValid) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)', color: (!hasChanges || !isValid) ? 'rgba(255,255,255,0.3)' : '#fff', opacity: isSaving ? 0.7 : 1, transition: 'all 0.2s', fontWeight: 600 }}>
                        {isSaving ? <i className="ri-loader-4-line spin" style={{ marginRight: '8px' }}></i> : ''}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Modal: Delete Environment */}
            {isDeleteEnvOpen && (
                <div className="modal-overlay" onClick={() => !isDeletingEnv && setIsDeleteEnvOpen(false)} style={{ zIndex: 1000 }}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '92%', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <i className="ri-alert-fill" style={{ fontSize: '24px', color: '#ef4444' }}></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 600 }}>Delete Environment</h3>
                            </div>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                            This action will permanently delete all flags and SDK keys for this environment.
                            <strong style={{ color: '#ef4444', display: 'block', marginTop: '6px' }}>This action cannot be undone.</strong>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                                To confirm, please type <strong style={{ color: '#fff' }}>{env}</strong> below:
                            </label>
                            <input type="text" value={deleteEnvInput} onChange={(e) => setDeleteEnvInput(e.target.value)} className="login-input" placeholder={env} style={{ width: '100%', boxSizing: 'border-box' }} autoFocus />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsDeleteEnvOpen(false)} className="btn-ghost" disabled={isDeletingEnv}>Cancel</button>
                            <button onClick={handleDeleteEnvironment} disabled={deleteEnvInput !== env || isDeletingEnv} style={{ background: (deleteEnvInput !== env || isDeletingEnv) ? 'rgba(239, 68, 68, 0.4)' : '#ef4444', color: (deleteEnvInput !== env || isDeletingEnv) ? 'rgba(255,255,255,0.5)' : '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: 600, cursor: (deleteEnvInput !== env || isDeletingEnv) ? 'not-allowed' : 'pointer' }}>
                                {isDeletingEnv ? 'Deleting...' : 'Delete Environment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Delete Project */}
            {isDeleteProjectOpen && (
                <div className="modal-overlay" onClick={() => !isDeletingProject && setIsDeleteProjectOpen(false)} style={{ zIndex: 1000 }}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '92%', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <i className="ri-error-warning-fill" style={{ fontSize: '24px', color: '#ef4444' }}></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 600 }}>Delete Project</h3>
                            </div>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                            This action cannot be undone. All environments, flags, and data will be permanently deleted.
                            <strong style={{ color: '#ef4444', display: 'block', marginTop: '6px' }}>Proceed with extreme caution.</strong>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                                To confirm, please type <strong style={{ color: '#fff' }}>{projectDetails?.name}</strong> below:
                            </label>
                            <input type="text" value={deleteProjectInput} onChange={(e) => setDeleteProjectInput(e.target.value)} className="login-input" placeholder={projectDetails?.name} style={{ width: '100%', boxSizing: 'border-box' }} autoFocus />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsDeleteProjectOpen(false)} className="btn-ghost" disabled={isDeletingProject}>Cancel</button>
                            <button onClick={handleDeleteProject} disabled={deleteProjectInput !== projectDetails?.name || isDeletingProject} style={{ background: (deleteProjectInput !== projectDetails?.name || isDeletingProject) ? 'rgba(239, 68, 68, 0.4)' : '#ef4444', color: (deleteProjectInput !== projectDetails?.name || isDeletingProject) ? 'rgba(255,255,255,0.5)' : '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: 600, cursor: (deleteProjectInput !== projectDetails?.name || isDeletingProject) ? 'not-allowed' : 'pointer' }}>
                                {isDeletingProject ? 'Deleting...' : 'Delete Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsTab;
