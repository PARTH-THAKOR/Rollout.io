package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.entity.FlagCategory;
import com.rollout.io.server.controlplaneservice.repository.FlagRepository;
import com.rollout.io.server.controlplaneservice.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CoreFlagServiceLogicTest {

    @Mock
    private FlagRepository flagRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private CoreFlagServiceLogic coreFlagServiceLogic;

    @Mock
    private Jwt jwt;

    private Flag coreFlag;

    @BeforeEach
    void setUp() {
        coreFlag = new Flag();
        coreFlag.setId("flag-123");
        coreFlag.setEnvironmentId("env-123");
        coreFlag.setKey("sample-core");
        coreFlag.setCategory(FlagCategory.CORE);
    }

    @Test
    void deleteCoreFlag_successWhenNoDependents() {
        // Arrange
        when(jwt.getClaimAsString("uid")).thenReturn("user-123");
        when(flagRepository.findById("flag-123")).thenReturn(Optional.of(coreFlag));
        
        // Mock that there are no dependent flags in this environment
        when(flagRepository.findAllByEnvironmentIdAndCategory("env-123", FlagCategory.DEPENDENT))
            .thenReturn(Collections.emptyList());

        // Act
        assertDoesNotThrow(() -> coreFlagServiceLogic.deleteCoreFlag(jwt, "flag-123"));

        // Assert
        verify(flagRepository, times(1)).delete(coreFlag);
        // Verify Audit Log generated
        verify(auditLogService, times(1)).logActivity(
            eq("env-123"), eq("DELETE_FLAG"), eq("flag-123"), eq("FLAG"), eq("user-123"), eq("sample-core")
        );
    }

}
