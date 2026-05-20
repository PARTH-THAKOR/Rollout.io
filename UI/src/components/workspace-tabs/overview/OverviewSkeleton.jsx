import React from 'react';
import '../../../styles/overview.css';

const OverviewSkeleton = () => {
    return (
        <div className="overview-container">
            {/* Environment Header Skeleton */}
            <div className="overview-env-header">
                <div className="overview-env-badge">
                    <div className="skeleton-cell" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div className="skeleton-cell" style={{ width: '100px', height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                </div>
            </div>

            {/* 2×2 Grid Skeleton */}
            <div className="overview-grid">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="overview-widget">
                        <div className="skeleton-cell" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}></div>
                        <div className="overview-widget-body" style={{ marginTop: '10px' }}>
                            <div className="skeleton-cell" style={{ width: '80px', height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '8px' }}></div>
                            <div className="skeleton-cell" style={{ width: '40px', height: '32px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OverviewSkeleton;
