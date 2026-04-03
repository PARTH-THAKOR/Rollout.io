package com.rollout.io.server.sdkservice.service;

import com.rollout.io.server.sdkservice.objects.*;

import java.util.Map;

/**
 * Unified SDK Service interface for flag initialization, merged reporting, and analytics.
 */
public interface SdkService {

    /**
     * Bootstraps the SDK environment by extracting purely the accessible boolean parameters.
     *
     * @param sdkConfig explicit configuration mapping boundary isolating target user payload
     * @return structurally typed proxy response transmitting validated evaluation states
     */
    SdkProxyResponse getFlagsForSdk(SdkConfig sdkConfig);

    /**
     * Logs exact platform interaction traces into batch aggregates generating visual telemetry.
     *
     * @param report primitive matrix reporting evaluation choices and frequencies
     */
    void recordUnifiedReport(SdkReport report);

    /**
     * Resolves high-performance cached histograms displaying the analytical telemetry inside UI components.
     *
     * @param sdkKey exact natively configured application container security hash
     * @return fully deserialized representation containing metrics across target subsets
     */
    Map<String, Object> getEnvironmentStats(String sdkKey);

}
