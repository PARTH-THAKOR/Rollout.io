/**
 * Formats standard Firebase Auth errors and custom application errors
 * into human-readable messages.
 * 
 * @param {Error|Object|string} error The error object or message to format
 * @returns {string} A friendly error message suitable for displaying to the user
 */
export function getFriendlyErrorMessage(error) {
    if (!error) return "An unknown error occurred.";
    
    const message = error.message || String(error);
    
    // Check specific Firebase Auth error codes/messages
    if (message.includes("auth/popup-closed-by-user") || message.includes("auth/cancelled-popup-request")) {
        return "The login popup was closed before completing. Please try again.";
    }
    if (
        message.includes("auth/invalid-credential") || 
        message.includes("auth/wrong-password") || 
        message.includes("auth/user-not-found")
    ) {
        return "Invalid email or password. Please try again.";
    }
    if (message.includes("auth/email-already-in-use")) {
        return "This email is already registered. Please log in or use a different email.";
    }
    if (message.includes("auth/weak-password")) {
        return "Password is too weak. Please use at least 6 characters.";
    }
    if (message.includes("auth/invalid-email")) {
        return "Please enter a valid email address.";
    }
    if (message.includes("auth/network-request-failed")) {
        return "Network error. Please check your internet connection.";
    }
    if (message.includes("auth/too-many-requests")) {
        return "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
    }
    if (message === "SERVER_DOWN" || message.includes("SERVER_DOWN")) {
        return "Backend server is offline or unreachable. Please try again later.";
    }
    
    if (message.includes("Project with this name already exists") || message.includes("Project already exists")) {
        return "A project with this name already exists. Please choose a unique name.";
    }
    if (message.includes("Environment with this name already exists") || message.includes("Environment already exists")) {
        return "An environment with this name already exists in this project.";
    }
    if (message.includes("Flag with this key already exists")) {
        return "A feature flag with this key already exists in this environment.";
    }
    if (message.includes("Flag with this name already exists") || message.includes("Flag name already exists")) {
        return "A feature flag with this display name already exists in this environment.";
    }
    if (
        message.includes("Flag already exists") ||
        message.includes("already exists in the environment")
    ) {
        if (message.toLowerCase().includes("key")) {
            return "A feature flag with this key already exists in this environment.";
        }
        return "A feature flag with this display name already exists in this environment.";
    }
    if (message.includes("Dependency cycle detected") || message.includes("cycle")) {
        return "Cannot save: a dependency cycle would be created. Please adjust prerequisites.";
    }
    if (message.includes("Key must contain only lowercase letters, numbers, and underscores")) {
        return "Invalid key format. Only lowercase letters, numbers, and underscores are allowed.";
    }

    // General / fallback formatting
    return message;
}
