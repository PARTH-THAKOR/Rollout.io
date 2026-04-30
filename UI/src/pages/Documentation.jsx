import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/welcome.css';
import '../styles/dashboard.css';
import 'remixicon/fonts/remixicon.css';
import Sidebar from '../components/Sidebar';
import '../styles/pages/documentation.css';

const Documentation = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const docSections = [
        {
            icon: 'ri-rocket-fill', color: 'blue',
            title: 'Getting Started',
            desc: 'Learn how to integrate the Rollout.io into your application.'
        },
        {
            icon: 'ri-flag-2-fill', color: 'green',
            title: 'Feature Flags 101',
            desc: 'Understand Boolean, Multivariate, and JSON flag types.'
        },
        {
            icon: 'ri-group-fill', color: 'purple',
            title: 'Targeting & Segments',
            desc: 'Target specific user groups based on location, age, or custom attributes.'
        },
        {
            icon: 'ri-code-box-fill', color: 'red',
            title: 'REST API Reference',
            desc: 'Programmatically manage flags via our Admin REST API.'
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
                    <header className="workspace-header" style={{ borderBottom: 'none' }}>
                        <div className="header-left">
                            <div className="badge-outline" style={{ marginBottom: 0 }}>Knowledge Base</div>
                        </div>
                    </header>

                    <main className="dashboard-content">
                        <div style={{ textAlign: 'center', marginBottom: '50px', marginTop: '20px' }}>
                            <h2 style={{ fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>How can we help?</h2>
                            <div className="search-bar glass-panel" style={{ width: '600px', maxWidth: '100%', margin: '0 auto', padding: '8px 16px' }}>
                                <i className="ri-search-line" style={{ fontSize: '20px' }}></i>
                                <input
                                    type="text"
                                    placeholder="Search for guides or API endpoints..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ fontSize: '16px', padding: '10px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            {docSections.map((doc, i) => (
                                <div key={i} className="glass-card doc-card" style={{ padding: '30px', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `var(--${doc.color}-glow)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff', marginBottom: '20px' }}>
                                        <i className={doc.icon}></i>
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>{doc.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{doc.desc}</p>
                                    <div style={{ marginTop: '20px', color: 'var(--blue)', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Read more <i className="ri-arrow-right-line"></i>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="glass-card" style={{ marginTop: '40px', padding: '40px', textAlign: 'center', background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(75,131,255,0.05) 100%)' }}>
                            <i className="ri-question-answer-line" style={{ fontSize: '48px', color: 'var(--blue)', marginBottom: '16px', display: 'inline-block' }}></i>
                            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '10px' }}>Can't find what you're looking for?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Our support team is available 24/7 to help you out.</p>
                            <button className="btn btn-primary" style={{ padding: '10px 24px' }}>Contact Support</button>
                        </div>


                    </main>
                </div>
            </div>
        </>
    );
};

export default Documentation;
