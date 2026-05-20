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
                        <div className="skeleton-cell" style={{ width: '60%', height: '24px', borderRadius: '6px', marginBottom: '8px' }} />
                        <div className="skeleton-cell" style={{ width: '90%', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
                        <div className="skeleton-cell" style={{ width: '70%', height: '14px', borderRadius: '4px', marginBottom: '30px' }} />
                        <div className="project-meta">
                            <div className="skeleton-cell" style={{ width: '100px', height: '16px', borderRadius: '4px' }} />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default ProjectCardSkeleton;
