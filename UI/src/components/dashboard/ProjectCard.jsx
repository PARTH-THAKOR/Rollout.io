import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Single project card with action menu (Update / Delete).
 */
const ProjectCard = ({ project, isMenuOpen, onToggleMenu, onUpdate, onDelete }) => {
    return (
        <Link
            to={project.link}
            className="project-card"
            style={{ zIndex: isMenuOpen ? 1000 : 1 }}
        >
            <div className="project-card-header">
                <div className={`project-icon ${project.glow}`}>
                    <i className={project.icon} />
                </div>
                <div
                    className={`project-actions-btn ${isMenuOpen ? 'is-active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleMenu();
                    }}
                >
                    <i className="ri-more-2-fill" />

                    {isMenuOpen && (
                        <div className="project-action-menu">
                            <button
                                className="action-menu-item action-update"
                                onClick={(e) => onUpdate(project, e)}
                            >
                                <i className="ri-pencil-line" /> Update
                            </button>
                            <div className="action-menu-divider" />
                            <button
                                className="action-menu-item action-delete"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(project.id);
                                }}
                            >
                                <i className="ri-delete-bin-line" /> Remove
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="project-info">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-desc">{project.description}</p>
                {project.createdAt && (
                    <div className="project-meta">
                        <span><i className="ri-time-line" /> {project.createdAt}</span>
                    </div>
                )}
            </div>
        </Link>
    );
};

export default ProjectCard;
