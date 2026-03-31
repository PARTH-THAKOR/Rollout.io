package com.rollout.io.server.sdkservice.service;

import com.rollout.io.server.sdkservice.objects.SdkConfig;
import com.rollout.io.server.sdkservice.objects.SdkProxyResponse;

/**
 * Core interface for SDK flag evaluation operations.
 * Defines the contract for fetching evaluated feature flag topologies requested by client SDKs.
 */
public interface SdkService {

    SdkProxyResponse getFlagsForSdk(SdkConfig sdkConfig);
    
}
