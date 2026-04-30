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
}) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <div className="modal-top-bar">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-btn" onClick={onClose}>
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
                            className="login-input"
                            required
                            value={values.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder={namePlaceholder}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Description <span className="form-required">*</span>
                        </label>
                        <textarea
                            className="login-input modal-textarea"
                            required
                            value={values.description}
                            onChange={(e) => onChange('description', e.target.value)}
                            placeholder={descPlaceholder}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectModal;
