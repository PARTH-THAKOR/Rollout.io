
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { controlPlaneApi } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/config';
import { environmentKeys, projectKeys, unwrapResponse } from '../../../api/queries';
import DeleteProjectModal from '../../common/DeleteProjectModal';
import { getFriendlyErrorMessage } from '../../../utils/errorFormatter';
import '../../../styles/pages/workspace-settings.css';

const SettingsTab = ({ projectDetails, env, setEnv, environmentsData }) => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [sdkError, setSdkError] = useState(null);
    const [deleteEnvError, setDeleteEnvError] = useState(null);
    const [deleteProjectError, setDeleteProjectError] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Form States
    const [projectName, setProjectName] = useState(projectDetails?.name || '');
    const [projectDesc, setProjectDesc] = useState(projectDetails?.description || '');
    const [envNameInput, setEnvNameInput] = useState(env);

    // Sync form states with query details when loaded
    useEffect(() => {
        if (projectDetails) {
            setProjectName(projectDetails.name || '');
            setProjectDesc(projectDetails.description || '');
        }
    }, [projectDetails]);

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

    // Fetch latest environment data by invalidating query cache on mount/change
    useEffect(() => {
        if (projectDetails?.id) {
            queryClient.invalidateQueries({ queryKey: environmentKeys.byProject(projectDetails.id) });
        }
    }, [currentEnvironmentData?.id, projectDetails?.id, queryClient]);

    // Validation & Length Limits
    const NAME_MAX = 50;
    const DESC_MAX = 200;
    const ENV_MAX = 50;

    const nameLen = projectName.length;
    const descLen = projectDesc.length;
    const envLen = envNameInput.length;

    const nameCountClass = nameLen >= NAME_MAX ? 'error' : nameLen >= 40 ? 'warning' : '';
    const descCountClass = descLen >= DESC_MAX ? 'error' : descLen >= 170 ? 'warning' : '';
    const envCountClass = envLen >= ENV_MAX ? 'error' : envLen >= 40 ? 'warning' : '';

    const hasChanges = useMemo(() => {
        return (
            projectName.trim() !== (projectDetails?.name || '') ||
            projectDesc.trim() !== (projectDetails?.description || '') ||
            envNameInput.trim() !== env
        );
    }, [projectName, projectDesc, envNameInput, projectDetails, env]);

    const isValid = projectName.trim().length > 0 && 
                    projectName.length <= NAME_MAX &&
                    projectDesc.trim().length > 0 &&
                    projectDesc.length <= DESC_MAX &&
                    envNameInput.trim().length > 0 &&
                    envNameInput.length <= ENV_MAX;

    const handleSave = async () => {
        if (!hasChanges || !isValid) return;
        setIsSaving(true);
        setSaveError(null);

        try {
            // Environment Name Update via PATCH API
            if (envNameInput.trim() !== env && currentEnvironmentData?.id) {
                const data = await unwrapResponse(
                    await controlPlaneApi(`${ENDPOINTS.ENVIRONMENT_UPDATE_NAME(currentEnvironmentData.id)}?newName=${encodeURIComponent(envNameInput.trim())}`, {
                        method: 'PATCH'
                    })
                );
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
                
                // Update URL search parameters immediately
                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('name', projectName.trim());
                    return next;
                }, { replace: true });

                // Seed the React Query cache for the new project name immediately
                const updatedProject = {
                    ...projectDetails,
                    name: projectName.trim(),
                    description: projectDesc.trim()
                };
                queryClient.setQueryData(['projects', 'by-name', projectName.trim()], updatedProject);
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
            const msg = getFriendlyErrorMessage(e);
            setSaveError(msg);
        }

        setIsSaving(false);
    };

    const handleRotateSdkKey = async () => {
        if (!currentEnvironmentData?.id) return;

        setIsRotating(true);
        setSdkError(null);
        try {
            await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.ENVIRONMENT_ROTATE_KEY(currentEnvironmentData.id), {
                    method: 'PATCH'
                })
            );
            if (projectDetails?.id) {
                queryClient.invalidateQueries({ queryKey: environmentKeys.byProject(projectDetails.id) });
            }
            showToast('SDK Key rotated successfully.', 'success');
        } catch (error) {
            console.error('Error rotating SDK key:', error);
            const msg = getFriendlyErrorMessage(error);
            setSdkError(msg);
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
    const [isDeletingProject, setIsDeletingProject] = useState(false);

    const handleDeleteEnvironment = async () => {
        if (!currentEnvironmentData?.id) return;
        setIsDeletingEnv(true);
        setDeleteEnvError(null);

        try {
            await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.ENVIRONMENT_BY_ID(currentEnvironmentData.id), {
                    method: 'DELETE'
                })
            );
            showToast('Environment deleted successfully.', 'success');
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1000);
        } catch (error) {
            console.error('Error deleting environment:', error);
            const msg = getFriendlyErrorMessage(error);
            setDeleteEnvError(msg);
            setIsDeletingEnv(false);
        }
    };

    const handleDeleteProject = async (id) => {
        setIsDeletingProject(true);
        setDeleteProjectError(null);

        try {
            await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.PROJECT_BY_ID(id), {
                    method: 'DELETE'
                })
            );
            showToast('Project deleted successfully.', 'success');
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1000);
        } catch (error) {
            console.error('Error deleting project:', error);
            const msg = getFriendlyErrorMessage(error);
            setDeleteProjectError(msg);
            setIsDeletingProject(false);
        }
    };

    return (
        <div className="settings-tab-wrapper">
            {toast && (
                <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ zIndex: 100 }}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ fontSize: '18px' }}></i>
                    {toast.message}
                </div>
            )}
            <div className="glass-card settings-glass-card">
                <div className="settings-header">
                    <h3>Settings</h3>
                    <p>Manage project configuration, environments, and access keys.</p>
                </div>

                <div className="settings-content">
                    {saveError && (
                        <div style={{
                            padding: '12px 16px', marginBottom: '20px', borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <i className="ri-error-warning-fill" style={{ color: '#f87171', fontSize: '16px', flexShrink: 0, marginTop: '1px' }}></i>
                            <div style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.5, wordBreak: 'break-word', textAlign: 'left' }}>{saveError}</div>
                        </div>
                    )}

                    {/* General Section */}
                    <div className="settings-section">
                        <h4 className="settings-section-title">
                            <i className="ri-settings-4-line" style={{ color: '#38bdf8' }}></i> General
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">
                                    Project Name <span className="form-required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    className={`login-input ${projectName.trim().length === 0 ? 'input-error' : projectName.length > NAME_MAX ? 'input-error' : ''}`} 
                                    value={projectName} 
                                    onChange={(e) => setProjectName(e.target.value)} 
                                    maxLength={NAME_MAX + 5} 
                                />
                                {projectName.trim().length === 0 && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>Project name cannot be empty.</span>}
                                {projectName.length > 0 && (
                                    <div className={`char-count ${nameCountClass}`}>
                                        {nameLen}/{NAME_MAX}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Description <span className="form-required">*</span>
                                </label>
                                <textarea 
                                    className={`login-input ${projectDesc.trim().length === 0 ? 'input-error' : projectDesc.length > DESC_MAX ? 'input-error' : ''}`} 
                                    value={projectDesc} 
                                    onChange={(e) => setProjectDesc(e.target.value)} 
                                    maxLength={DESC_MAX + 10} 
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                />
                                {projectDesc.trim().length === 0 && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>Description cannot be empty.</span>}
                                {projectDesc.length > 0 && (
                                    <div className={`char-count ${descCountClass}`}>
                                        {descLen}/{DESC_MAX}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Environment Section */}
                    <div className="settings-section settings-section-divider">
                        <h4 className="settings-section-title">
                            <i className="ri-cloud-line" style={{ color: '#10b981' }}></i> Environment Configuration
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">
                                    Active Environment Name ({env}) <span className="form-required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    className={`login-input ${envNameInput.trim().length === 0 ? 'input-error' : envNameInput.length > ENV_MAX ? 'input-error' : ''}`} 
                                    value={envNameInput} 
                                    onChange={(e) => setEnvNameInput(e.target.value)} 
                                    maxLength={ENV_MAX + 5} 
                                />
                                {envNameInput.trim().length === 0 && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>Environment name cannot be empty.</span>}
                                {envNameInput.length > 0 && (
                                    <div className={`char-count ${envCountClass}`}>
                                        {envLen}/{ENV_MAX}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">SDK Key</label>
                                {sdkError && (
                                    <div style={{
                                        padding: '10px 14px', marginBottom: '10px', borderRadius: '8px',
                                        background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                        display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeIn 0.2s ease-out'
                                    }}>
                                        <i className="ri-error-warning-fill" style={{ color: '#f87171', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}></i>
                                        <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.4, wordBreak: 'break-word', textAlign: 'left' }}>{sdkError}</div>
                                    </div>
                                )}
                                <div className="sdk-key-row">
                                    <div className="sdk-key-input-container">
                                        <input type="text" readOnly className="login-input" value={isKeyVisible ? displayedSdkKey : maskedKey} />
                                        <i onClick={() => setIsKeyVisible(!isKeyVisible)} className={`sdk-key-toggle-visibility ${isKeyVisible ? "ri-eye-off-line" : "ri-eye-line"}`}></i>
                                    </div>
                                    <button className="sdk-copy-btn" onClick={handleCopySdkKey} title="Copy Key">
                                        <i className="ri-file-copy-line"></i>
                                    </button>
                                    <button className="sdk-rotate-btn" disabled={isRotating} onClick={handleRotateSdkKey}>
                                        {isRotating ? <i className="ri-loader-4-line spin"></i> : <i className="ri-refresh-line"></i>} Rotate Key
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="settings-section settings-section-divider">
                        <h4 className="settings-section-title" style={{ color: '#ef4444' }}>
                            <i className="ri-error-warning-fill"></i> Danger Zone
                        </h4>
                        <div className="danger-zone-container">
                            <div className="danger-zone-row">
                                <div className="danger-zone-info">
                                    <h5>Delete Environment</h5>
                                    <p>
                                        Permanently delete the environment <strong>{env}</strong>. This removes all flags and SDK keys for this environment.
                                    </p>
                                </div>
                                <button className="danger-zone-btn-outline" onClick={() => setIsDeleteEnvOpen(true)}>Delete Environment</button>
                            </div>
                            <div className="danger-zone-divider"></div>
                            <div className="danger-zone-row">
                                <div className="danger-zone-info">
                                    <h5>Delete Project</h5>
                                    <p>
                                        This action cannot be undone. All environments, flags, and data will be permanently deleted.
                                    </p>
                                </div>
                                <button className="danger-zone-btn-solid" onClick={() => setIsDeleteProjectOpen(true)}>Delete Project</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="settings-sticky-footer">
                    <button className="btn btn-primary" disabled={isSaving || !hasChanges || !isValid} onClick={handleSave} style={{ padding: '10px 28px', background: (!hasChanges || !isValid) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)', color: (!hasChanges || !isValid) ? 'rgba(255,255,255,0.3)' : '#fff', opacity: isSaving ? 0.7 : 1, transition: 'all 0.2s', fontWeight: 600 }}>
                        {isSaving ? <i className="ri-loader-4-line spin" style={{ marginRight: '8px' }}></i> : ''}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Modal: Delete Environment */}
            {isDeleteEnvOpen && (
                <div className="modal-overlay" onClick={() => { if (!isDeletingEnv) { setIsDeleteEnvOpen(false); setDeleteEnvInput(''); setDeleteEnvError(null); } }}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '92%', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <i className="ri-alert-fill" style={{ fontSize: '24px', color: '#ef4444' }}></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 600 }}>Delete Environment</h3>
                            </div>
                        </div>
                        {deleteEnvError && (
                            <div style={{
                                padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeIn 0.2s ease-out'
                            }}>
                                <i className="ri-error-warning-fill" style={{ color: '#f87171', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}></i>
                                <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.4, wordBreak: 'break-word', textAlign: 'left' }}>{deleteEnvError}</div>
                            </div>
                        )}
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                            This action will permanently delete all flags and SDK keys for this environment.
                            <strong style={{ color: '#ef4444', display: 'block', marginTop: '6px' }}>This action cannot be undone.</strong>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                                To confirm, please type <strong style={{ color: '#fff' }}>{env}</strong> below:
                            </label>
                            <input type="text" value={deleteEnvInput} onChange={(e) => setDeleteEnvInput(e.target.value)} className="login-input" placeholder={env} style={{ width: '100%' }} autoFocus />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => { setIsDeleteEnvOpen(false); setDeleteEnvInput(''); setDeleteEnvError(null); }} className="btn-ghost" disabled={isDeletingEnv}>Cancel</button>
                            <button onClick={handleDeleteEnvironment} disabled={deleteEnvInput !== env || isDeletingEnv} style={{ background: (deleteEnvInput !== env || isDeletingEnv) ? 'rgba(239, 68, 68, 0.4)' : '#ef4444', color: (deleteEnvInput !== env || isDeletingEnv) ? 'rgba(255,255,255,0.5)' : '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: 600, cursor: (deleteEnvInput !== env || isDeletingEnv) ? 'not-allowed' : 'pointer' }}>
                                {isDeletingEnv ? 'Deleting...' : 'Delete Environment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Delete Project */}
            {isDeleteProjectOpen && projectDetails && (
                <DeleteProjectModal
                    project={projectDetails}
                    isDeleting={isDeletingProject}
                    onConfirm={handleDeleteProject}
                    serverError={deleteProjectError}
                    onClose={() => {
                        if (!isDeletingProject) {
                            setIsDeleteProjectOpen(false);
                            setDeleteProjectError(null);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default SettingsTab;
