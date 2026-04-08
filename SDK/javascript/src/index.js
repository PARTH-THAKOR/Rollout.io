import axios from 'axios';

/**
 * Rollout.io JavaScript SDK
 * Official high-performance SDK for real-time feature management.
 * Designed for modern web applications and server-side environments.
 * 
 * @version 5.0.9
 */
class RolloutSDK {
    constructor() {
        this.version = '5.0.9';
        this.sdkKey = null;
        this.userId = null;
        this.attributes = {};
        this.baseUrl = null;
        this.fullApiPath = '/apiSdk/v1/sdk';
        this.flags = {};
        this.isInitialized = false;
        this.refreshInterval = null;
        this._listeners = [];
        this._pollingTimer = null;
    }

    /**
     * Initialize the SDK with the provided configuration.
     * @param {Object} config - { sdkKey, userId, attributes, baseUrl, refreshInterval }
     */
    async init(config = {}) {
        this.sdkKey = config.sdkKey;
        this.userId = config.userId;
        this.attributes = config.attributes || {};

        let host = config.baseUrl || this.baseUrl;
        this.baseUrl = host.replace(/\/$/, ''); // Normalize base URL
        this.refreshInterval = config.refreshInterval || 0;

        if (!this.sdkKey || !this.userId) {
            throw new Error('RolloutSDK: sdkKey and userId are required for initialization.');
        }

        // Initial fetch of flags
        await this._fetchFlags();
        this.isInitialized = true;

        if (this.refreshInterval > 0) {
            this._startPolling();
        }

        return this;
    }

    /**
     * Evaluate a feature flag. Returns the flag value or the default value.
     * @param {string} key - The unique identifier for the feature flag.
     * @param {*} defaultValue - The value to return if the flag is missing or not yet fetched.
     */
    getFlag(key, defaultValue = false) {
        const value = this.flags[key] !== undefined ? this.flags[key] : defaultValue;
        this._reportUsage(key, value);
        return value;
    }

    /**
     * Register a listener for real-time flag updates.
     * @param {Function} callback - Function received the updated flags object.
     */
    onUpdate(callback) {
        if (typeof callback === 'function') {
            this._listeners.push(callback);
        }
    }

    /**
     * Internal: Fetches evaluated flags from the SDK Service.
     */
    async _fetchFlags() {
        try {
            const payload = {
                sdkKey: this.sdkKey,
                userId: this.userId,
                attributes: this.attributes,
                platform: typeof window !== 'undefined' ? 'browser' : 'node',
                baseUrl: this.baseUrl,
                refreshInterval: this.refreshInterval
            };

            const response = await axios.post(`${this.baseUrl}${this.fullApiPath}/flags`, payload, {
                headers: { 'Accept': 'application/json' }
            });

            if (response.data && response.data.success && response.data.data) {
                this.flags = response.data.data.flags || {};
                this._notify();
            }
        } catch (error) {
            console.error('RolloutSDK: Communication error during flag fetch.', error.message);
            throw error;
        }
    }

    /**
     * Internal: Reports evaluation usage for analytics and metrics.
     */
    _reportUsage(flagKey, variationValue) {
        // Prevent reporting before init is complete to avoid hitting default URLs
        if (!this.isInitialized) return;

        const payload = {
            sdkKey: this.sdkKey,
            userId: this.userId,
            flagKey: flagKey,
            variationValue: variationValue
        };

        // Fire and forget: analytics shouldn't block main logic
        axios.post(`${this.baseUrl}${this.fullApiPath}/report`, payload).catch(() => {
            // No-op for telemetry failure
        });
    }

    /**
     * Notify all listeners of flag changes.
     */
    _notify() {
        this._listeners.forEach(callback => callback(this.flags));
    }

    /**
     * Start background polling for flag updates.
     */
    _startPolling() {
        if (this._pollingTimer) clearInterval(this._pollingTimer);
        this._pollingTimer = setInterval(() => this._fetchFlags(), this.refreshInterval);
    }

    /**
     * Stop polling and clear listeners to prevent memory leaks.
     */
    destroy() {
        if (this._pollingTimer) clearInterval(this._pollingTimer);
        this._listeners = [];
        this.isInitialized = false;
    }
}

// Export a singleton instance for global use
const sdk = new RolloutSDK();
export default sdk;
