# Rollout.io JavaScript SDK

## Overview
The Rollout.io JavaScript SDK is an enterprise-grade, high-performance library designed for modern distributed web applications. Built with native ES Modules (ESM) support, it enables real-time feature flag evaluation and remote configuration management directly from the browser or Node.js runtimes.

## Core Capabilities
- **Real-Time Evaluation:** Ultra-low latency flag resolution powered by the Rollout.io API Gateway and Redis caching layer.
- **Asynchronous Telemetry:** Built-in usage metrics reporting that runs asynchronously without blocking the main execution thread.
- **Polling & Real-Time Sync:** Support for background polling to synchronize configurations dynamically.
- **Zero-Error Initialization Guard:** An internal safety mechanism ensuring network requests and telemetry are deferred until the `init()` sequence fully completes.

## Installation

### Installation
Execute the following command in your project's root directory:

```bash
npm install "@rollout.io/sdk-js@latest"
```

## API Reference

The SDK exposes a singleton instance with the following public methods:

### `init(config)`
Initializes the SDK and fetches the initial configuration state from the Control Plane. This must be called before evaluating any flags.

**Parameters (config object):**
- `sdkKey` (String, **required**): Your environment-specific SDK Key.
- `userId` (String, **required**): The unique identifier for the current user.
- `attributes` (Object, optional): Custom key-value pairs used for targeting logic. Defaults to `{}`.
- `baseUrl` (String, optional): The URL of your API Gateway.
- `refreshInterval` (Number, optional): Polling interval in milliseconds to automatically fetch flag updates. Set to `0` to disable background polling. Defaults to `0`.

**Returns:**
- `Promise<RolloutSDK>`: Resolves when the initial flag fetch successfully completes.

**Example:**
```javascript
import sdk from '@rollout.io/sdk-js';

export const initRollout = async (userId) => {
    try {
        await sdk.init({
            sdkKey: 'YOUR_SDK_KEY',
            userId: userId,
            attributes: { role: 'admin', plan: 'premium' },
            baseUrl: 'http://rollout.paraglide.in/gateway', // Live Production Gateway (or "http://localhost:80/gateway" for local)
            refreshInterval: 30000        // Polling interval in milliseconds (30s)
        });
        console.log('Rollout.io SDK initialized successfully.');
    } catch (error) {
        console.error('Rollout.io Initialization failed:', error);
    }
};
```

### `getFlag(key, defaultValue)`
Retrieves the evaluated value of a feature flag. This operates synchronously by reading from the internal cache populated during initialization. It also automatically dispatches telemetry to the Control Plane.

**Parameters:**
- `key` (String, **required**): The unique identifier for the feature flag.
- `defaultValue` (Any, optional): The fallback value to return if the flag is missing or not yet fetched. Defaults to `false`.

**Returns:**
- `Any`: The evaluated flag value.

**Example:**
```javascript
// sdk.getFlag(String flagKey, boolean fallbackValue)
const isBannerEnabled = sdk.getFlag('hero-banner-v2', false);

if (isBannerEnabled) {
    // Render the new hero banner feature
    displayBanner();
} else {
    // Render the default fallback experience
    displayDefaultHeader();
}
```

### `onUpdate(callback)`
Subscribes a listener that triggers whenever the remote configuration state changes. This is highly useful for reacting to live configuration updates fetched by the polling mechanism.

**Parameters:**
- `callback` (Function, **required**): A callback function that receives the updated `flags` object.

**Example:**
```javascript
// Listen for real-time remote configuration changes
sdk.onUpdate((flags) => {
    console.log('Remote configuration state has been updated:', flags);
    
    // In React, you might trigger a state update here:
    // setFeatures(flags);
});
```

### `destroy()`
Cleans up the SDK instance. It stops all active background polling threads and clears event listeners to prevent memory leaks. Use this during component unmounting or application teardown.

**Parameters:** None

**Example:**
```javascript
// Unmount or cleanup function
function teardownApplication() {
    console.log('Shutting down Rollout.io SDK connections...');
    sdk.destroy();
}
```

## Architecture and Directory Structure
- `/src/index.js` - Core SDK execution logic and telemetry engine.
- `/src/index.d.ts` - TypeScript type definitions for strict typing support.
- `/package.json` - Package manifest and dependency configurations.

## Troubleshooting and Debugging
- **Cross-Origin Resource Sharing (CORS) Errors:** Ensure that your client-side application's origin and port are correctly whitelisted in the ApiGateway's `SecurityConfig.java`.
- **Flag Evaluation Failures:** Verify that the provided `sdkKey` exactly matches the environment configuration present in the Rollout.io Control Plane.
- **Port Collisions:** The SDK natively defaults to targeting port `80` for the Gateway. If your infrastructure routes the API Gateway through a custom port, explicitly define it via the `baseUrl` parameter during the `init()` phase.

---
(C) 2026 Rollout.io Engineering Team
