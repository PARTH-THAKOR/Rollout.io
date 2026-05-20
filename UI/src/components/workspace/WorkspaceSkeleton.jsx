import React from 'react';
import CoreFlagSkeleton from '../workspace-tabs/core-flag/CoreFlagSkeleton';
import FlagTableHeader from '../workspace-tabs/core-flag/FlagTableHeader';
import OverviewSkeleton from '../workspace-tabs/overview/OverviewSkeleton';
import SettingsSkeleton from '../workspace-tabs/settings/SettingsSkeleton';
import AuditLogSkeleton from '../workspace-tabs/audit-log/AuditLogSkeleton';

const WorkspaceSkeleton = ({ activeTab }) => {

    if (activeTab === 'overview') {
        return <OverviewSkeleton />;
    }

    if (activeTab === 'settings') {
        return <SettingsSkeleton />;
    }

    if (activeTab === 'audit-log') {
        return (
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
                <div className="tab-toolbar">
                    <div className="toolbar-left">
                        <div className="skeleton-cell" style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)' }}></div>
                        <div className="skeleton-cell" style={{ width: '140px', height: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }}></div>
                        <div className="skeleton-cell" style={{ width: '32px', height: '20px', background: 'rgba(16,185,129,0.08)', borderRadius: '10px' }}></div>
                    </div>
                    <div className="toolbar-right">
                        {[50, 65, 60, 55].map((w, i) => (
                            <div key={i} className="skeleton-cell" style={{ width: `${w}px`, height: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}></div>
                        ))}
                        <div className="skeleton-cell" style={{ width: '160px', height: '28px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}></div>
                    </div>
                </div>
                <AuditLogSkeleton />
            </div>
        );
    }

    // Core, JSON, and Dependent Flag loading state
    if (activeTab === 'core-flag' || activeTab === 'json-flag') {
        return (
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
                <div className="tab-toolbar">
                    <div className="skeleton-cell" style={{ width: '150px', height: '22px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}></div>
                    <div className="skeleton-cell" style={{ width: '200px', height: '36px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}></div>
                </div>
                <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="data-table">
                        <FlagTableHeader />
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
                        <div className="skeleton-cell" style={{ width: '130px', height: '22px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }}></div>
                        <div className="skeleton-cell" style={{ width: '28px', height: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}></div>
                        <div className="skeleton-cell" style={{ width: '130px', height: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginLeft: '12px' }}></div>
                    </div>
                    <div className="toolbar-right" style={{ gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[50, 65, 60].map((w, i) => (
                                <div key={i} className="skeleton-cell" style={{ width: `${w}px`, height: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}></div>
                            ))}
                        </div>
                        <div className="skeleton-cell" style={{ width: '200px', height: '36px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}></div>
                        <div className="skeleton-cell" style={{ width: '160px', height: '36px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)', borderRadius: '10px' }}></div>
                    </div>
                </div>
                <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="data-table">
                        <FlagTableHeader />
                        <tbody>
                            <CoreFlagSkeleton count={5} />
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Default Fallback
    return (
        <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-cell" style={{ width: '150px', height: '22px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}></div>
                <div className="skeleton-cell" style={{ width: '140px', height: '38px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>
            </div>
            <div style={{ padding: '0 24px' }}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton-cell" style={{ padding: '20px 0', borderBottom: i !== 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
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
