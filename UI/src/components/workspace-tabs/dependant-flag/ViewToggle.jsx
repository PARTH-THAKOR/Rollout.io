import React, { memo } from 'react';

// ═══════════════════════════════════════════════════════════
//  ViewToggle — List / Graph toggle for DependantFlagTab
//  Persists selection via callback (parent uses localStorage)
// ═══════════════════════════════════════════════════════════

const ViewToggle = memo(({ activeView, onViewChange }) => (
    <div className="view-toggle">
        <button
            className={`view-toggle-btn ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => onViewChange('list')}
            title="List View"
        >
            <i className="ri-list-unordered" style={{ fontSize: '15px' }}></i>
            List
        </button>
        <button
            className={`view-toggle-btn ${activeView === 'graph' ? 'active' : ''}`}
            onClick={() => onViewChange('graph')}
            title="Graph View"
        >
            <i className="ri-mind-map" style={{ fontSize: '15px' }}></i>
            Graph
        </button>
    </div>
));
ViewToggle.displayName = 'ViewToggle';

export default ViewToggle;
