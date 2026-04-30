import React from 'react';

/**
 * Empty state shown when user has zero projects.
 * Provides a CTA to create a first project.
 */
const DashboardEmptyState = ({ onCreateClick }) => {
    return (
        <div className="dashboard-empty-state">
            <div className="empty-icon-wrapper">
                <div className="empty-icon-glow" />
                <i className="ri-folder-add-fill empty-icon-gradient" />
            </div>
            <h3 className="empty-heading">Start Your Journey</h3>
            <p className="empty-description">
                Create your first project to organize environments, teams, and manage powerful feature flags effortlessly.
            </p>
            <button className="btn btn-primary btn-stable empty-cta" onClick={onCreateClick}>
                <i className="ri-add-circle-fill" /> Create New Project
            </button>
        </div>
    );
};

export default DashboardEmptyState;
