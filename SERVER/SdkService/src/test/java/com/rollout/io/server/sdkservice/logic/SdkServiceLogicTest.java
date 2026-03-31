package com.rollout.io.server.sdkservice.logic;

import com.rollout.io.server.sdkservice.entity.Environment;
import com.rollout.io.server.sdkservice.entity.Flag;
import com.rollout.io.server.sdkservice.objects.SdkConfig;
import com.rollout.io.server.sdkservice.objects.SdkProxyResponse;
import com.rollout.io.server.sdkservice.repository.EnvironmentRepository;
import com.rollout.io.server.sdkservice.repository.FlagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SdkServiceLogicTest {

    @Mock
    private EnvironmentRepository environmentRepository;

    @Mock
    private FlagRepository flagRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private SdkServiceLogic sdkServiceLogic;

    private Environment environment;
    private Flag testFlag;

    @BeforeEach
    void setUp() {
        environment = new Environment();
        environment.setId("env-123");
        environment.setSdkKey("sdk-key-123");

        testFlag = new Flag();
        testFlag.setId("flag-123");
        testFlag.setKey("sample-feature");
        testFlag.setEnabled(true);
        testFlag.setValue(true);
        testFlag.setRolloutPercentage(100);
    }

    @Test
    void getFlagsForSdk_returnsEvaluatedFlagsWhenNoCache() {
        // Arrange
        SdkConfig config = new SdkConfig();
        config.setSdkKey("sdk-key-123");
        config.setUserId("user-456");

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sdk:flags:sdk-key-123")).thenReturn(null);

        when(environmentRepository.findBySdkKey("sdk-key-123")).thenReturn(Optional.of(environment));
        when(flagRepository.findByEnvironmentId("env-123")).thenReturn(Collections.singletonList(testFlag));

        // Act
        SdkProxyResponse response = sdkServiceLogic.getFlagsForSdk(config);

        // Assert
        assertNotNull(response);
        assertEquals("sdk-key-123", response.getEnvironmentKey());
        assertTrue(response.getFlags().containsKey("sample-feature"));
        assertEquals(true, response.getFlags().get("sample-feature"));
        
        // Verify caching happened
        verify(valueOperations, times(1)).set(eq("sdk:flags:sdk-key-123"), anyList());
    }

    @Test
    void getFlagsForSdk_evaluatesHashRolloutCorrectly() {
        // Assume 0% rollout - meaning flag shouldn't be accessible
        testFlag.setRolloutPercentage(0);

        SdkConfig config = new SdkConfig();
        config.setSdkKey("sdk-key-123");
        config.setUserId("user-456"); // User shouldn't get the flag if 0%

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sdk:flags:sdk-key-123")).thenReturn(null);
        when(environmentRepository.findBySdkKey("sdk-key-123")).thenReturn(Optional.of(environment));
        when(flagRepository.findByEnvironmentId("env-123")).thenReturn(Collections.singletonList(testFlag));

        SdkProxyResponse response = sdkServiceLogic.getFlagsForSdk(config);
        
        // Assert that the flag is missing or false from the flags map because of 0% Rollout
        assertFalse(response.getFlags().containsKey("sample-feature") && (Boolean)response.getFlags().get("sample-feature") == true);
    }
}
