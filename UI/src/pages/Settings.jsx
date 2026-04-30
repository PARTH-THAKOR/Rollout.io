import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/welcome.css';
import '../styles/dashboard.css';
import 'remixicon/fonts/remixicon.css';
import '../styles/pages/settings.css';
import { authApi } from '../api/apiClient';

const Settings = () => {
    // Setting tabs
    const [activeTab, setActiveTab] = useState('general');
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we navigated here from a workspace
    const fromWorkspace = location.state?.fromWorkspace;

    // Profile States
    const [displayName, setDisplayName] = useState("");
    const [pictureUrl, setPictureUrl] = useState("");
    const [email, setEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (activeTab === 'general') {
                // Update Display Name
                await authApi(`/users/me/display-name?displayName=${encodeURIComponent(displayName)}`, {
                    method: 'PATCH'
                }).catch(err => console.warn(err));

                // Update Picture URL (if provided)
                if (pictureUrl) {
                    await authApi(`/users/me/picture-url?pictureUrl=${encodeURIComponent(pictureUrl)}`, {
                        method: 'PATCH'
                    }).catch(err => console.warn(err));
                }
            }
            // Add other tab save logic here as needed
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setIsSaving(false);
            // Optionally could add an 'isSaved' success state here
        }
    };

    const handleUpdateImageClick = () => {
        const newUrl = window.prompt("Enter new Profile Picture URL:");
        if (newUrl !== null) {
            setPictureUrl(newUrl);
        }
    };

    const handleRemoveImageClick = () => {
        setPictureUrl("");
        authApi(`/users/me/picture-url?pictureUrl=`, { method: 'PATCH' }).catch(err => console.warn(err));
    };

    const handleDeleteAccount = async () => {
        const confirmText = window.prompt("Are you sure you want to delete your account? This action cannot be undone. Type 'DELETE' to confirm.");
        if (confirmText === 'DELETE') {
            try {
                const response = await authApi('/users/me', {
                    method: 'DELETE'
                });
                if (response.ok) {
                    navigate('/'); // navigate to login/welcome after successful deletion
                } else {
                    alert("Failed to delete account. Please try again.");
                }
            } catch (err) {
                console.error('Error deleting account:', err);
                alert('An error occurred while deleting your account. Please try again.');
            }
        }
    };

    return (
        <>
            <div id="cursor-glow"></div>
            <div className="stars small"></div>
            <div className="stars medium"></div>
            <div className="stars large"></div>

            <div style={{ height: '100vh', width: '100vw', overflowY: 'auto', overflowX: 'hidden' }}>
                {/* Main Content Area */}
                <div className="main-wrapper" style={{ margin: '0 auto', maxWidth: '1600px', width: '100%', boxSizing: 'border-box' }}>
                    {/* Workspace Top Bar */}
                    <header className="workspace-header" style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
                        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <Link
                                to="/dashboard"
                                onClick={(e) => {
                                    if (fromWorkspace) {
                                        e.preventDefault();
                                        navigate(-1);
                                    }
                                }}
                                style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '8px', transition: 'all 0.2s', fontWeight: '500' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                <i className="ri-arrow-left-line"></i> {fromWorkspace ? 'Back to Workspace' : 'Back to Dashboard'}
                            </Link>
                            <div className="badge-outline" style={{ margin: 0 }}>Platform Settings</div>
                        </div>
                        <div className="header-right">
                            <button className="btn btn-primary btn-icon" onClick={handleSave} disabled={isSaving} style={{ padding: '10px 20px', fontSize: '14px' }}>
                                {isSaving ? <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i> : <i className="ri-save-line"></i>}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </header>

                    {/* Dashboard Inner Content */}
                    <main className="dashboard-content" style={{ padding: '0 40px' }}>
                        <div className="settings-container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
                            {/* Settings Sidebar */}
                            <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                                <div className="settings-menu">
                                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>Account</h4>
                                    <div
                                        className={`settings-menu-item ${activeTab === 'general' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('general')}
                                        style={activeTab === 'general' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}
                                    >
                                        <i className="ri-user-settings-line"></i> General
                                    </div>
                                    <div
                                        className={`settings-menu-item ${activeTab === 'security' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('security')}
                                        style={activeTab === 'security' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}
                                    >
                                        <i className="ri-shield-keyhole-line"></i> Security
                                    </div>
                                    <div
                                        className={`settings-menu-item ${activeTab === 'billing' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('billing')}
                                        style={activeTab === 'billing' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}
                                    >
                                        <i className="ri-bank-card-line"></i> Billing
                                    </div>

                                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginTop: '24px', marginBottom: '16px', letterSpacing: '1px' }}>Preferences</h4>
                                    <div
                                        className={`settings-menu-item ${activeTab === 'notifications' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('notifications')}
                                        style={activeTab === 'notifications' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}
                                    >
                                        <i className="ri-notification-3-line"></i> Notifications
                                    </div>
                                    <div
                                        className={`settings-menu-item ${activeTab === 'appearance' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('appearance')}
                                        style={activeTab === 'appearance' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}
                                    >
                                        <i className="ri-palette-line"></i> Appearance
                                    </div>
                                    <div
                                        className={`settings-menu-item ${activeTab === 'api' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('api')}
                                        style={activeTab === 'api' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}
                                    >
                                        <i className="ri-code-s-slash-line"></i> API Keys
                                    </div>
                                </div>
                            </div>

                            {/* Settings Form Content */}
                            <div className="glass-card" style={{ padding: '0', minHeight: '600px' }}>
                                <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#fff' }}>
                                        {activeTab === 'general' && 'General Settings'}
                                        {activeTab === 'security' && 'Security & Passwords'}
                                        {activeTab === 'billing' && 'Billing & Subscriptions'}
                                        {activeTab === 'notifications' && 'Notification Preferences'}
                                        {activeTab === 'appearance' && 'Appearance Settings'}
                                        {activeTab === 'api' && 'API & Integrations'}
                                    </h3>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        {activeTab === 'general' && 'Update your personal details and public profile information.'}
                                        {activeTab === 'security' && 'Manage your passwords and secure your account.'}
                                        {activeTab === 'billing' && 'Update billing info, view invoices, and change plans.'}
                                        {activeTab === 'notifications' && 'Choose when and how we contact you.'}
                                        {activeTab === 'appearance' && 'Customize how the platform looks and feels to you.'}
                                        {activeTab === 'api' && 'Manage API secrets for programmatic access.'}
                                    </p>
                                </div>

                                <div style={{ padding: '32px 40px' }}>
                                    {activeTab === 'general' && (
                                        <div className="form-group-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="profile-upload" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
                                                {pictureUrl ? (
                                                    <img src={pictureUrl} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="user-avatar" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="ri-user-3-fill" style={{ fontSize: '32px', color: 'rgba(255,255,255,0.8)' }}></i>
                                                    </div>
                                                )}
                                                <div>
                                                    <button className="btn btn-secondary" onClick={handleUpdateImageClick} style={{ padding: '8px 16px', marginRight: '10px', fontSize: '13px' }}>Update Image URL</button>
                                                    <button className="btn btn-icon" onClick={handleRemoveImageClick} style={{ padding: '8px 16px', fontSize: '13px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>Remove</button>
                                                </div>
                                            </div>

                                            <div className="input-group">
                                                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px' }}>Display Name</label>
                                                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                            </div>

                                            <div className="input-group">
                                                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px' }}>Email Address</label>
                                                <input type="email" value={email} disabled style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
                                            </div>

                                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '15px 0' }} />

                                            {/* Danger Zone */}
                                            <div>
                                                <h4 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '16px', fontWeight: '500' }}>Danger Zone</h4>
                                                <div style={{ padding: '20px', background: 'linear-gradient(to right, rgba(239,68,68,0.05), rgba(239,68,68,0.02))', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>Delete Account</h5>
                                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Permanently remove your account and all of its contents. This action is not reversible.</p>
                                                    </div>
                                                    <button className="btn" onClick={handleDeleteAccount} style={{ padding: '8px 16px', fontSize: '13px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Delete Account</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'appearance' && (
                                        <div className="form-group-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '12px', color: '#fff', fontSize: '14px', fontWeight: 500 }}>Theme Preference</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                                    <div className="theme-card active" style={{ padding: '20px', background: 'rgba(255,255,255,0.1)', border: '2px solid var(--primary-color)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center' }}>
                                                        <div style={{ width: '100%', height: '80px', background: '#0f172a', borderRadius: '4px', marginBottom: '12px' }}></div>
                                                        <span style={{ color: '#fff', fontWeight: 500 }}>Dark Mode</span>
                                                    </div>
                                                    <div className="theme-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', opacity: 0.7 }}>
                                                        <div style={{ width: '100%', height: '80px', background: '#ffffff', borderRadius: '4px', marginBottom: '12px', border: '1px solid #e2e8f0' }}></div>
                                                        <span style={{ color: '#fff', fontWeight: 500 }}>Light Mode</span>
                                                    </div>
                                                    <div className="theme-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', opacity: 0.7 }}>
                                                        <div style={{ width: '100%', height: '80px', background: 'linear-gradient(135deg, #0f172a 50%, #ffffff 50%)', borderRadius: '4px', marginBottom: '12px', border: '1px solid #e2e8f0' }}></div>
                                                        <span style={{ color: '#fff', fontWeight: 500 }}>System Default</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>Reduced Motion</h4>
                                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Disable non-essential animations across the dashboard</p>
                                                </div>
                                                <label className="switch">
                                                    <input type="checkbox" />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'security' && (
                                        <div className="form-group-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                            {/* Change Password Section */}
                                            <div>
                                                <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '16px', fontWeight: '500' }}>Change Password</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div className="input-group">
                                                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>Current Password</label>
                                                        <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                        <div className="input-group">
                                                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>New Password</label>
                                                            <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                        </div>
                                                        <div className="input-group">
                                                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>Confirm New Password</label>
                                                            <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)' }}>Update Password</button>
                                                    </div>
                                                </div>
                                            </div>

                                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                            {/* Two-Factor Auth Section */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '16px', fontWeight: '500' }}>Two-Factor Authentication (2FA)</h4>
                                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Add an extra layer of security to your account.</p>
                                                    </div>
                                                    <span style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: '500', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Disabled</span>
                                                </div>
                                                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                                                            <i className="ri-shield-check-line" style={{ fontSize: '20px' }}></i>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>Authenticator App</h5>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Use an app like Google Authenticator or 1Password to generate codes.</p>
                                                        </div>
                                                        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Enable 2FA</button>
                                                    </div>
                                                </div>
                                            </div>

                                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                            {/* Sessions Section */}
                                            <div>
                                                <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '16px', fontWeight: '500' }}>Active Sessions</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {/* Current Session */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <i className="ri-macbook-line" style={{ fontSize: '24px', color: '#fff' }}></i>
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                    <h5 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 500 }}>Mac OS • Chrome</h5>
                                                                    <span style={{ padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>Active Now</span>
                                                                </div>
                                                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>Mumbai, India • 192.168.1.1</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Other Session */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', opacity: 0.7 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <i className="ri-smartphone-line" style={{ fontSize: '24px', color: 'var(--text-secondary)' }}></i>
                                                            <div>
                                                                <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>iOS • Safari</h5>
                                                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>Pune, India • 2 days ago</p>
                                                            </div>
                                                        </div>
                                                        <button className="icon-btn" style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', width: '32px', height: '32px' }} title="Revoke Session">
                                                            <i className="ri-close-line"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'notifications' && (
                                        <div className="form-group-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '16px', fontWeight: '500' }}>Email Notifications</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                        <div>
                                                            <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>Security Alerts</h5>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Get notified about new logins and password changes.</p>
                                                        </div>
                                                        <label className="switch">
                                                            <input type="checkbox" defaultChecked />
                                                            <span className="slider round"></span>
                                                        </label>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                        <div>
                                                            <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>Billing & Subscriptions</h5>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Invoices, receipts, and subscription renewals.</p>
                                                        </div>
                                                        <label className="switch">
                                                            <input type="checkbox" defaultChecked />
                                                            <span className="slider round"></span>
                                                        </label>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                        <div>
                                                            <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>Product Updates</h5>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Feature releases, changelogs, and announcements.</p>
                                                        </div>
                                                        <label className="switch">
                                                            <input type="checkbox" />
                                                            <span className="slider round"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                            <div>
                                                <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '16px', fontWeight: '500' }}>Workspace Alerts</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                        <div>
                                                            <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>Feature Flag Toggles</h5>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>When someone turns a flag on or off in Production.</p>
                                                        </div>
                                                        <label className="switch">
                                                            <input type="checkbox" defaultChecked />
                                                            <span className="slider round"></span>
                                                        </label>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                        <div>
                                                            <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>API Key Creation</h5>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Alert when new API keys are generated by teammates.</p>
                                                        </div>
                                                        <label className="switch">
                                                            <input type="checkbox" defaultChecked />
                                                            <span className="slider round"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                            <div>
                                                <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '16px', fontWeight: '500' }}>Slack Integration</h4>
                                                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                                            <i className="ri-slack-fill" style={{ fontSize: '24px' }}></i>
                                                        </div>
                                                        <div>
                                                            <h5 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 500 }}>Connect Slack</h5>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Receive critical alerts directly into your Slack channels.</p>
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)' }}>Connect</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Placeholder for other tabs */}
                                    {['billing', 'api'].includes(activeTab) && (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#97a3b6' }}>
                                            <i className="ri-tools-fill" style={{ fontSize: '32px', marginBottom: '10px', display: 'block', opacity: 0.5 }}></i>
                                            <p>This section is under construction.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                    </main>
                </div>
            </div>
        </>
    );
};

export default Settings;
