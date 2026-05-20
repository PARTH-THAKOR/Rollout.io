import React from 'react';

/**
 * Shared modal for creating and updating projects.
 *
 * @param {string}   title        - Modal heading ("Create New Project" / "Update Project")
 * @param {object}   values       - { name, description }
 * @param {function} onChange     - (field, value) => void
 * @param {function} onSubmit     - form submit handler
 * @param {function} onClose      - close handler
 * @param {string}   submitLabel  - button text ("Create Project" / "Update changes")
 * @param {string}   [namePlaceholder]
 * @param {string}   [descPlaceholder]
 */
const ProjectModal = ({
    title,
    values,
    onChange,
    onSubmit,
    onClose,
    submitLabel,
    namePlaceholder = '',
    descPlaceholder = '',
    serverError = '',
    isSubmitting = false,
}) => {
    const nameLen = (values.name || '').length;
    const descLen = (values.description || '').length;
    const NAME_MAX = 50;
    const DESC_MAX = 200;

    const nameCountClass = nameLen >= NAME_MAX ? 'error' : nameLen >= 40 ? 'warning' : '';
    const descCountClass = descLen >= DESC_MAX ? 'error' : descLen >= 170 ? 'warning' : '';

    return (
        <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-top-bar">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
                        <i className="ri-close-line" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">
                            Project Name <span className="form-required">*</span>
                        </label>
                        <input
                            type="text"
                            className={`login-input ${nameLen === 0 ? '' : nameLen > NAME_MAX ? 'input-error' : ''}`}
                            required
                            value={values.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder={namePlaceholder}
                            maxLength={NAME_MAX + 5}
                            disabled={isSubmitting}
                        />
                        {nameLen > 0 && (
                            <div className={`char-count ${nameCountClass}`} style={{ textAlign: 'right', marginTop: '4px' }}>
                                {nameLen}/{NAME_MAX}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Description <span className="form-required">*</span>
                        </label>
                        <textarea
                            className={`login-input modal-textarea ${descLen > DESC_MAX ? 'input-error' : ''}`}
                            required
                            value={values.description}
                            onChange={(e) => onChange('description', e.target.value)}
                            placeholder={descPlaceholder}
                            maxLength={DESC_MAX + 10}
                            disabled={isSubmitting}
                        />
                        {descLen > 0 && (
                            <div className={`char-count ${descCountClass}`} style={{ textAlign: 'right', marginTop: '4px' }}>
                                {descLen}/{DESC_MAX}
                            </div>
                        )}
                    </div>

                    {serverError && (
                        <div style={{
                            padding: '12px 16px', marginBottom: '16px', borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            display: 'flex', alignItems: 'flex-start', gap: '10px', animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <i className="ri-error-warning-fill" style={{ color: '#f87171', fontSize: '16px', flexShrink: 0, marginTop: '1px' }}></i>
                            <div style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.5, wordBreak: 'break-word', textAlign: 'left' }}>{serverError}</div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!values.name.trim() || !values.description.trim() || nameLen > NAME_MAX || descLen > DESC_MAX || isSubmitting}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            {isSubmitting ? (
                                <><i className="ri-loader-4-line spin" style={{ fontSize: '14px' }}></i> Saving...</>
                            ) : (
                                submitLabel
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectModal;
