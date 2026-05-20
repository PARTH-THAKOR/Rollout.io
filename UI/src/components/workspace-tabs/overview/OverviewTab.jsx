import React from 'react';
import { useJsonFlags, useDependentFlags } from '../../../api/queries';
import '../../../styles/overview.css';

const OverviewTab = ({ env, envId, flags: coreFlags, sdkKey }) => {
    const { data: jsonFlags = [] } = useJsonFlags(envId);
    const { data: dependentFlags = [] } = useDependentFlags(envId);

    const sdkStatus = 'Connected';
    
    const allFlags = [...(coreFlags || []), ...jsonFlags, ...dependentFlags];
    const totalFlags = allFlags.length;
    const activeFlags = allFlags.filter(f => f.status).length;
    const inactiveFlags = allFlags.filter(f => !f.status).length;

    const envColor = env === 'Production' ? '#10b981' : env === 'Staging' ? '#f59e0b' : '#38bdf8';

    return (
        <div className="overview-container">
            {/* Environment Header */}
            <div className="overview-env-header">
                <div className="overview-env-badge" style={{ '--env-color': envColor }}>
                    <span className="overview-env-dot" style={{ background: envColor, boxShadow: `0 0 10px ${envColor}60` }}></span>
                    <span className="overview-env-label">Environment</span>
                    <span className="overview-env-name" style={{ color: envColor }} title={env}>{env}</span>
                </div>
            </div>

            {/* 2×2 Grid */}
            <div className="overview-grid">
                {/* Total Flags */}
                <div className="overview-widget">
                    <div className="overview-widget-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.08)', borderColor: 'rgba(56, 189, 248, 0.15)' }}>
                        <i className="ri-flag-2-fill" style={{ color: '#38bdf8' }}></i>
                    </div>
                    <div className="overview-widget-body">
                        <span className="overview-widget-label">Total Flags</span>
                        <span className="overview-widget-value">{totalFlags}</span>
                    </div>
                </div>

                {/* Active Flags */}
                <div className="overview-widget">
                    <div className="overview-widget-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                        <i className="ri-toggle-fill" style={{ color: '#10b981' }}></i>
                    </div>
                    <div className="overview-widget-body">
                        <span className="overview-widget-label">Active Flags</span>
                        <span className="overview-widget-value">{activeFlags}</span>
                    </div>
                </div>

                {/* Inactive Flags */}
                <div className="overview-widget">
                    <div className="overview-widget-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                        <i className="ri-toggle-line" style={{ color: '#ef4444' }}></i>
                    </div>
                    <div className="overview-widget-body">
                        <span className="overview-widget-label">Inactive Flags</span>
                        <span className="overview-widget-value">{inactiveFlags}</span>
                    </div>
                </div>

                {/* SDK Status */}
                <div className="overview-widget">
                    <div className="overview-widget-icon-wrap" style={{ background: 'rgba(147, 51, 234, 0.08)', borderColor: 'rgba(147, 51, 234, 0.15)' }}>
                        <i className="ri-plug-2-fill" style={{ color: '#a78bfa' }}></i>
                    </div>
                    <div className="overview-widget-body">
                        <span className="overview-widget-label">SDK Status</span>
                        <div className="overview-sdk-status">
                            <span className="overview-sdk-dot" style={{
                                background: sdkStatus === 'Connected' ? '#10b981' : sdkStatus === 'Connecting...' ? '#f59e0b' : '#ef4444',
                                boxShadow: `0 0 8px ${sdkStatus === 'Connected' ? 'rgba(16, 185, 129, 0.5)' : sdkStatus === 'Connecting...' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                            }}></span>
                            <span style={{
                                color: sdkStatus === 'Connected' ? '#10b981' : sdkStatus === 'Connecting...' ? '#f59e0b' : '#ef4444',
                                fontWeight: 600, fontSize: '15px'
                            }}>{sdkStatus}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
