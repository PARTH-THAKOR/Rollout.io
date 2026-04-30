import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useStore';
import { auth } from '../firebase';
import { authApi } from '../api/apiClient';

const DashboardProfile = ({ isSidebarCollapsed = false }) => {
    const queryClient = useQueryClient();
    const logout = useAuthStore(state => state.logout);

    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef(null);
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [pictureUrl, setPictureUrl] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await authApi('/users/me');
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setDisplayName(result.data.displayName || "");
                        setPictureUrl(result.data.pictureUrl || "");
                        setEmail(result.data.email || "");
                    }
                }
            } catch (err) {
                console.warn("Error fetching user data:", err);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div style={{ position: 'relative', width: '100%' }} ref={modalRef}>
            <div
                className="user-profile-btn"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: isSidebarCollapsed ? '8px 0' : '8px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                    background: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.background = 'transparent';
                }}
            >
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 1) 0%, rgba(147, 51, 234, 1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    overflow: 'hidden'
                }}>
                    {pictureUrl ? (
                        <img src={pictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                        <i className="ri-user-3-fill" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}></i>
                    )}
                </div>

                {!isSidebarCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        {displayName ? (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{displayName}</span>
                        ) : (
                            <div style={{ width: '80px', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                        )}
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', fontWeight: 500 }}>Admin</span>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="glass-card" style={{ position: 'absolute', bottom: 'calc(100% + 10px)', left: isSidebarCollapsed ? '4px' : '0', width: isSidebarCollapsed ? '250px' : '100%', padding: '0', overflow: 'hidden', animation: 'slideUp 0.2s ease-out', zIndex: 1000, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxSizing: 'border-box', background: 'rgba(18, 9, 36, 0.98)', backdropFilter: 'blur(20px)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{displayName}</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{email}</p>
                    </div>

                    <div style={{ padding: '8px' }}>
                        <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', color: '#fff', textDecoration: 'none', fontSize: '13px', borderRadius: '6px' }} className="hover-row">
                            <i className="ri-user-settings-line" style={{ color: 'var(--text-secondary)' }}></i> Account Settings
                        </Link>
                        <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', color: '#fff', textDecoration: 'none', fontSize: '13px', borderRadius: '6px' }} className="hover-row">
                            <i className="ri-shield-keyhole-line" style={{ color: 'var(--text-secondary)' }}></i> Security
                        </Link>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8px' }}>
                        <button 
                             onClick={async () => {
                                 try { await authApi('/auth/logout', { method: 'POST' }); } catch (e) {}
                                 try { await auth.signOut(); } catch (e) {}
                                 logout();
                                 queryClient.removeQueries();
                                 queryClient.clear();
                                 window.location.href = '/login';
                             }}
                             style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', color: '#ef4444', textDecoration: 'none', fontSize: '13px', borderRadius: '6px', background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }} 
                             className="hover-row"
                        >
                            <i className="ri-logout-box-r-line"></i> Sign Out
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DashboardProfile;
