import React, { memo } from 'react';

// ═══════════════════════════════════════════════════════════
//  GraphLegend — Legend overlay for the dependency graph.
//  Shows color-coded category and status indicators.
//  Fully isolated — no shared CSS dependencies.
// ═══════════════════════════════════════════════════════════

const LegendDot = ({ color, size = 10, glow }) => (
    <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: color,
        boxShadow: glow ? `0 0 6px ${glow}` : 'none',
        flexShrink: 0,
    }} />
);

const LegendItem = ({ color, glow, label, size }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    }}>
        <LegendDot color={color} glow={glow} size={size} />
        <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 500,
            letterSpacing: '0.2px',
        }}>
            {label}
        </span>
    </div>
);

const GraphLegend = memo(({ hasCycles }) => (
    <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '8px 16px',
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
        flexWrap: 'wrap',
    }}>
        <LegendItem color="#38bdf8" glow="rgba(56,189,248,0.4)" label="Core Flag" />
        <LegendItem color="#f59e0b" glow="rgba(245,158,11,0.4)" label="Dependent" />

        <div style={{
            width: '1px',
            height: '14px',
            background: 'rgba(255,255,255,0.08)',
        }} />

        <LegendItem color="#10b981" glow="rgba(16,185,129,0.4)" label="Enabled" size={8} />
        <LegendItem color="#ef4444" glow="rgba(239,68,68,0.4)" label="Disabled" size={8} />

        {hasCycles && (
            <>
                <div style={{
                    width: '1px',
                    height: '14px',
                    background: 'rgba(255,255,255,0.08)',
                }} />
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}>
                    <div style={{
                        width: '16px',
                        height: '2px',
                        background: '#ef4444',
                        borderRadius: '1px',
                        opacity: 0.8,
                        backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)',
                    }} />
                    <span style={{
                        fontSize: '11px',
                        color: '#ef4444',
                        fontWeight: 600,
                    }}>
                        Cycle
                    </span>
                </div>
            </>
        )}
    </div>
));

GraphLegend.displayName = 'GraphLegend';

export default GraphLegend;
