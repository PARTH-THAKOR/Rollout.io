import React from 'react';
import { useJsonFlags, useDependentFlags } from '../../api/queries';

const OverviewTab = ({ env, envId, flags: coreFlags, sdkKey }) => {
    const { data: jsonFlags = [] } = useJsonFlags(envId);
    const { data: dependentFlags = [] } = useDependentFlags(envId);

    const sdkStatus = 'Connected';
    
    const allFlags = [...(coreFlags || []), ...jsonFlags, ...dependentFlags];
    const totalFlags = allFlags.length;
    const activeFlags = allFlags.filter(f => f.status).length;
    const inactiveFlags = allFlags.filter(f => !f.status).length;

    return (
        <div className="env-overview glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="env-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="section-title" style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Environment Status: <span style={{ color: env === 'Production' ? '#10b981' : env === 'Staging' ? '#f59e0b' : '#38bdf8' }}>{env}</span></h3>
            </div>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <div className="stat-card">
                    <div className="stat-label">Total Flags</div>
                    <div className="stat-value">
                        {totalFlags} <i className="ri-flag-2-fill" style={{ fontSize: '18px', color: '#38bdf8' }}></i>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active Flags</div>
                    <div className="stat-value">
                        {activeFlags} <i className="ri-toggle-fill" style={{ fontSize: '18px', color: '#10B981' }}></i>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Inactive Flags</div>
                    <div className="stat-value">
                        {inactiveFlags} <i className="ri-toggle-line" style={{ fontSize: '18px', color: '#ef4444' }}></i>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">SDK Status</div>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: sdkStatus === 'Connected' ? '#10B981' : sdkStatus === 'Connecting...' ? '#f59e0b' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '10px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: sdkStatus === 'Connected' ? '#10B981' : sdkStatus === 'Connecting...' ? '#f59e0b' : '#ef4444',
                            boxShadow: `0 0 10px ${sdkStatus === 'Connected' ? 'rgba(16, 185, 129, 0.5)' : sdkStatus === 'Connecting...' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                        }}></div> {sdkStatus}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
