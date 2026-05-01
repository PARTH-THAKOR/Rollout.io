# ROLLOUT.IO JAVA SDK (v5.0.1)
## IMPLEMENTATION GUIDE

### I. OVERVIEW
The Rollout.io Java SDK is a high-performance, lightweight library designed for server-side environments. It provides real-time feature flag evaluation with production-grade telemetry, built specifically to integrate seamlessly with Spring Boot and standard Java applications.

### II. INSTALLATION
Navigate to your project's `pom.xml` and add the dependency:

```xml
<dependencies>
    <dependency>
        <groupId>com.rollout.io</groupId>
        <artifactId>sdk-java</artifactId>
        <version>5.0.1</version>
    </dependency>
</dependencies>

<repositories>
    <repository>
        <id>github</id>
        <name>GitHub Packages</name>
        <url>https://maven.pkg.github.com/TechParaglide/Rollout.io</url>
    </repository>
</repositories>
```
*(Requires Maven configuration to authenticate with GitHub Packages. See GitHub Packages Guide).*

### III. PROFESSIONAL IMPLEMENTATION

For robust integration, follow the singleton or Bean injection pattern provided below.

#### 1. Create a Provider Pattern (e.g., Spring Boot Config):

```java
import com.rollout.io.sdk.RolloutClient;
import com.rollout.io.sdk.RolloutConfig;

public class RolloutService {
    private RolloutClient client;

    public void initializeSdk(String userId) {
        try {
            client = new RolloutClient();
            RolloutConfig config = new RolloutConfig(
                "YOUR_SDK_KEY",
                userId,
                "http://localhost" // Points to ApiGateway
            );
            
            // Set refresh interval (ms). 0 disables polling.
            config.setRefreshInterval(30000); 
            
            client.init(config);
            System.out.println("SDK initialized successfully");
        } catch (Exception e) {
            System.err.println("Initialization failed: " + e.getMessage());
        }
    }

    public RolloutClient getClient() {
        return client;
    }
}
```

#### 2. Evaluating Flags:
Use the `client.getFlag` method to retrieve values. This method automatically reports usage metrics to the Control Plane asynchronously.

```java
boolean isNewFeatureEnabled = client.getFlag("hero-banner-v2", false);

if (isNewFeatureEnabled) {
    // Execute new feature logic
}
```

### IV. ZERO-ERROR INITIALIZATION GUARD
The SDK includes an internal initialization guard. Telemetry and network requests are safely ignored until the `init()` method completes. Network communication relies on Java 11+ built-in `HttpClient` to minimize dependencies while ensuring high throughput.

### V. DIRECTORY STRUCTURE
- `/src/main/java/com/rollout/io/sdk/RolloutClient.java`: Core SDK logic.
- `/src/main/java/com/rollout/io/sdk/RolloutConfig.java`: Configuration wrapper.
- `/pom.xml`: Package configuration and dependencies.

### VI. TROUBLESHOOTING
- **Jackson Errors**: Ensure `jackson-databind` is included in your project dependencies.
- **Missing Flags**: Verify your SDK key matches the environment configured in the Control Plane dashboard.
- **Port Collisions**: By default, the SDK assumes standard ports. If your gateway runs on a custom port, specify it via the `baseUrl` parameter in your `RolloutConfig`.

---
**DOCUMENTATION END**
(C) 2026 Rollout.io Engineering Team
