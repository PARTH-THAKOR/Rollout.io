package com.rollout.io.server.sdkservice.controllers;

import com.rollout.io.server.sdkservice.objects.ApiResponse;
import com.rollout.io.server.sdkservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.sdkservice.objects.SdkConfig;
import com.rollout.io.server.sdkservice.objects.SdkProxyResponse;
import com.rollout.io.server.sdkservice.service.SdkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Primary edge controller for evaluating feature flags at runtime.
 * Provides public endpoints to frontend client SDKs allowing them to dynamically resolve flags for single users.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/sdk")
@RequiredArgsConstructor
@Tag(name = "SDK Proxy Management", description = "Endpoints for SDK clients to fetch definitions")
public class SdkController {

    private final SdkService sdkService;

    @PostMapping("/flags")
    @Operation(summary = "Get SDK Flags", description = "SDK init endpoint. Accepts SdkConfig with sdkKey, userId, and optional attributes. Returns evaluated flags with deterministic percentage rollout per user.")
    public ResponseEntity<ApiResponse<SdkProxyResponse>> fetchFlagsForInit(
            @RequestBody @Valid SdkConfig sdkConfig) {
        log.info("SDK init request. Key: {}, UserId: {}", sdkConfig.getSdkKey(), sdkConfig.getUserId());
        SdkProxyResponse response = sdkService.getFlagsForSdk(sdkConfig);
        return ApiResponseBuilder.out(HttpStatus.OK, "SDK Flags fetched successfully", response);
    }
}
