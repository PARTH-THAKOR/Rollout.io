import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { authApi } from '../api/apiClient';
import { useAuthStore } from '../store/useStore';
import { useQueryClient } from '@tanstack/react-query';
import { getFriendlyErrorMessage } from '../utils/errorFormatter';
import '../styles/welcome.css';
import '../styles/login.css';
import 'remixicon/fonts/remixicon.css';

const Login = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setUser, isAuthenticated } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isAuthenticating) return;
        
        setError('');
        
        // Client-side validations
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }
        
        if (!rememberMe) {
            setError('Please check the Remember me box to continue');
            return;
        }
        
        try {
            setIsAuthenticating(true);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Store user in Zustand for global access
            setUser(userCredential.user);
            // Sync user identity to backend (must complete before navigating)
            try {
                await authApi('/users/me');
            } catch (syncError) {
                console.warn('Backend identity sync failed:', syncError);
            }
            // Flush ALL stale data from previous user sessions before navigating
            queryClient.removeQueries();
            queryClient.clear();
            navigate('/dashboard', { replace: true });
        } catch (error) {
            setError(getFriendlyErrorMessage(error));
            setIsAuthenticating(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (isAuthenticating) return;
        try {
            setIsAuthenticating(true);
            const userCredential = await signInWithPopup(auth, googleProvider);
            // Store user in Zustand for global access
            setUser(userCredential.user);
            // Sync user identity to backend (must complete before navigating)
            try {
                await authApi('/users/me');
            } catch (syncError) {
                console.warn('Backend identity sync failed:', syncError);
            }
            // Flush ALL stale data from previous user sessions before navigating
            queryClient.removeQueries();
            queryClient.clear();
            navigate('/dashboard', { replace: true });
        } catch (error) {
            setError(getFriendlyErrorMessage(error));
            setIsAuthenticating(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && !isAuthenticating) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isAuthenticating, navigate]);

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
                    <div className="badge-outline" style={{ marginBottom: '30px' }}>Workspace Access</div>
                    {error && (
                        <div className="error-alert">
                            <i className="ri-error-warning-fill"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="login-form-inline" onSubmit={handleLogin} noValidate>
                        <input type="email" className="login-input" placeholder="Email Address" required maxLength={100} value={email} onChange={(e) => setEmail(e.target.value)} />
                        <input type="password" className="login-input" placeholder="Password" required maxLength={50} value={password} onChange={(e) => setPassword(e.target.value)} />

                        <div className="login-options">
                            <label className="remember-checkbox">
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                <span>Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                        </div>

                        <div className="hero-actions" style={{ marginTop: '5px' }}>
                            <button type="submit" className="hero-btn hero-btn-primary" disabled={isAuthenticating} style={{ width: '100%', cursor: isAuthenticating ? 'not-allowed' : 'pointer', opacity: isAuthenticating ? 0.7 : 1 }}>
                                {isAuthenticating ? 'Authenticating...' : 'Log In to Dashboard'}
                            </button>
                        </div>
                    </form>

                    <div className="login-divider">
                        <span>or continue with</span>
                    </div>

                    <div className="social-inline">
                        <button type="button" className="btn-social" onClick={handleGoogleLogin} disabled={isAuthenticating} style={{ fontSize: '15px', fontWeight: '500', gap: '8px', opacity: isAuthenticating ? 0.7 : 1, cursor: isAuthenticating ? 'not-allowed' : 'pointer' }}>
                            <i className="ri-google-fill" style={{ fontSize: '22px' }}></i> {isAuthenticating ? 'Please wait...' : 'Continue with Google'}
                        </button>
                    </div>

                    <p className="signup-prompt">
                        New to Rollout.io? <Link to="/signup">Create a workspace</Link>
                    </p>
                </div>
            </section>
        </>
    );
};

export default Login;
