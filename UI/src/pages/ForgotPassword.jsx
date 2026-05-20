import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuthStore } from '../store/useStore';
import { getFriendlyErrorMessage } from '../utils/errorFormatter';
import '../styles/welcome.css';
import '../styles/login.css';
import 'remixicon/fonts/remixicon.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (isSending) return;

        setError('');
        setSuccess('');

        // Client-side validation
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        try {
            setIsSending(true);
            await sendPasswordResetEmail(auth, email);
            setSuccess("We've sent a password reset link to your email. Please check your inbox (and spam folder).");
            setIsSending(false);
        } catch (error) {
            setError(getFriendlyErrorMessage(error));
            setIsSending(false);
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
                    <Link to="/login"><i className="ri-arrow-left-line"></i> Back to Login</Link>
                </div>
            </nav>

            {/* Center Hero Section matching Welcome exactly */}
            <section className="hero-section wrapper">
                <div className="hero-content">
                    <div className="badge-outline" style={{ marginBottom: '30px' }}>Reset Password</div>
                    
                    {error && (
                        <div className="error-alert">
                            <i className="ri-error-warning-fill"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="success-alert" style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            color: '#10b981',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            marginBottom: '24px',
                            textAlign: 'left',
                            fontSize: '14px',
                            fontFamily: "'Inter', sans-serif",
                            lineHeight: '1.5'
                        }}>
                            <i className="ri-checkbox-circle-fill" style={{ fontSize: '18px', marginTop: '2px', color: '#10b981' }}></i>
                            <span>{success}</span>
                        </div>
                    )}

                    {!success && (
                        <form className="login-form-inline" onSubmit={handleResetPassword} noValidate>
                            <p style={{
                                color: 'rgba(255, 255, 255, 0.65)',
                                fontSize: '14px',
                                fontFamily: "'Inter', sans-serif', sans-serif",
                                lineHeight: '1.6',
                                marginBottom: '20px',
                                textAlign: 'center'
                            }}>
                                Enter the email address associated with your workspace, and we'll send you a link to reset your password.
                            </p>
                            
                            <input 
                                type="email" 
                                className="login-input" 
                                placeholder="Work Email Address" 
                                required 
                                maxLength={100}
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                style={{ marginBottom: '20px' }}
                            />

                            <div className="hero-actions" style={{ marginTop: '5px', width: '100%' }}>
                                <button 
                                    type="submit" 
                                    className="hero-btn hero-btn-primary" 
                                    disabled={isSending} 
                                    style={{ 
                                        width: '100%', 
                                        cursor: isSending ? 'not-allowed' : 'pointer', 
                                        opacity: isSending ? 0.7 : 1 
                                    }}
                                >
                                    {isSending ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="signup-prompt" style={{ marginTop: success ? '0' : '24px' }}>
                        Remember your password? <Link to="/login">Log in here</Link>
                    </p>
                </div>
            </section>
        </>
    );
};

export default ForgotPassword;
