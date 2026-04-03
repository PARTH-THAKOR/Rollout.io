package com.rollout.io.server.sdkservice.controllers;

import com.rollout.io.server.sdkservice.objects.*;
import com.rollout.io.server.sdkservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.sdkservice.service.SdkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public high-performance controller for client SDK initialization.
 * Hosts evaluation and unified merged reporting endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/apiSdk/v1/sdk")
@RequiredArgsConstructor
@Tag(name = "SDK Public Access", description = "Public endpoints for client SDK initialization and reporting")
public class SdkController {

    private final SdkService sdkService;

    /**
     * Handles complex platform requests dynamically evaluating explicitly targeted flag components synchronously.
     *
     * @param sdkConfig validation mapping block containing explicit client request telemetry paths
     * @return fully formatted boolean and literal matrix matching the requested mapped environments
     */
    @PostMapping("/flags")
    @Operation(summary = "Init Flags", description = "Fetches and evaluates flags for a user init.")
    public ResponseEntity<ApiResponse<SdkProxyResponse>> fetchFlagsForInit(
            @RequestBody @Valid SdkConfig sdkConfig) {
        log.info("PUBLIC: SDK Init request for key: {}", sdkConfig.getSdkKey());
        SdkProxyResponse response = sdkService.getFlagsForSdk(sdkConfig);
        return ApiResponseBuilder.out(HttpStatus.OK, "Flags fetched successfully", response);
    }

    /**
     * Intercepts and parses usage telemetry generating absolute sequence counting hashes seamlessly.
     *
     * @param report explicitly typed boundary reporting exact feature subset hit limits
     * @return explicitly structured HTTP response signaling background processing acceptance 
     */
    @PostMapping("/report")
    @Operation(summary = "Merged Analytics Report", description = "Unified endpoint for usage and simplified diagnostics. Incremental +1 tracking.")
    public ResponseEntity<ApiResponse<Void>> recordUnifiedReport(
            @RequestBody @Valid SdkReport report) {
        sdkService.recordUnifiedReport(report);
        return ApiResponseBuilder.out(HttpStatus.ACCEPTED, "Report recorded", null);
    }

}
