import React, { useRef, useEffect } from 'react';
import '../../styles/header-components.css';

const EnvironmentSelector = ({ 
    environments, 
    isLoading, 
    currentEnv, 
    onSelectEnv, 
    onCreateClick,
    isOpen,
    onToggle 
}) => {
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onToggle(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onToggle]);


    if (environments.length === 0 && !isLoading) {
        return (
            <div className="header-dropdown-container">
                <button
                    onClick={onCreateClick}
                    className="header-dropdown-toggle header-dropdown-item primary-item"
                    style={{ border: '1px solid rgba(56, 189, 248, 0.3)', padding: '8px 16px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="env-indicator" style={{ background: '#ef4444', animation: 'pulseDot 1.5s infinite' }}></div>
                        <span style={{ color: '#fca5a5' }}>No Environment</span>
                    </div>
                    <div style={{ width: '1px', height: '14px', background: 'rgba(239,68,68,0.3)', margin: '0 4px' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <i className="ri-add-circle-line"></i> Create
                    </div>
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="header-dropdown-container">
                <div 
                    style={{ 
                        height: '32px', 
                        width: '85px', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.06)', 
                        border: '1px solid rgba(255,255,255,0.03)',
                        animation: 'skeleton-pulse 1.5s ease-in-out infinite' 
                    }}
                ></div>
            </div>
        );
    }

    const currentEnvColor = (currentEnv === 'Production' || currentEnv === 'pro') ? '#10b981' : currentEnv === 'Staging' ? '#f59e0b' : '#38bdf8';

    return (
        <div className="header-dropdown-container" ref={dropdownRef}>
            <button
                onClick={() => {
                    if (environments.length > 0) {
                        onToggle(!isOpen);
                    }
                }}
                className={`header-dropdown-toggle ${isOpen ? 'is-active' : ''}`}
                style={{ maxWidth: '200px', overflow: 'hidden' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <div
                        className="env-indicator"
                        style={{
                            background: currentEnvColor,
                            boxShadow: `0 0 8px ${currentEnvColor}`,
                            flexShrink: 0
                        }}
                    ></div>
                    <span style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }} title={currentEnv}>{currentEnv}</span>
                </div>
                <i className={`ri-arrow-${isOpen ? 'up' : 'down'}-s-line`} style={{ opacity: 0.6, flexShrink: 0 }}></i>
            </button>

            {isOpen && (
                <div className="header-dropdown-menu">
                    <div
                        className="header-dropdown-item primary-item"
                        onClick={() => { onCreateClick(); onToggle(false); }}
                    >
                        <i className="ri-add-circle-fill"></i> Create Environment
                    </div>
                    <div className="header-dropdown-divider"></div>
                    
                    {environments.map(e => {
                        const envColor = e === 'Production' ? '#10b981' : e === 'Staging' ? '#f59e0b' : '#38bdf8';
                        return (
                            <div
                                key={e}
                                className="header-dropdown-item"
                                onClick={() => { onSelectEnv(e); onToggle(false); }}
                            >
                                <div className="env-indicator" style={{ background: envColor, flexShrink: 0 }}></div>
                                <div style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={e}>{e}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EnvironmentSelector;
