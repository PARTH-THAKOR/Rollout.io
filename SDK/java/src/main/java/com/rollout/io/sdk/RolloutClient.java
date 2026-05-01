package com.rollout.io.sdk;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * Rollout.io Java SDK
 * Official high-performance SDK for real-time feature management.
 * Designed for server-side environments.
 *
 * @version 5.0.1
 */
public class RolloutClient {

    private static final String FULL_API_PATH = "/apiSdk/v1/sdk";
    
    private RolloutConfig config;
    private Map<String, Object> flags = new HashMap<>();
    private boolean isInitialized = false;
    private final List<Consumer<Map<String, Object>>> listeners = new ArrayList<>();
    
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private ScheduledExecutorService pollingExecutor;

    public RolloutClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Initialize the SDK with the provided configuration.
     *
     * @param config The SDK configuration.
     * @throws Exception If initialization fails.
     */
    public synchronized void init(RolloutConfig config) throws Exception {
        if (config.getSdkKey() == null || config.getUserId() == null) {
            throw new IllegalArgumentException("RolloutSDK: sdkKey and userId are required for initialization.");
        }
        
        this.config = config;
        
        // Initial fetch of flags
        fetchFlags();
        this.isInitialized = true;

        if (this.config.getRefreshInterval() > 0) {
            startPolling();
        }
    }

    /**
     * Evaluate a feature flag. Returns the boolean flag value or the default value.
     *
     * @param key          The unique identifier for the feature flag.
     * @param defaultValue The value to return if the flag is missing or not yet fetched.
     * @return The evaluated flag value.
     */
    public boolean getFlag(String key, boolean defaultValue) {
        Object value = flags.getOrDefault(key, defaultValue);
        boolean booleanValue = defaultValue;
        
        if (value instanceof Boolean) {
            booleanValue = (Boolean) value;
        } else if (value instanceof String) {
            booleanValue = Boolean.parseBoolean((String) value);
        }
        
        reportUsage(key, booleanValue);
        return booleanValue;
    }

    /**
     * Evaluate a feature flag. Returns the object flag value or the default value.
     *
     * @param key          The unique identifier for the feature flag.
     * @param defaultValue The value to return if the flag is missing or not yet fetched.
     * @return The evaluated flag value.
     */
    public Object getFlagObject(String key, Object defaultValue) {
        Object value = flags.getOrDefault(key, defaultValue);
        reportUsage(key, value);
        return value;
    }

    /**
     * Register a listener for real-time flag updates.
     *
     * @param callback Function receiving the updated flags map.
     */
    public synchronized void onUpdate(Consumer<Map<String, Object>> callback) {
        if (callback != null) {
            this.listeners.add(callback);
        }
    }

    private void fetchFlags() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("sdkKey", config.getSdkKey());
        payload.put("userId", config.getUserId());
        payload.put("attributes", config.getAttributes());
        payload.put("platform", "java");
        payload.put("baseUrl", config.getBaseUrl());
        payload.put("refreshInterval", config.getRefreshInterval());

        String jsonPayload = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getBaseUrl() + FULL_API_PATH + "/flags"))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(response.body());
            if (root.has("success") && root.get("success").asBoolean() && root.has("data")) {
                JsonNode data = root.get("data");
                if (data.has("flags")) {
                    JsonNode flagsNode = data.get("flags");
                    Map<String, Object> newFlags = objectMapper.convertValue(flagsNode, Map.class);
                    this.flags = newFlags != null ? newFlags : new HashMap<>();
                    notifyListeners();
                }
            }
        } else {
            System.err.println("RolloutSDK: Communication error during flag fetch. HTTP Status: " + response.statusCode());
        }
    }

    private void reportUsage(String flagKey, Object variationValue) {
        if (!isInitialized) return;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("sdkKey", config.getSdkKey());
            payload.put("userId", config.getUserId());
            payload.put("flagKey", flagKey);
            payload.put("variationValue", variationValue);

            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.getBaseUrl() + FULL_API_PATH + "/report"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            // Fire and forget
            httpClient.sendAsync(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            // No-op for telemetry failure
        }
    }

    private synchronized void notifyListeners() {
        for (Consumer<Map<String, Object>> listener : listeners) {
            try {
                listener.accept(new HashMap<>(this.flags));
            } catch (Exception e) {
                System.err.println("RolloutSDK: Error in flag update listener: " + e.getMessage());
            }
        }
    }

    private synchronized void startPolling() {
        if (pollingExecutor != null && !pollingExecutor.isShutdown()) {
            pollingExecutor.shutdownNow();
        }
        pollingExecutor = Executors.newSingleThreadScheduledExecutor();
        pollingExecutor.scheduleAtFixedRate(() -> {
            try {
                fetchFlags();
            } catch (Exception e) {
                System.err.println("RolloutSDK: Background flag fetch failed: " + e.getMessage());
            }
        }, config.getRefreshInterval(), config.getRefreshInterval(), TimeUnit.MILLISECONDS);
    }

    /**
     * Stop polling and clear listeners to prevent memory leaks.
     */
    public synchronized void destroy() {
        if (pollingExecutor != null && !pollingExecutor.isShutdown()) {
            pollingExecutor.shutdownNow();
        }
        this.listeners.clear();
        this.isInitialized = false;
    }
}
