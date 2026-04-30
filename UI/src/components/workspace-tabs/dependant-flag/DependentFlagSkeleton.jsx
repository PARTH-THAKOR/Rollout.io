import React from 'react';

// ═══════════════════════════════════════════════════════════
//  DependentFlagSkeleton — Premium table skeleton for the
//  Dependent Flag tab. Matches real DependentFlagRow layout.
// ═══════════════════════════════════════════════════════════

const SkeletonRow = () => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        {/* Flag Name + Key */}
        <td style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="skeleton-pulse" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(234,179,8,0.06)', flexShrink: 0 }}></div>
                <div>
                    <div className="skeleton-pulse" style={{ width: '130px', height: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '6px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '90px', height: '11px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}></div>
                </div>
            </div>
        </td>
        {/* Type */}
        <td style={{ padding: '16px 24px' }}>
            <div className="skeleton-pulse" style={{ width: '55px', height: '22px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}></div>
        </td>
        {/* Value */}
        <td style={{ padding: '16px 24px' }}>
            <div className="skeleton-pulse" style={{ width: '50px', height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}></div>
        </td>
        {/* Dependency */}
        <td style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="skeleton-pulse" style={{ width: '100px', height: '22px', background: 'rgba(56,189,248,0.05)', borderRadius: '6px' }}></div>
                <div className="skeleton-pulse" style={{ width: '14px', height: '14px', background: 'rgba(245,158,11,0.08)', borderRadius: '3px' }}></div>
                <div className="skeleton-pulse" style={{ width: '85px', height: '22px', background: 'rgba(56,189,248,0.05)', borderRadius: '6px' }}></div>
            </div>
        </td>
        {/* Rollout */}
        <td style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="skeleton-pulse" style={{ width: '30px', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}></div>
                <div className="skeleton-pulse" style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px' }}></div>
            </div>
        </td>
        {/* Status */}
        <td style={{ padding: '16px 24px' }}>
            <div className="skeleton-pulse" style={{ width: '38px', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}></div>
        </td>
        {/* Updated */}
        <td style={{ padding: '16px 24px' }}>
            <div className="skeleton-pulse" style={{ width: '50px', height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}></div>
        </td>
        {/* Actions */}
        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
            <div className="skeleton-pulse" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginLeft: 'auto' }}></div>
        </td>
    </tr>
);

const DependentFlagSkeleton = ({ count = 5 }) => (
    <>
        {[...Array(count)].map((_, i) => <SkeletonRow key={i} />)}
    </>
);

export default DependentFlagSkeleton;
