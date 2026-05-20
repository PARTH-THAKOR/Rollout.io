import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useStore';
import { auth } from '../../firebase';
import { authApi } from '../../api/apiClient';
import { useCurrentUser } from '../../api/queries';
import '../../styles/header-components.css';

const AdminProfile = ({ isOpen, onToggle }) => {
    const queryClient = useQueryClient();
    const logout = useAuthStore(state => state.logout);
    const location = useLocation();
    const navigate = useNavigate();
    const [imageError, setImageError] = useState(false);

    const modalRef = useRef(null);

    // ─── Server State ───
    const { data: user, isLoading } = useCurrentUser();
    // Firebase auth data as reliable fallback
    const firebaseUser = useAuthStore(state => state.user);
    const displayName = user?.displayName || firebaseUser?.displayName || "";
    const email = user?.email || firebaseUser?.email || "";
    const pictureUrl = user?.pictureUrl || firebaseUser?.photoURL || "";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && modalRef.current && !modalRef.current.contains(event.target)) {
                onToggle(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onToggle]);



    return (
        <div className="header-dropdown-container" ref={modalRef} style={{ marginLeft: '12px' }}>
            <div
                className={`profile-avatar-toggle ${isOpen ? 'is-active' : ''}`}
                onClick={() => onToggle(!isOpen)}
            >
                {pictureUrl && !imageError ? (
                    <img src={pictureUrl} alt="Profile" onError={() => setImageError(true)} />
                ) : (
                    <i className="ri-user-3-fill"></i>
                )}
            </div>

            {isOpen && (
                <div className="header-dropdown-menu profile-menu">
                    <div className="header-dropdown-profile-header">
                        {isLoading ? (
                            <div style={{ width: '80px', height: '14px', background: '#2e2e36', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                        ) : (
                            <>
                                <p className="header-dropdown-profile-name">{displayName || "Current User"}</p>
                                <p className="header-dropdown-profile-email">{email}</p>
                            </>
                        )}
                    </div>

                    <div className="header-dropdown-divider"></div>

                    <Link 
                        to="/settings" 
                        state={{ fromWorkspace: location.pathname.startsWith('/workspace') }} 
                        className="header-dropdown-item"
                        onClick={() => onToggle(false)}
                    >
                        <i className="ri-user-settings-line"></i> Account Settings
                    </Link>

                    <div className="header-dropdown-divider"></div>

                    <button 
                        onClick={async () => {
                            try { await authApi('/auth/logout', { method: 'POST' }); } catch (e) {}
                            try { await auth.signOut(); } catch (e) {}
                            logout();
                            queryClient.removeQueries();
                            queryClient.clear();
                            navigate('/welcome', { replace: true });
                        }}
                        className="header-dropdown-item danger-item"
                        style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}
                    >
                        <i className="ri-logout-box-r-line"></i> Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminProfile;
