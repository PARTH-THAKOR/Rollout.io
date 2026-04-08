/**
 * Rollout.io JavaScript SDK Type Definitions
 */

declare interface RolloutConfig {
    /**
     * The SDK key for your environment.
     */
    sdkKey: string;
    /**
     * The unique identifier for the user.
     */
    userId: string;
    /**
     * Optional custom attributes for targeting.
     */
    attributes?: Record<string, any>;
    /**
     * The base URL of the SDK service (ApiGateway).
     */
    baseUrl?: string;
    /**
     * Polling interval in milliseconds (0 to disable).
     */
    refreshInterval?: number;
}

declare class RolloutSDK {
    version: string;
    isInitialized: boolean;
    flags: Record<string, any>;
    
    /**
     * Initializes the SDK.
     */
    init(config: RolloutConfig): Promise<this>;
    
    /**
     * Returns the evaluated value of a feature flag.
     */
    getFlag<T = any>(key: string, defaultValue: T): T;
    
    /**
     * Subscribes to flag updates.
     */
    onUpdate(callback: (flags: Record<string, any>) => void): void;
    
    /**
     * Destroys the SDK instance and stops polling.
     */
    destroy(): void;
}

declare const sdk: RolloutSDK;
export default sdk;
