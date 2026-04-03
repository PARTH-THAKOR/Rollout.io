package com.rollout.io.server.sdkservice.controllers;

import com.rollout.io.server.sdkservice.objects.*;
import com.rollout.io.server.sdkservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.sdkservice.service.SdkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Management controller for SDK authenticated operations strictly accessed by the Admin dashboard proxies.
 */
@Slf4j
@RestController
@RequestMapping("/apiSdk/v1/admin/sdk")
@RequiredArgsConstructor
@Tag(name = "SDK Admin Management", description = "Secure management for SDKs (Requires Auth)")
public class SdkAdminController {

    private final SdkService sdkService;

    /**
     * Fetches real-time telemetry histograms analyzing isolated SDK hash distribution parameters securely.
     *
     * @param sdkKey constrained target evaluation token mapping limits correctly
     * @return matrix mapped object parsing exact metrics matching configured namespaces
     */
    @GetMapping("/stats/{sdkKey}")
    @Operation(summary = "Get SDK Env Stats (PRIVATE)", description = "Fetch usage, hits, and health metrics for dashboard. Requires Auth.")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getSdkStats(
            @PathVariable String sdkKey) {
        java.util.Map<String, Object> stats = sdkService.getEnvironmentStats(sdkKey);
        return ApiResponseBuilder.out(HttpStatus.OK, "Stats fetched successfully", stats);
    }

}
