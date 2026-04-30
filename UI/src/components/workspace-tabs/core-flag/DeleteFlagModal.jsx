import React, { useState, useEffect } from 'react';
import { controlPlaneApi } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/config';
import { unwrapResponse } from '../../../api/queries';

// ═══════════════════════════════════════════════════════════
//  DeleteFlagModal — Confirmation modal for deleting a flag
// ═══════════════════════════════════════════════════════════

const DeleteFlagModal = ({ flag, onClose, onDeleteSuccess, onDeleteError, deleteEndpoint }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    // Safety check: requires typing the exact key or generic 'delete'
    const matchTarget = flag.key;
    const canDelete = confirmText === matchTarget;

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleDelete = async () => {
        if (!canDelete || isDeleting) return;
        setIsDeleting(true);

        try {
            await unwrapResponse(
                await controlPlaneApi((deleteEndpoint || ENDPOINTS.CORE_FLAG_BY_ID)(flag.id), { method: 'DELETE' })
            );
            onDeleteSuccess(flag.id);
        } catch (error) {
            console.error('Failed to delete flag:', error);
            onDeleteError(flag.id);
        } finally {
            if (document.body.contains(document.getElementById(`delete-modal-${flag.id}`))) {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} id={`delete-modal-${flag.id}`}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '92%', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <i className="ri-alert-fill" style={{ fontSize: '24px', color: '#ef4444' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={flag.displayName || flag.name || flag.key}>
                            Delete Flag ({flag.displayName || flag.name || flag.key})
                        </h3>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span className="flag-key-mono" style={{ fontSize: '11px', padding: '2px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }} title={flag.key}>{flag.key}</span>
                            <span style={{ flexShrink: 0 }}>•</span>
                            <span style={{ textTransform: 'capitalize', flexShrink: 0 }}>{flag.type.toLowerCase()}</span>
                        </div>
                    </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                    Are you sure you want to delete this feature flag? This will permanently remove it from the workspace.
                    <strong style={{ color: '#ef4444', display: 'block', marginTop: '6px' }}>This action cannot be undone.</strong>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
                        To confirm, please type <strong style={{ userSelect: 'all', color: '#fff' }}>{matchTarget}</strong> below:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="login-input"
                        placeholder={matchTarget}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        autoFocus
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        className="btn-ghost"
                        disabled={isDeleting}
                        style={{ padding: '9px 16px' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={!canDelete || isDeleting}
                        style={{
                            background: (!canDelete || isDeleting) ? 'rgba(239, 68, 68, 0.4)' : '#ef4444',
                            color: (!canDelete || isDeleting) ? 'rgba(255,255,255,0.5)' : '#fff',
                            border: 'none',
                            padding: '9px 18px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: (!canDelete || isDeleting) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isDeleting ? (
                            <><i className="ri-loader-4-line spin" style={{ fontSize: '16px' }}></i> Deleting...</>
                        ) : (
                            <><i className="ri-delete-bin-line"></i> Delete Flag</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteFlagModal;
