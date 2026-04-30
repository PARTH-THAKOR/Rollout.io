import React from 'react';

/**
 * Error state UI shown when the project fetch fails.
 * Displays error message + retry button.
 */
const DashboardErrorState = ({ message, onRetry }) => {
    return (
        <div className="dashboard-error-state">
            <div className="error-icon-ring">
                <i className="ri-error-warning-line" />
            </div>
            <h3 className="error-title">Failed to load projects</h3>
            <p className="error-message">
                {message || 'Could not connect to the server. Please check your connection and try again.'}
            </p>
            <button className="btn btn-primary btn-stable error-retry-btn" onClick={onRetry}>
                <i className="ri-refresh-line" /> Retry
            </button>
        </div>
    );
};

export default DashboardErrorState;
