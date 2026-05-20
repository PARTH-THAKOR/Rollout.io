import React, { useState } from 'react';

const DeleteProjectModal = ({ project, isDeleting, onConfirm, onClose, serverError = '' }) => {
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

    if (!project) return null;

    return (
        <div className="modal-overlay" onClick={() => !isDeleting && onClose()} style={{ zIndex: 10000 }}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '92%', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <i className="ri-error-warning-fill" style={{ fontSize: '24px', color: '#ef4444' }}></i>
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 600 }}>Delete Project</h3>
                    </div>
                </div>
                {serverError && (
                    <div style={{
                        padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <i className="ri-error-warning-fill" style={{ color: '#f87171', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}></i>
                        <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.4, wordBreak: 'break-word', textAlign: 'left' }}>{serverError}</div>
                    </div>
                )}
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                    This action cannot be undone. All environments, flags, and data will be permanently deleted.
                    <strong style={{ color: '#ef4444', display: 'block', marginTop: '6px' }}>Proceed with extreme caution.</strong>
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        To confirm, please type <strong style={{ color: '#fff' }}>{project.name}</strong> below:
                    </label>
                    <input
                        type="text"
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        className="login-input"
                        placeholder={project.name}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        autoFocus
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} className="btn-ghost" disabled={isDeleting}>Cancel</button>
                    <button
                        onClick={() => onConfirm(project.id)}
                        disabled={deleteConfirmInput !== project.name || isDeleting}
                        style={{
                            background: (deleteConfirmInput !== project.name || isDeleting) ? 'rgba(239, 68, 68, 0.4)' : '#ef4444',
                            color: (deleteConfirmInput !== project.name || isDeleting) ? 'rgba(255,255,255,0.5)' : '#fff',
                            border: 'none',
                            padding: '9px 18px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: (deleteConfirmInput !== project.name || isDeleting) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Project'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteProjectModal;
