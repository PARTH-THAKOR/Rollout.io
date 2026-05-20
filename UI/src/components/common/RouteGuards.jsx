import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useStore';

/**
 * PublicRoute ensures that if a user is ALREADY logged in, 
 * they cannot access public pages like Welcome, Login, Signup.
 * Instead, they are redirected to the Dashboard.
 */
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, isAuthLoading } = useAuthStore();
    
    // While checking initial auth state, render nothing or a loader
    if (isAuthLoading) return null;

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

/**
 * ProtectedRoute ensures that if a user is NOT logged in, 
 * they cannot access private pages like Dashboard, Workspace, Settings.
 * Instead, they are redirected to the Welcome page.
 */
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isAuthLoading } = useAuthStore();
    const location = useLocation();
    
    // While checking initial auth state, render nothing or a loader
    if (isAuthLoading) return null;

    if (!isAuthenticated) {
        // Redirect to welcome, but save the attempted location so we can redirect back later if needed
        // (Though in your strict flow, they just go to welcome)
        return <Navigate to="/welcome" state={{ from: location }} replace />;
    }

    return children;
};

/**
 * AuthRoute is for pages like Login, Signup, and ForgotPassword.
 * It prevents the router from immediately unmounting the page upon Firebase sign-in success,
 * allowing the page component to complete backend user synchronization before navigating.
 */
export const AuthRoute = ({ children }) => {
    const { isAuthLoading } = useAuthStore();
    
    if (isAuthLoading) return null;

    return children;
};
