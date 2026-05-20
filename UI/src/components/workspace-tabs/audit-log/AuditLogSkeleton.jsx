import React from 'react';

const AuditLogSkeleton = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            <div style={{ flex: 1, padding: '0' }}>
                {/* Group header skeleton */}
                <div className="skeleton-cell" style={{ padding: '10px 28px', height: '36px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: '60px', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}></div>
                </div>
                {/* Event row skeletons */}
                {[...Array(7)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="skeleton-cell" style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div className="skeleton-cell" style={{ width: `${150 + (i % 3) * 70}px`, height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                            <div className="skeleton-cell" style={{ width: `${70 + (i % 2) * 30}px`, height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditLogSkeleton;
