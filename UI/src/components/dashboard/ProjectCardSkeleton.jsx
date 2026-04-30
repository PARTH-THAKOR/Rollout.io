import React from 'react';

/**
 * Skeleton placeholder for a project card during loading.
 * Renders 6 ghost cards by default to fill the grid.
 */
const ProjectCardSkeleton = ({ count = 6 }) => {
    return (
        <>
            {[...Array(count)].map((_, idx) => (
                <div key={idx} className="project-card skeleton-card">
                    <div className="project-card-header">
                        <div className="skeleton-cell skeleton-icon" />
                        <div className="skeleton-cell skeleton-dot" />
                    </div>
                    <div className="project-info">
                        <div className="skeleton-cell skeleton-title" />
                        <div className="skeleton-cell skeleton-line-long" />
                        <div className="skeleton-cell skeleton-line-short" />
                    </div>
                    <div className="project-footer skeleton-footer">
                        <div className="skeleton-cell skeleton-badge" />
                        <div className="skeleton-cell skeleton-date" />
                    </div>
                </div>
            ))}
        </>
    );
};

export default ProjectCardSkeleton;
