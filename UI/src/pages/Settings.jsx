import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import '../styles/welcome.css';
import '../styles/dashboard.css';
import 'remixicon/fonts/remixicon.css';
import '../styles/pages/settings.css';
import { authApi } from '../api/apiClient';
import { auth } from '../firebase';
import { authKeys } from '../api/queries';
import { useAuthStore } from '../store/useStore';

const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const logout = useAuthStore(state => state.logout);

    // Check if we navigated here from a workspace
    const fromWorkspace = location.state?.fromWorkspace;

    // Profile States
    const [displayName, setDisplayName] = useState("");
    const [initialDisplayName, setInitialDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [pictureUrl, setPictureUrl] = useState("");
    const [imageError, setImageError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isNameDirty, setIsNameDirty] = useState(false);
    const [toast, setToast] = useState(null);
    const [isUserLoading, setIsUserLoading] = useState(true);

    // Modal: Delete All Data States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            // Start with Firebase auth data as baseline (always available)
            const firebaseUser = auth.currentUser;
            const fbEmail = firebaseUser?.email || "";
            const fbDisplayName = firebaseUser?.displayName || "";
            const fbPhotoURL = firebaseUser?.photoURL || "";

            try {
                const response = await authApi('/users/me');
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        // Use backend data, but fall back to Firebase data for empty fields
                        setDisplayName(result.data.displayName || fbDisplayName || "");
                        setInitialDisplayName(result.data.displayName || fbDisplayName || "");
                        setEmail(result.data.email || fbEmail);
                        setPictureUrl(result.data.pictureUrl || fbPhotoURL);
                    } else {
                        // Backend returned success:false or no data — use Firebase
                        setDisplayName(fbDisplayName);
                        setInitialDisplayName(fbDisplayName);
                        setEmail(fbEmail);
                        setPictureUrl(fbPhotoURL);
                    }
                } else {
                    // Backend error — use Firebase data
                    setDisplayName(fbDisplayName);
                    setInitialDisplayName(fbDisplayName);
                    setEmail(fbEmail);
                    setPictureUrl(fbPhotoURL);
                }
            } catch (err) {
                console.warn("Error fetching user data:", err);
                // Network error — use Firebase data
                setDisplayName(fbDisplayName);
                setInitialDisplayName(fbDisplayName);
                setEmail(fbEmail);
                setPictureUrl(fbPhotoURL);
            } finally {
                setIsUserLoading(false);
            }
        };
        fetchUserData();

        const moveCursor = (e) => {
            const cursor = document.getElementById('cursor-glow');
            if (cursor) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }
        };
        document.addEventListener('mousemove', moveCursor);
        return () => document.removeEventListener('mousemove', moveCursor);
    }, []);

    const handleSave = async () => {
        if (!displayName.trim() || displayName.trim() === initialDisplayName) return;
        setIsSaving(true);
        try {
            const response = await authApi(`/users/me/display-name?displayName=${encodeURIComponent(displayName.trim())}`, {
                method: 'PATCH'
            });
            if (response.ok) {
                setInitialDisplayName(displayName.trim());
                setIsNameDirty(false);
                queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
                showToast('Profile updated successfully!', 'success');
            } else {
                const errData = await response.json().catch(() => null);
                showToast(errData?.message || 'Failed to update profile.', 'error');
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
            showToast('Could not connect to the server. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await authApi('/users/me', {
                method: 'DELETE'
            });
            if (response.ok || response.status === 404) {
                // Permanently delete user from Firebase Authentication
                const currentUser = auth.currentUser;
                if (currentUser) {
                    try {
                        const { deleteUser } = await import('firebase/auth');
                        await deleteUser(currentUser);
                        console.log("Firebase Authentication user deleted successfully");
                    } catch (e) {
                        console.warn("Could not delete user from Firebase (requires recent login):", e);
                    }
                }

                // Sign out from Firebase Auth (as cleanup/fallback)
                try { await auth.signOut(); } catch (e) { console.error("Firebase signout failed", e); }
                
                // Clear local Zustand auth store
                logout();
                
                // Purge React Query cache to prevent rendering deleted resources
                queryClient.removeQueries();
                queryClient.clear();
                
                // Safely redirect to the public Welcome page
                navigate('/welcome', { replace: true });
            } else {
                showToast("Failed to delete account. Please try again.", "error");
            }
        } catch (err) {
            console.error('Error deleting account:', err);
            showToast('An error occurred while deleting your account.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };


    return (
        <>
            <div id="cursor-glow"></div>
            <div className="stars small"></div>
            <div className="stars medium"></div>
            <div className="stars large"></div>

            <div className="user-settings-page">
                {toast && (
                    <div className={`toast-notification ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} style={{ zIndex: 1000 }}>
                        <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ fontSize: '18px' }}></i>
                        {toast.message}
                    </div>
                )}

                {/* Workspace Top Bar */}
                <header className="workspace-header user-settings-header-bar">
                    <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link
                            to="/dashboard"
                            onClick={(e) => {
                                if (fromWorkspace) {
                                    e.preventDefault();
                                    navigate(-1);
                                }
                            }}
                            className="user-settings-back-btn"
                        >
                            <i className="ri-arrow-left-line"></i> {fromWorkspace ? 'Back to Workspace' : 'Back to Dashboard'}
                        </Link>
                        <div className="user-settings-badge">
                            <span className="user-settings-badge-dot"></span>
                            Platform Settings
                        </div>
                    </div>
                </header>

                {/* Centered Settings Card */}
                <div className="user-settings-wrapper">
                    <div className="user-settings-card">
                        <div className="user-settings-header">
                            <h3>Account Settings</h3>
                            <p>Manage your public profile and account credentials.</p>
                        </div>

                        {isUserLoading ? (
                            <div className="user-settings-content">
                                {/* Avatar Skeleton */}
                                <div className="user-settings-section">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div className="user-settings-skeleton-shimmer" style={{ width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0 }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div className="user-settings-skeleton-shimmer" style={{ width: '140px', height: '16px', marginBottom: '8px' }}></div>
                                            <div className="user-settings-skeleton-shimmer" style={{ width: '200px', height: '12px' }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Skeleton */}
                                <div className="user-settings-section user-settings-section-divider">
                                    <div className="user-settings-skeleton-shimmer" style={{ width: '180px', height: '22px', marginBottom: '8px' }}></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="form-group">
                                            <div className="user-settings-skeleton-shimmer" style={{ width: '100px', height: '14px', marginBottom: '8px' }}></div>
                                            <div className="user-settings-skeleton-shimmer" style={{ width: '100%', height: '42px', borderRadius: '10px' }}></div>
                                        </div>
                                        <div className="form-group">
                                            <div className="user-settings-skeleton-shimmer" style={{ width: '100px', height: '14px', marginBottom: '8px' }}></div>
                                            <div className="user-settings-skeleton-shimmer" style={{ width: '100%', height: '42px', borderRadius: '10px' }}></div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Danger Zone Skeleton */}
                                <div className="user-settings-section user-settings-section-divider">
                                    <div className="user-settings-skeleton-shimmer" style={{ width: '120px', height: '22px', marginBottom: '8px' }}></div>
                                    <div className="user-settings-skeleton-shimmer" style={{ width: '100%', height: '100px', borderRadius: '14px' }}></div>
                                </div>
                            </div>
                        ) : (
                            <div className="user-settings-content">
                                {/* Profile Avatar (Read-only) */}
                                <div className="user-settings-section">
                                    <div className="user-settings-avatar-row">
                                        <div className="user-settings-avatar">
                                            {pictureUrl && !imageError ? (
                                                <img src={pictureUrl} alt={displayName} className="user-settings-avatar-img" onError={() => setImageError(true)} />
                                            ) : (
                                                <span className="user-settings-avatar-fallback">
                                                    {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="user-settings-avatar-info">
                                            <p className="user-settings-avatar-name">{displayName || 'User'}</p>
                                            <p className="user-settings-avatar-email">{email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* General Profile Section */}
                                <div className="user-settings-section user-settings-section-divider">
                                    <h4 className="user-settings-section-title">
                                        <i className="ri-user-settings-line" style={{ color: '#38bdf8' }}></i> Profile Information
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Display Name <span className="form-required">*</span></label>
                                            <input 
                                                type="text" 
                                                className={`login-input ${isNameDirty && !displayName.trim() ? 'input-error' : ''}`}
                                                value={displayName} 
                                                onChange={(e) => { setDisplayName(e.target.value); setIsNameDirty(true); }} 
                                                maxLength={50}
                                                autoComplete="off"
                                                placeholder="Enter your display name"
                                            />
                                            {isNameDirty && !displayName.trim() && (
                                                <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>Display name cannot be empty.</span>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email Address</label>
                                            <input 
                                                type="email" 
                                                className="login-input" 
                                                value={email} 
                                                disabled 
                                                style={{ color: 'var(--text-secondary)', cursor: 'not-allowed', opacity: 0.6 }}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="user-settings-section user-settings-section-divider">
                                    <h4 className="user-settings-section-title" style={{ color: '#ef4444' }}>
                                        <i className="ri-error-warning-fill"></i> Danger Zone
                                    </h4>
                                    <div className="user-settings-danger-zone">
                                        <div className="user-settings-danger-row">
                                            <div className="user-settings-danger-info">
                                                <h5>Delete All Data</h5>
                                                <p>
                                                    Permanently remove your account, associated organizations, configurations, and all of its contents. This action is irreversible.
                                                </p>
                                            </div>
                                            <button className="user-settings-danger-btn-solid" onClick={() => setIsDeleteModalOpen(true)}>Delete All Data</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="user-settings-footer">
                            {isUserLoading ? (
                                <div className="user-settings-skeleton-shimmer" style={{ width: '130px', height: '42px', borderRadius: '8px' }}></div>
                            ) : (
                                <button 
                                    className="user-settings-save-btn" 
                                    disabled={isSaving || displayName.trim() === initialDisplayName || !displayName.trim()} 
                                    onClick={handleSave}
                                >
                                    {isSaving ? <i className="ri-loader-4-line spin" style={{ marginRight: '8px' }}></i> : ''}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Delete All Data */}
            {isDeleteModalOpen && (
                <div className="modal-overlay" onClick={() => !isDeleting && setIsDeleteModalOpen(false)}>
                    <div className="modal-content glass-card user-settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="user-settings-modal-header">
                            <div className="user-settings-modal-icon-container">
                                <i className="ri-alert-fill" style={{ fontSize: '24px', color: '#ef4444' }}></i>
                            </div>
                            <div>
                                <h3 className="user-settings-modal-title">Delete All Data</h3>
                            </div>
                        </div>
                        <div className="user-settings-modal-body">
                            This action will permanently delete your account and all associated projects, environments, and flags.
                            <strong className="user-settings-modal-danger-text">This action cannot be undone.</strong>
                        </div>
                        <div className="user-settings-modal-form-group">
                            <label className="user-settings-modal-label">
                                To confirm, please type <strong className="user-settings-modal-label-highlight">DELETE</strong> below:
                            </label>
                            <input 
                                type="text" 
                                value={deleteConfirmInput} 
                                onChange={(e) => setDeleteConfirmInput(e.target.value)} 
                                className="login-input user-settings-modal-input" 
                                placeholder="DELETE" 
                                autoFocus 
                            />
                        </div>
                        <div className="user-settings-modal-actions">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="btn-ghost" disabled={isDeleting}>Cancel</button>
                            <button 
                                onClick={handleDeleteAccount} 
                                disabled={deleteConfirmInput !== 'DELETE' || isDeleting} 
                                className="user-settings-delete-btn"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete All Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Settings;
