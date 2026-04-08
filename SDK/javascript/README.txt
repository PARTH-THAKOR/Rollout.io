ROLLOUT.IO JAVASCRIPT SDK (v5.0.9)
IMPLEMENTATION GUIDE

I. OVERVIEW
The Rollout.io JavaScript SDK is a high-performance, lightweight library designed for modern web applications. It supports native ES Modules (ESM) and provides real-time feature flag evaluation with production-grade telemetry.

II. INSTALLATION
Navigate to your project root and execute:
npm install @rollout.io/sdk-js@latest

III. PROFESSIONAL IMPLEMENTATION (REACT/VITE)
For robust integration, follow the singleton pattern provided below.

1. Create a Provider Pattern (e.g., RolloutContext.tsx):
   import sdk from '@rollout.io/sdk-js';
   
   export const initRollout = async (user_id) => {
       try {
           await sdk.init({
               sdkKey: 'YOUR_SDK_KEY',
               userId: user_id,
               baseUrl: 'http://localhost',  // Points to ApiGateway
               refreshInterval: 0           // Set to 0 for single-fetch initialization
           });
           console.log('SDK initialized successfully');
       } catch (error) {
           console.error('Initialization failed', error);
       }
   };

2. Evaluating Flags:
   Use the sdk.getFlag method to retrieve values. This method automatically reports usage metrics to the Control Plane.
   
   const bannerEnabled = sdk.getFlag('hero-banner-v2', false);

IV. ZERO-ERROR INITIALIZATION GUARD
In version 5.0.9, the SDK includes an internal initialization guard. Telementry and network requests are disabled until the init() method completes. This prevents "Access-Control-Allow-Origin" errors and incorrect port hitting during the application's initial render cycle.

V. DIRECTORY STRUCTURE
- /src/index.js: Core SDK logic (ESM)
- /src/index.d.ts: TypeScript type definitions
- /package.json: Package configuration and dependencies

VI. TROUBLESHOOTING
- CORS Errors: Ensure your frontend port is whitelisted in ApiGateway's SecurityConfig.java.
- Missing Flags: Verify your SDK key matches the environment configured in the Control Plane dashboard.
- Port Collisions: By default, the SDK targets port 80 (Gateway). If your gateway runs on a custom port, specify it via the baseUrl parameter in init().

---
DOCUMENTATION END
(C) 2026 Rollout.io Engineering Team
