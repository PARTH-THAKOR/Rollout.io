import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardProfile from './DashboardProfile';
import { useUIStore } from '../store/useStore';


const Sidebar = () => {
    const location = useLocation();
    const { isSidebarCollapsed, toggleSidebar } = useUIStore();

    // Active path checker
    const isActive = (path) => {
        if (path === '/workspace' && (location.pathname === '/dashboard' || location.pathname === '/workspace')) return true;
        return location.pathname === path;
    };

    return (
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} id="sidebar">
            <button className="icon-btn" id="toggle-sidebar" title="Toggle Sidebar" onClick={toggleSidebar}>
                <i className={isSidebarCollapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'} id="toggle-icon"></i>
            </button>
            <div className="sidebar-header">
                <Link to="/" className="logo sidebar-logo">Rollout<span className="dot">.</span>io</Link>
            </div>

            <div className="sidebar-nav">
                <div className="nav-section-title">WORKSPACE</div>
                <Link to="/dashboard" className={`nav-item ${isActive('/workspace') ? 'active' : ''}`}>
                    <i className="ri-folder-2-line"></i> <span className="nav-label">Projects</span>
                </Link>
            </div>

            <div style={{ flex: 1 }}></div>

            <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 0', marginTop: 'auto' }}>
                <div style={{ padding: isSidebarCollapsed ? '0 12px' : '0 20px' }}>
                    <DashboardProfile isSidebarCollapsed={isSidebarCollapsed} />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
