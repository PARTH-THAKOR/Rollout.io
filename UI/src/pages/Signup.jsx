import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { authApi } from '../api/apiClient';
import { useAuthStore } from '../store/useStore';
import '../styles/welcome.css';
import '../styles/login.css';
import 'remixicon/fonts/remixicon.css';

const Signup = () => {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        if (isAuthenticating) return;
        setError('');
        try {
            setIsAuthenticating(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Store user in Zustand for global access
            setUser(userCredential.user);
            try {
                await authApi('/users/me');
                if (name) {
                    await authApi(`/users/me/display-name?displayName=${encodeURIComponent(name)}`, { method: 'PATCH' });
                }
            } catch (syncError) {
                console.warn('Backend identity sync failed:', syncError);
            }
            navigate('/dashboard');
        } catch (error) {
            setError(error.message);
            setIsAuthenticating(false);
        }
    };

    const handleGoogleSignup = async () => {
        if (isAuthenticating) return;
        try {
            setIsAuthenticating(true);
            const userCredential = await signInWithPopup(auth, googleProvider);
            // Store user in Zustand for global access
            setUser(userCredential.user);
            try {
                await authApi('/users/me');
            } catch (syncError) {
                console.warn('Backend identity sync failed:', syncError);
            }
            navigate('/dashboard');
        } catch (error) {
            setError(error.message);
            setIsAuthenticating(false);
        }
    };

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
                    <Link to="/"><i className="ri-arrow-left-line"></i> Back to Home</Link>
                </div>
            </nav>

            {/* Center Hero Section matching Welcome exactly */}
            <section className="hero-section wrapper">
                <div className="hero-content">
                    <div className="badge-outline" style={{ marginBottom: '30px' }}>Create Workspace</div>
                    {error && <div style={{ color: '#ff4d4d', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

                    <form className="login-form-inline" onSubmit={handleSignup}>
                        <input type="text" className="login-input" placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
                        <input type="email" className="login-input" placeholder="Work Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        <input type="password" className="login-input" placeholder="Password (min. 8 characters)" required value={password} onChange={(e) => setPassword(e.target.value)} />

                        <div className="hero-actions" style={{ marginTop: '10px' }}>
                            <button type="submit" className="btn btn-primary" disabled={isAuthenticating} style={{ width: '100%', textAlign: 'center', border: 'none', cursor: isAuthenticating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 'inherit', opacity: isAuthenticating ? 0.7 : 1 }}>
                                {isAuthenticating ? 'Creating Workspace...' : 'Create Free Workspace'}
                            </button>
                        </div>
                    </form>

                    <div className="login-divider">
                        <span>or continue with</span>
                    </div>

                    <div className="social-inline">
                        <button type="button" className="btn-social" onClick={handleGoogleSignup} disabled={isAuthenticating} style={{ fontSize: '15px', fontWeight: '500', gap: '8px', opacity: isAuthenticating ? 0.7 : 1, cursor: isAuthenticating ? 'not-allowed' : 'pointer' }}>
                            <i className="ri-google-fill" style={{ fontSize: '22px' }}></i> {isAuthenticating ? 'Please wait...' : 'Continue with Google'}
                        </button>
                    </div>

                    <p className="signup-prompt">
                        Already have an account? <Link to="/login">Log in here</Link>
                    </p>
                </div>
            </section>
        </>
    );
};

export default Signup;
