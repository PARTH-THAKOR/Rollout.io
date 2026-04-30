import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ─── Route-level lazy loading ────────────────────────────────
// Each page is loaded on-demand as a separate chunk.
// This dramatically reduces the initial bundle size.
const Welcome = lazy(() => import('./pages/Welcome.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace.jsx'));
const Documentation = lazy(() => import('./pages/Documentation.jsx'));
const OpenSource = lazy(() => import('./pages/OpenSource.jsx'));
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
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/welcome" element={<Welcome />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/workspace" element={<ProjectWorkspace />} />
                    <Route path="/docs" element={<Documentation />} />
                    <Route path="/opensource" element={<OpenSource />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
