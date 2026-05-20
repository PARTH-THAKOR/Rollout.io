import React from 'react';

const CoreFlagSkeleton = ({ count = 4 }) => {
    return [...Array(count)].map((_, i) => (
        <tr key={`skeleton-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Flag Name Cell */}
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="skeleton-cell" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}></div>
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="skeleton-cell" style={{ width: `${120 + (i % 3) * 60}px`, height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}></div>
                        <div className="skeleton-cell" style={{ width: `${80 + (i % 2) * 40}px`, height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}></div>
                    </div>
                </div>
            </td>
            
            {/* Type Badge */}
            <td>
                <div className="skeleton-cell" style={{ width: '68px', height: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}></div>
            </td>
            
            {/* Rollout Percentage */}
            <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="skeleton-cell" style={{ width: '32px', height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}></div>
                    <div className="skeleton-cell" style={{ width: '100%', maxWidth: '100px', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}></div>
                </div>
            </td>
            
            {/* Toggle Switch */}
            <td>
                <div className="skeleton-cell" style={{ width: '44px', height: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '34px' }}></div>
            </td>
            
            {/* Updated Time */}
            <td>
                <div className="skeleton-cell" style={{ width: '85px', height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}></div>
            </td>
            
            {/* Actions */}
            <td style={{ textAlign: 'right' }}>
                <div className="skeleton-cell" style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%', display: 'inline-block' }}></div>
            </td>
        </tr>
    ));
};

export default CoreFlagSkeleton;
