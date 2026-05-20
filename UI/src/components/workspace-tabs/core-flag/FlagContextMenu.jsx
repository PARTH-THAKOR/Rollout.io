import React from 'react';

const FlagContextMenu = ({ flag, onClose, onEdit, onDelete }) => {
    return (
        <div className="flag-context-menu" onClick={(e) => e.stopPropagation()}>
            <div className="flag-context-header">
                <div style={{ overflow: 'hidden' }}>
                    <div className="flag-context-title">
                        {flag.displayName || flag.name}
                    </div>
                    <div className="flag-context-meta">
                        <span className="flag-context-key" title={flag.key}>{flag.key}</span>
                        <span className="flag-context-type">{flag.type}</span>
                    </div>
                </div>
                <button className="flag-context-close" onClick={onClose}>
                    <i className="ri-close-line" style={{ fontSize: '14px' }}></i>
                </button>
            </div>
            
            <div className="flag-context-actions">
                <button onClick={() => onEdit(flag)} className="flag-context-item primary">
                    <i className="ri-pencil-line"></i> Update Flag
                </button>
                <button onClick={() => onDelete(flag)} className="flag-context-item danger">
                    <i className="ri-delete-bin-line"></i> Remove
                </button>
            </div>
        </div>
    );
};

export default FlagContextMenu;
