import React from 'react';

const WorkspaceEmptyState = ({ onCreateClick }) => {
    return (
        <div className="glass-card" style={{
            padding: '80px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.005) 100%)',
            animation: 'fadeIn 0.4s ease-out'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(147,51,234,0.12) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '28px',
                border: '1px solid rgba(56,189,248,0.15)'
            }}>
                <i className="ri-cloud-line" style={{ fontSize: '36px', color: '#38bdf8', opacity: 0.85 }}></i>
            </div>
            <h3 style={{
                margin: '0 0 10px 0',
                fontSize: '20px',
                fontWeight: 700,
                color: '#fff',
                fontFamily: '"Outfit", "Inter", sans-serif',
                letterSpacing: '0.2px'
            }}>No environments found</h3>
            <p style={{
                margin: '0 0 32px 0',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.6,
                maxWidth: '380px'
            }}>
                Create your first environment to get started. Environments let you manage feature flags across development, staging, and production.
            </p>
            <button
                onClick={onCreateClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #9333ea 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: '"Inter", "Outfit", sans-serif',
                    boxShadow: '0 4px 20px rgba(56,189,248,0.3), 0 0 40px rgba(147,51,234,0.15)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(56,189,248,0.4), 0 0 60px rgba(147,51,234,0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(56,189,248,0.3), 0 0 40px rgba(147,51,234,0.15)';
                }}
            >
                <i className="ri-add-circle-line" style={{ fontSize: '18px' }}></i>
                Create Environment
            </button>
        </div>
    );
};

export default WorkspaceEmptyState;
