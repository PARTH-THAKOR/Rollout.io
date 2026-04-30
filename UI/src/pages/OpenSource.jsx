import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/welcome.css';
import '../styles/dashboard.css';
import 'remixicon/fonts/remixicon.css';
import '../styles/pages/open-source.css';
import Sidebar from '../components/Sidebar';

const OpenSource = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    useEffect(() => {
        const cursor = document.getElementById('cursor-glow');
        const moveCursor = (e) => {
            if (cursor) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }
        };
        document.addEventListener('mousemove', moveCursor);
        return () => document.removeEventListener('mousemove', moveCursor);
    }, []);

    const repos = [
        {
            name: 'rollout-react-client',
            desc: 'Official React bindings for Rollout.io feature flags.',
            stars: 1240, forks: 312, lang: 'TypeScript', color: '#3178c6',
            updated: 'Updated 2 hours ago'
        },
        {
            name: 'rollout-node-core',
            desc: 'Core Node.js client for evaluating flags server-side.',
            stars: 985, forks: 198, lang: 'JavaScript', color: '#f7df1e',
            updated: 'Updated yesterday'
        },
        {
            name: 'rollout-cli',
            desc: 'Command line interface for managing Rollout workspaces.',
            stars: 450, forks: 89, lang: 'Go', color: '#00ADD8',
            updated: 'Updated last week'
        },
        {
            name: 'rollout-python-client',
            desc: 'Python client for high-performance server flag evaluation.',
            stars: 890, forks: 245, lang: 'Python', color: '#3572A5',
            updated: 'Updated 3 days ago'
        }
    ];

    return (
        <>
            <div id="cursor-glow"></div>
            <div className="stars small"></div>
            <div className="stars medium"></div>
            <div className="stars large"></div>

            <div className="dashboard-layout">
                {/* Collapsible Sidebar */}
                <Sidebar isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

                {/* Main Content Area */}
                <div className="main-wrapper">
                    <header className="workspace-header">
                        <div className="header-left">
                            <div className="badge-outline" style={{ marginBottom: 0 }}>Open Source Community</div>
                        </div>

                        <div className="header-right">
                            <div className="search-bar glass-panel">
                                <i className="ri-search-line"></i>
                                <input
                                    type="text"
                                    placeholder="Search repositories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="btn btn-primary btn-icon" onClick={() => setIsGithubModalOpen(true)} style={{ padding: '10px 20px', fontSize: '14px', background: '#333', borderColor: '#444' }}>
                                <i className="ri-github-fill"></i> View on GitHub
                            </button>
                        </div>
                    </header>

                    <main className="dashboard-content">

                        {/* OSS Stats */}
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    Global Stars <i className="ri-star-fill" style={{ color: '#f59e0b' }}></i>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 600, color: '#fff' }}>3.5k+</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    Contributors <i className="ri-group-fill" style={{ color: '#10B981' }}></i>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 600, color: '#fff' }}>142</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    Pull Requests <i className="ri-git-pull-request-line" style={{ color: '#8b5cf6' }}></i>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 600, color: '#fff' }}>89 <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 }}>Open</span></div>
                            </div>
                        </div>

                        {/* Repo List */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                            {repos.map((repo, i) => (
                                <div key={i} className="glass-card repo-card" style={{ padding: '24px', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="ri-book-mark-line" style={{ color: 'var(--text-secondary)' }}></i>
                                            {repo.name}
                                        </h3>
                                        <button className="icon-btn" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', gap: '6px' }}>
                                            <i className="ri-star-line"></i> Star
                                        </button>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px', height: '42px' }}>{repo.desc}</p>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: repo.color, display: 'inline-block' }}></span> {repo.lang}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ri-star-line"></i> {repo.stars}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ri-git-branch-line"></i> {repo.forks}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '12px' }}>{repo.updated}</span>
                                    </div>
                                </div>
                            ))}
                        </div>


                    </main>
                </div>
            </div>

            {/* View on GitHub Modal */}
            {isGithubModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card" style={{ padding: '0', overflow: 'hidden' }}>

                        {/* Modal Header */}
                        <div style={{ padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <i className="ri-github-fill" style={{ fontSize: '28px', color: '#fff' }}></i>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>TechParaglide Open Source</h3>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>github.com/techparaglide</span>
                                </div>
                            </div>
                            <button className="icon-btn" onClick={() => setIsGithubModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                            </button>
                        </div>

                        {/* Modal Body - Repo List */}
                        <div className="github-repo-list" style={{ padding: '20px 30px', maxHeight: '400px', overflowY: 'auto' }}>
                            {repos.map((repo, idx) => (
                                <div key={idx} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '16px', transition: 'all 0.2s' }} className="hover-row">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <a href="#" style={{ color: '#58a6ff', fontSize: '16px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="ri-git-repository-line" style={{ color: 'var(--text-secondary)' }}></i> {repo.name}
                                        </a>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: 'var(--text-secondary)' }}>Public</span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: '8px 0 16px 0' }}>{repo.desc}</p>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: repo.color, display: 'inline-block' }}></span> {repo.lang}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ri-star-line"></i> {repo.stars}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ri-git-branch-line"></i> {repo.forks}</span>
                                        <span style={{ marginLeft: 'auto' }}>{repo.updated}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '20px 30px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>
                            <button className="btn btn-primary" style={{ width: '100%', background: '#2ea043', borderColor: '#2ea043', fontWeight: 600, padding: '12px 24px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                                <i className="ri-external-link-line"></i> Visit GitHub Organization
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OpenSource;
