import React, { lazy, Suspense } from 'react';
import { useDependentFlags } from '../../../api/queries';
import useAllCoreFlags from '../../../hooks/useAllCoreFlags';

// ═══════════════════════════════════════════════════════════
//  DependencyGraph — Entry point for the dependency graph view.
//
//  This file is the SAME public API as before:
//    <DependencyGraph envId={envId} />
//
//  Internally, it lazy-loads the new React Flow-based GraphView
//  from the isolated graph-v2 module. The graph bundle is only
//  downloaded when the Graph tab is actually rendered.
//
//  Data fetching stays here (same hooks as before) to keep the
//  contract with DependantFlagTab.jsx unchanged.
// ═══════════════════════════════════════════════════════════

// Lazy-load the heavy React Flow graph (only when Graph tab is active)
const GraphView = lazy(() => import('../../graph/GraphView'));

/**
 * Skeleton fallback shown while GraphView + React Flow loads.
 * Matches the existing graph-empty-state visual pattern.
 */
const GraphLoadingFallback = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
        gap: '16px',
    }}>
        {/* Animated skeleton nodes */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '80px',
            opacity: 0.5,
        }}>
            {/* Core nodes skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map(i => (
                    <div key={`core-${i}`} className="skeleton-pulse" style={{
                        width: '180px',
                        height: '60px',
                        borderRadius: '12px',
                        background: 'rgba(56,189,248,0.06)',
                        border: '1px solid rgba(56,189,248,0.08)',
                    }} />
                ))}
            </div>

            {/* Connection lines skeleton */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                alignItems: 'center',
            }}>
                {[1, 2].map(i => (
                    <div key={`line-${i}`} className="skeleton-pulse" style={{
                        width: '60px',
                        height: '2px',
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '1px',
                    }} />
                ))}
            </div>

            {/* Dependent nodes skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2].map(i => (
                    <div key={`dep-${i}`} className="skeleton-pulse" style={{
                        width: '180px',
                        height: '60px',
                        borderRadius: '12px',
                        background: 'rgba(167, 139, 250, 0.06)',
                        border: '1px solid rgba(167, 139, 250, 0.08)',
                    }} />
                ))}
            </div>
        </div>

        <div style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        }}>
            <i className="ri-loader-4-line spin" style={{ fontSize: '16px', color: '#a78bfa', opacity: 0.6 }} />
            Loading dependency graph...
        </div>
    </div>
);

const DependencyGraph = ({ envId }) => {
    const { data: depFlags = [] } = useDependentFlags(envId);
    const { coreFlagsMap } = useAllCoreFlags(envId);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '450px',
        }}>
            <Suspense fallback={<GraphLoadingFallback />}>
                <GraphView
                    depFlags={depFlags}
                    coreFlagsMap={coreFlagsMap}
                />
            </Suspense>
        </div>
    );
};

export default DependencyGraph;
