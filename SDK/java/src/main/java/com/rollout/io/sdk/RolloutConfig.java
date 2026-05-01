package com.rollout.io.sdk;

import java.util.HashMap;
import java.util.Map;

public class RolloutConfig {
    private String sdkKey;
    private String userId;
    private String baseUrl;
    private long refreshInterval = 0;
    private Map<String, Object> attributes = new HashMap<>();

    public RolloutConfig(String sdkKey, String userId, String baseUrl) {
        this.sdkKey = sdkKey;
        this.userId = userId;
        this.baseUrl = baseUrl != null ? baseUrl.replaceAll("/$", "") : null;
    }

    public String getSdkKey() {
        return sdkKey;
    }

    public String getUserId() {
        return userId;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public long getRefreshInterval() {
        return refreshInterval;
    }

    public void setRefreshInterval(long refreshInterval) {
        this.refreshInterval = refreshInterval;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        if (attributes != null) {
            this.attributes = attributes;
        }
    }
}
