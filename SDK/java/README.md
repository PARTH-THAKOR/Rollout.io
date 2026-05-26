# Rollout.io Java SDK

## Overview
The Rollout.io Java SDK is an enterprise-grade, high-performance library designed for modern server-side Java and Spring Boot environments. It provides real-time feature flag evaluation with production-grade telemetry, built utilizing the native Java 11+ `HttpClient` for optimal throughput and minimal dependency overhead.

## Core Capabilities
- **Real-Time Evaluation:** Ultra-low latency flag resolution powered by the Rollout.io API Gateway and Redis caching layer.
- **Asynchronous Telemetry:** Built-in usage metrics reporting that executes asynchronously (fire-and-forget) without blocking application threads.
- **Polling & Real-Time Sync:** Built-in ScheduledExecutorService for background polling to synchronize configurations dynamically.
- **Zero-Error Initialization Guard:** Network requests and telemetry are safely ignored until the `init()` sequence fully completes.

## Installation

### Add the JitPack Repository
Since this SDK is distributed via JitPack, add the repository to your `pom.xml`:

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>
```

### Add the Dependency
Include the SDK artifact in your `pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>com.github.TechParaglide</groupId>
        <artifactId>Rollout.io</artifactId>
        <version>5.0.5</version>
    </dependency>
</dependencies>
```

## Professional Implementation Guide

For robust integration in Spring Boot or standard Java applications, we highly recommend utilizing a Singleton or Bean injection pattern to ensure the SDK is instantiated only once per application lifecycle.

### SDK Initialization Example

```java
import com.rollout.io.sdk.RolloutClient;
import com.rollout.io.sdk.RolloutConfig;
import java.util.HashMap;
import java.util.Map;

public class RolloutService {
    private RolloutClient client;

    public void initializeSdk(String userId) {
        try {
            client = new RolloutClient();
            RolloutConfig config = new RolloutConfig(
                "YOUR_SDK_KEY",
                userId,
                "http://rollout.paraglide.in/gateway" // Live Production Gateway
            );
            
            // Optional: Configure contextual attributes for advanced targeting
            Map<String, Object> attributes = new HashMap<>();
            attributes.put("role", "admin");
            attributes.put("plan", "premium");
            config.setAttributes(attributes);

            // Optional: Set polling interval in milliseconds (e.g., 30s)
            config.setRefreshInterval(30000); 
            
            client.init(config);
            System.out.println("Rollout.io SDK initialized successfully.");
        } catch (Exception e) {
            System.err.println("Rollout.io Initialization failed: " + e.getMessage());
        }
    }

    public RolloutClient getClient() {
        return client;
    }
}
```

## API Reference

The SDK exposes the `RolloutClient` instance with the following public methods:

### `init(RolloutConfig config)`
Initializes the SDK and fetches the initial configuration state from the Control Plane. This must be called before evaluating any flags.

**Parameters (`RolloutConfig` object):**
- `sdkKey` (String, **required**): Passed via constructor. Your environment-specific SDK Key.
- `userId` (String, **required**): Passed via constructor. The unique identifier for the current user.
- `baseUrl` (String, **required**): Passed via constructor. The URL of your API Gateway.
- `refreshInterval` (long, optional): Polling interval in milliseconds to automatically fetch flag updates. Set via `setRefreshInterval()`. Defaults to `0` (disabled).
- `attributes` (Map<String, Object>, optional): Custom key-value pairs used for targeting logic. Set via `setAttributes()`.

**Returns:** `void` (Throws `Exception` if network failure occurs during initialization).

### `getFlag(String key, boolean defaultValue)`
Retrieves the evaluated boolean value of a feature flag. This operates synchronously by reading from the internal cache populated during initialization. It also automatically dispatches telemetry to the Control Plane.

**Parameters:**
- `key` (String, **required**): The unique identifier for the feature flag.
- `defaultValue` (boolean, **required**): The fallback value to return if the flag is missing or not yet fetched.

**Returns:**
- `boolean`: The evaluated flag value.

**Example:**
```java
boolean isBannerEnabled = client.getFlag("hero-banner-v2", false);

if (isBannerEnabled) {
    // Render the new hero banner feature
} else {
    // Render the default fallback experience
}
```

### `getFlagObject(String key, Object defaultValue)`
Retrieves the evaluated complex object value (JSON/String/Number) of a feature flag.

**Parameters:**
- `key` (String, **required**): The unique identifier for the feature flag.
- `defaultValue` (Object, **required**): The fallback object to return if the flag is missing.

**Returns:**
- `Object`: The evaluated flag object.

**Example:**
```java
Object rateLimitConfig = client.getFlagObject("api-rate-limit", 100);
int currentLimit = (Integer) rateLimitConfig;
```

### `onUpdate(Consumer<Map<String, Object>> callback)`
Subscribes a listener that triggers whenever the remote configuration state changes. This is highly useful for reacting to live configuration updates fetched by the polling mechanism.

**Parameters:**
- `callback` (Consumer, **required**): A functional interface that receives the updated `flags` Map.

**Example:**
```java
client.onUpdate(flags -> {
    System.out.println("Remote configuration state has been updated: " + flags.size() + " flags received.");
    // Invalidate local application caches or trigger state changes
});
```

### `destroy()`
Cleans up the SDK instance. It stops all active background polling ScheduledExecutorService threads and clears event listeners to prevent memory leaks. Use this during bean destruction or application teardown.

**Parameters:** None

**Example:**
```java
// Spring Boot PreDestroy or application shutdown hook
public void teardownApplication() {
    System.out.println("Shutting down Rollout.io SDK connections...");
    client.destroy();
}
```

## Architecture and Directory Structure
- `/src/main/java/com/rollout/io/sdk/RolloutClient.java` - Core SDK execution logic and telemetry engine.
- `/src/main/java/com/rollout/io/sdk/RolloutConfig.java` - Configuration wrapper.
- `/pom.xml` - Package manifest and Maven dependencies.

## Troubleshooting and Debugging
- **Jackson Errors:** Ensure `jackson-databind` (v2.15.2+) is available in your classpath, as it is utilized for internal JSON deserialization.
- **Flag Evaluation Failures:** Verify that the provided `sdkKey` exactly matches the environment configuration present in the Rollout.io Control Plane.
- **Port Collisions:** If your infrastructure routes the API Gateway through a custom port, explicitly define it via the `baseUrl` constructor parameter during instantiation.

---
(C) 2026 Rollout.io Engineering Team
