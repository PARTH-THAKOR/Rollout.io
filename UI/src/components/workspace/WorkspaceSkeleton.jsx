import React from 'react';
import CoreFlagSkeleton from '../workspace-tabs/core-flag/CoreFlagSkeleton';

const WorkspaceSkeleton = ({ activeTab }) => {

    if (activeTab === 'overview') {
        return (
            <div className="env-overview glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div className="skeleton-pulse" style={{ width: '200px', height: '24px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '20px' }}></div>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card" style={{ padding: '20px' }}>
                            <div className="skeleton-pulse" style={{ width: '80px', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '14px' }}></div>
                            <div className="skeleton-pulse" style={{ width: '40px', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (activeTab === 'core-flag' || activeTab === 'json-flag') {
        return (
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
                <div className="tab-toolbar">
                    <div className="skeleton-pulse" style={{ width: '150px', height: '22px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '200px', height: '36px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}></div>
                </div>
                <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Flag</th>
                                <th style={{ width: '10%' }}>Type</th>
                                <th style={{ width: '18%' }}>Rollout</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '14%' }}>Updated</th>
                                <th style={{ width: '8%' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            <CoreFlagSkeleton count={5} />
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (activeTab === 'dependant-flag') {
        return (
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
                <div className="tab-toolbar">
                    <div className="toolbar-left">
                        <div className="skeleton-pulse" style={{ width: '170px', height: '22px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }}></div>
                        <div className="skeleton-pulse" style={{ width: '28px', height: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}></div>
                    </div>
                    <div className="toolbar-right" style={{ gap: '12px' }}>
                        <div className="skeleton-pulse" style={{ width: '180px', height: '36px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}></div>
                        <div className="skeleton-pulse" style={{ width: '170px', height: '36px', background: 'rgba(234,179,8,0.08)', borderRadius: '10px' }}></div>
                    </div>
                </div>
                <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Flag</th>
                                <th style={{ width: '10%' }}>Type</th>
                                <th style={{ width: '18%' }}>Rollout</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '14%' }}>Updated</th>
                                <th style={{ width: '8%' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            <CoreFlagSkeleton count={5} />
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (activeTab === 'settings') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 24px', width: '100%', height: '100%' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '800px', padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="skeleton-pulse" style={{ width: '200px', height: '26px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '12px' }}></div>
                        <div className="skeleton-pulse" style={{ width: '350px', height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="skeleton-pulse" style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}></div>
                            <div className="skeleton-pulse" style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}></div>
                            <div className="skeleton-pulse" style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}></div>
                            <div className="skeleton-pulse" style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}></div>
                        </div>
                        <div className="skeleton-pulse" style={{ width: '100%', height: '200px', background: 'rgba(239,68,68,0.05)', borderRadius: '14px' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    // Audit Log Timeline Skeleton
    if (activeTab === 'audit-log') {
        return (
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '75vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="skeleton-pulse" style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)' }}></div>
                        <div className="skeleton-pulse" style={{ width: '140px', height: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }}></div>
                        <div className="skeleton-pulse" style={{ width: '32px', height: '20px', background: 'rgba(16,185,129,0.08)', borderRadius: '10px' }}></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {[50, 65, 60, 55].map((w, i) => (
                            <div key={i} className="skeleton-pulse" style={{ width: `${w}px`, height: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}></div>
                        ))}
                        <div className="skeleton-pulse" style={{ width: '160px', height: '28px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}></div>
                    </div>
                </div>
                <div style={{ flex: 1, padding: '0' }}>
                    {/* Group header skeleton */}
                    <div className="skeleton-pulse" style={{ padding: '10px 28px', height: '36px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width: '60px', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}></div>
                    </div>
                    {/* Event row skeletons */}
                    {[...Array(7)].map((_, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <div className="skeleton-pulse" style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className="skeleton-pulse" style={{ width: `${150 + (i % 3) * 70}px`, height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                                <div className="skeleton-pulse" style={{ width: `${70 + (i % 2) * 30}px`, height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default Fallback
    return (
        <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-pulse" style={{ width: '150px', height: '22px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}></div>
                <div className="skeleton-pulse" style={{ width: '140px', height: '38px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>
            </div>
            <div style={{ padding: '0 24px' }}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton-pulse" style={{ padding: '20px 0', borderBottom: i !== 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
                        <div>
                            <div style={{ width: '140px', height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '6px' }}></div>
                            <div style={{ width: '80px', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkspaceSkeleton;
