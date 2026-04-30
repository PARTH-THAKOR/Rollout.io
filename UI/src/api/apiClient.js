import { auth } from '../firebase';
import { API_CONFIG, API_PATHS, getServicePath } from './config';

const getAuthToken = async () => {
    await auth.authStateReady();
    if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
    }
    return null;
};

export const apiClient = async (path, options = {}) => {
    const token = await getAuthToken();
    const headers = {
        'Accept': '*/*',
        ...options.headers,
    };

    // Only set Content-Type if body is present and not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;

    const response = await fetch(url, {
        ...options,
        headers,
        cache: options.cache || 'no-store', // Prevent aggressive browser HTTP caching on sensitive endpoints across user switches
    });

    return response;
};

/**
 * High-level helpers for specific services
 */

export const controlPlaneApi = async (endpoint, options = {}) => {
    return await apiClient(getServicePath(endpoint, API_PATHS.CONTROL_PLANE), options);
};

export const authApi = async (endpoint, options = {}) => {
    return await apiClient(getServicePath(endpoint, API_PATHS.AUTH), options);
};

