import React from 'react';
import '../../../styles/pages/workspace-settings.css';

const SettingsSkeleton = () => {
    return (
        <div className="settings-tab-wrapper">
            <div className="glass-card settings-glass-card">
                <div className="settings-header">
                    <div className="skeleton-cell" style={{ width: '200px', height: '26px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '12px' }}></div>
                    <div className="skeleton-cell" style={{ width: '350px', height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}></div>
                </div>
                <div className="settings-content">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="skeleton-cell" style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}></div>
                        <div className="skeleton-cell" style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
                        <div className="skeleton-cell" style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}></div>
                        <div className="skeleton-cell" style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
                        <div className="skeleton-cell" style={{ width: '100%', height: '180px', background: 'rgba(239,68,68,0.02)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.1)' }}></div>
                    </div>
                </div>
                <div className="settings-sticky-footer">
                    <div className="skeleton-cell" style={{ width: '140px', height: '40px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default SettingsSkeleton;
