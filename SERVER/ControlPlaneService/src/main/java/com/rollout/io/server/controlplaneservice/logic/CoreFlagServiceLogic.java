package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.*;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.repository.FlagRepository;
import com.rollout.io.server.controlplaneservice.service.AuditLogService;
import com.rollout.io.server.controlplaneservice.service.EnvironmentService;
import com.rollout.io.server.controlplaneservice.service.CoreFlagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Concrete implementation of the CoreFlagService interface.
 * Manages atomic data operations for base flags, orchestrating validations, dependency blockages, and audit logs.
 */
@Service
@RequiredArgsConstructor
public class CoreFlagServiceLogic implements CoreFlagService {

    private final FlagRepository flagRepository;
    private final EnvironmentService environmentService;
    private final FlagHelperLogic flagHelperLogic;
    private final AuditLogService auditLogService;

    @Override
    public Flag createCoreFlag(Jwt jwt, String environmentId, Flag flag) {
        flagHelperLogic.validateAndPrepareForCreation(jwt, environmentId, flag);

        flag.setCategory(FlagCategory.CORE);
        flag.setDependency(null); // Ensure dependency is null for CORE flags

        Flag saved = flagRepository.save(flag);
        auditLogService.logActivity(environmentId, "CREATE_FLAG", saved.getId(), "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), flag.getKey());
        return saved;
    }

    @Override
    public List<Flag> getCoreFlags(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);
        return flagRepository.findAllByEnvironmentIdAndCategory(environmentId, FlagCategory.CORE);
    }

    @Override
    public List<Flag> getBasicCoreFlags(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);
        return flagRepository.findAllByEnvironmentIdAndCategoryAndTypeNot(environmentId, FlagCategory.CORE, FlagType.JSON);
    }

    @Override
    public List<Flag> getJsonCoreFlags(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);
        return flagRepository.findAllByEnvironmentIdAndCategoryAndType(environmentId, FlagCategory.CORE, FlagType.JSON);
    }

    @Override
    public Flag getCoreFlag(Jwt jwt, String flagId) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new RolloutError("Flag not found", HttpStatus.NOT_FOUND));
        
        // Validate access
        environmentService.getEnvironmentById(jwt, flag.getEnvironmentId());

        return flag;
    }

    @Override
    public List<Flag> getCoreFlagsBySdkKey(String sdkKey) {
        // Find environment using the SDK key (public access endpoint concept)
        Environment environment = environmentService.getEnvironmentBySdkKey(sdkKey);

        return flagRepository.findAllByEnvironmentIdAndCategory(environment.getId(), FlagCategory.CORE);
    }

    @Override
    public Flag updateCoreFlag(Jwt jwt, String flagId, Flag updateRequest) {
        Flag existingFlag = getCoreFlag(jwt, flagId); // Handles access check

        // Only allow core updates for now
        if (existingFlag.getCategory() != FlagCategory.CORE) {
             throw new RolloutError("Only Core flags can be updated via this endpoint", HttpStatus.BAD_REQUEST);
        }

        boolean valueChanged = flagHelperLogic.validateAndApplyUpdate(existingFlag, updateRequest);
        
        if (valueChanged) {
            int currentVersion = existingFlag.getVersion() == null ? 1 : existingFlag.getVersion();
            existingFlag.setVersion(currentVersion + 1); // Increment version on value change
        }

        existingFlag.setUpdatedAt(Instant.now());
        Flag saved = flagRepository.save(existingFlag);
        if (valueChanged) {
             auditLogService.logActivity(existingFlag.getEnvironmentId(), "UPDATE_FLAG", saved.getId(), "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), "Value modified");
        } else {
             auditLogService.logActivity(existingFlag.getEnvironmentId(), "UPDATE_FLAG", saved.getId(), "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), "Metadata modified");
        }
        return saved;
    }

    @Override
    public void deleteCoreFlag(Jwt jwt, String flagId) {
        Flag flag = getCoreFlag(jwt, flagId); // Handles access check

        List<Flag> dependentFlags = flagRepository.findAllByEnvironmentIdAndCategory(flag.getEnvironmentId(), FlagCategory.DEPENDENT);

        List<String> blockingFlags = new java.util.ArrayList<>();

        for (Flag depFlag : dependentFlags) {
            if (depFlag.getDependency() != null && hasDependencyOnCoreFlag(depFlag.getDependency(), flagId)) {
                blockingFlags.add(depFlag.getKey());
            }
        }

        if (!blockingFlags.isEmpty()) {
            throw new RolloutError(
                "Cannot delete flag. It is used by dependent flags: " + String.join(", ", blockingFlags),
                HttpStatus.BAD_REQUEST
            );
        }

        flagRepository.delete(flag);
        auditLogService.logActivity(flag.getEnvironmentId(), "DELETE_FLAG", flagId, "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), flag.getKey());
    }

    private boolean hasDependencyOnCoreFlag(RuleNode node, String coreFlagId) {
        if (node.getOperator() != null && node.getChildren() != null) {
            for (RuleNode child : node.getChildren()) {
                if (hasDependencyOnCoreFlag(child, coreFlagId)) {
                    return true;
                }
            }
        } else if (node.getCondition() != null) {
            return coreFlagId.equals(node.getCondition().getFlagId());
        }
        return false;
    }

    @Override
    public Flag toggleCoreFlag(Jwt jwt, String flagId) {
        Flag flag = getCoreFlag(jwt, flagId);
        // Only allow core updates for now
        if (flag.getCategory() != FlagCategory.CORE) {
             throw new RolloutError("Only Core flags can be toggled via this endpoint", HttpStatus.BAD_REQUEST);
        }
        flagHelperLogic.applyToggle(flag);
        Flag saved = flagRepository.save(flag);
        auditLogService.logActivity(flag.getEnvironmentId(), "TOGGLE_FLAG", flagId, "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), "Target state: " + flag.getEnabled());
        return saved;
    }

}
