import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from './store/useStore';
import { PublicRoute, ProtectedRoute, AuthRoute } from './components/common/RouteGuards';

// ─── Route-level lazy loading ────────────────────────────────
// Each page is loaded on-demand as a separate chunk.
// This dramatically reduces the initial bundle size.
const Welcome = lazy(() => import('./pages/Welcome.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

// ─── Minimal full-screen loading fallback ────────────────────
// Keeps the dark theme consistent while a chunk loads.
const PageLoader = () => (
    <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060211',
    }}>
        <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#38bdf8',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

function App() {
    const { setUser, isAuthLoading } = useAuthStore();

    useEffect(() => {
        // Listen for Firebase auth state changes globally
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser); // This also sets isAuthLoading to false
        });

        return () => unsubscribe();
    }, [setUser]);

    // Show full-screen loader while checking initial auth state
    if (isAuthLoading) {
        return <PageLoader />;
    }

    return (
        <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes (Accessible only if NOT logged in) */}
                    <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
                    <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
                    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                    <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
                    <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />

                    {/* Protected Routes (Accessible only if logged in) */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/workspace" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
