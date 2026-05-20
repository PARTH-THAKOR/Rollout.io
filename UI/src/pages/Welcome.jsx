import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/welcome.css';
import 'remixicon/fonts/remixicon.css';

const Welcome = () => {
    useEffect(() => {
        const cursor = document.getElementById('cursor-glow');
        const moveCursor = (e) => {
            if (cursor) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }
        };
        document.addEventListener('mousemove', moveCursor);

        return () => {
            document.removeEventListener('mousemove', moveCursor);
        };
    }, []);

    return (
        <>
            <div id="cursor-glow"></div>
            {/* Background Stars */}
            <div className="stars small"></div>
            <div className="stars medium"></div>
            <div className="stars large"></div>

            {/* Clean Navigation */}
            <nav className="navbar">
                <div className="nav-brand-container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link to="/" className="logo" style={{ marginBottom: 0 }}>Rollout<span className="dot">.</span>io</Link>
                    <div className="desktop-only"
                        style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '20px', height: '24px', cursor: 'default' }}>
                        <span
                            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px', color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.5px' }}>TechParaglide.inc</span>
                    </div>
                </div>

                <div className="nav-links">
                    <a href="https://rollout.paraglide.in" target="_blank" rel="noopener noreferrer" className="nav-doc-link">
                        <i className="ri-book-open-line"></i>
                        <span>Documentation</span>
                        <i className="ri-arrow-right-up-line" style={{ fontSize: '11px', opacity: 0.55 }}></i>
                    </a>
                </div>
            </nav>

            {/* Center Hero Section */}
            <section className="hero-section wrapper">
                <div className="hero-content">
                    <div className="badge-outline">Workspace Portal</div>

                    <h1 className="hero-title">
                        Welcome to your <br />
                        <span className="gradient-text gradient-animated">Dashboard.</span>
                    </h1>

                    <p className="hero-description">
                        The enterprise-grade platform for managing feature flags, targeting rules, and remote configurations.
                        Authenticate to securely access your workspaces and routing pipelines.
                    </p>

                    <div className="hero-actions">
                        <Link to="/login" className="hero-btn hero-btn-primary glow-effect">
                            <i className="ri-login-circle-line"></i>
                            Log In to Dashboard
                        </Link>
                        <Link to="/signup" className="hero-btn hero-btn-outline">
                            Create Workspace
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Welcome;
