/**
 * API Configuration
 * 
 * BASE_URL: The API Gateway address (default: localhost:80 via docker-compose).
 * 
 * The gateway routes requests by path prefix:
 *   /apiAuth/**   → AuthService
 *   /apiControl/** → ControlPlaneService
 *   /apiSdk/**    → SdkService
 */

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:80',
};

/**
 * Backend API path prefixes (through the API Gateway)
 */
export const API_PATHS = {
    AUTH:          '/apiAuth/v1',
    CONTROL_PLANE: '/apiControl/v1',
};

/**
 * ControlPlane endpoints
 */
export const ENDPOINTS = {
    // Projects
    PROJECTS:                    '/projects',
    PROJECT_BY_ID:               (id) => `/projects/${id}`,
    PROJECT_SEARCH:              '/projects/search',
    PROJECT_BY_NAME:             '/projects/by-name',
    PROJECT_UPDATE_NAME:         (id) => `/projects/${id}/name`,
    PROJECT_UPDATE_DESC:         (id) => `/projects/${id}/description`,

    // Environments
    ENVIRONMENTS_BY_PROJECT:     (projectId) => `/projects/${projectId}/environments`,
    ENVIRONMENT_BY_ID:           (id) => `/environments/${id}`,
    ENVIRONMENT_UPDATE_NAME:     (id) => `/environments/${id}/name`,
    ENVIRONMENT_ROTATE_KEY:      (id) => `/environments/${id}/rotate-sdk-key`,

    // Core Flags
    CORE_FLAGS:                  (envId) => `/environments/${envId}/core-flags`,
    CORE_FLAGS_BASIC:            (envId) => `/environments/${envId}/core-flags/basic`,
    CORE_FLAGS_JSON:             (envId) => `/environments/${envId}/core-flags/json`,
    CORE_FLAG_BY_ID:             (id) => `/core-flags/${id}`,
    CORE_FLAG_TOGGLE:            (id) => `/core-flags/${id}/toggle`,

    // Dependent Flags
    DEPENDENT_FLAGS:             (envId) => `/environments/${envId}/dependent-flags`,
    DEPENDENT_FLAG_BY_ID:        (id) => `/dependent-flags/${id}`,
    DEPENDENT_FLAGS_GRAPH:       (envId) => `/environments/${envId}/dependent-flags/graph`,
    DEPENDENT_FLAG_TOGGLE:       (id) => `/dependent-flags/${id}/toggle`,

    // Audit Logs
    AUDIT_LOGS:                  (envId) => `/environments/${envId}/audit-logs`,

    // Auth (User)
    USER_ME:                     '/users/me',
    USER_UPDATE_NAME:            '/users/me/display-name',
    USER_UPDATE_PICTURE:         '/users/me/picture-url',
};

/**
 * Build a full URL for a given endpoint key by prepending the appropriate service prefix.
 *
 * @param {string} endpoint - One of the paths from the ENDPOINTS object.
 * @param {string} servicePrefix - One of the API_PATHS (AUTH, CONTROL_PLANE, SDK).
 * @returns {string} The full path string (prefix + endpoint).
 */
export function getServicePath(endpoint, servicePrefix) {
    return `${servicePrefix}${endpoint}`;
}

