package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.*;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.helpers.JwtHelper;
import com.rollout.io.server.controlplaneservice.repository.FlagRepository;
import com.rollout.io.server.controlplaneservice.service.AuditLogService;
import com.rollout.io.server.controlplaneservice.service.CoreFlagService;
import com.rollout.io.server.controlplaneservice.service.EnvironmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
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

    /**
     * Instantiates a new standalone CORE feature flag inside a mapped environment.
     * Enforces that properties are correct and dependency maps are cleanly isolated.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the mapped target namespace where the flag resides
     * @param flag the configuration object payload representing the flag parameters
     * @return the fully generated Core Flag document saved to MongoDB
     */
    @Override
    public Flag createCoreFlag(Jwt jwt, String environmentId, Flag flag) {
        flagHelperLogic.validateAndPrepareForCreation(jwt, environmentId, flag);

        flag.setCategory(FlagCategory.CORE);
        flag.setDependency(null);

        Flag saved = flagRepository.save(flag);
        auditLogService.logActivity(environmentId, "CREATE_FLAG", saved.getId(), "FLAG", JwtHelper.getUidFromJwt(jwt), flag.getKey());
        return saved;
    }

    /**
     * Resolves all CORE categorized flags belonging strictly to the mapped environment.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the environment identity boundary parameter
     * @return a mapped sequence list evaluating every active standalone core flag
     */
    @Override
    public List<Flag> getCoreFlags(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);
        return flagRepository.findAllByEnvironmentIdAndCategory(environmentId, FlagCategory.CORE);
    }

    /**
     * Fetches only subset CORE flags where structural typing excludes raw generic JSON payloads.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the requested environment identifier
     * @return a list array containing purely structured boolean/numeric/string flags
     */
    @Override
    public List<Flag> getBasicCoreFlags(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);
        return flagRepository.findAllByEnvironmentIdAndCategoryAndTypeNot(environmentId, FlagCategory.CORE, FlagType.JSON);
    }

    /**
     * Scans specifically for raw dynamically formatted JSON object CORE flags.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the active mapping environment identifier
     * @return collection containing solely JSON variant feature flags
     */
    @Override
    public List<Flag> getJsonCoreFlags(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);
        return flagRepository.findAllByEnvironmentIdAndCategoryAndType(environmentId, FlagCategory.CORE, FlagType.JSON);
    }

    /**
     * Selects and extracts a precise CORE flag mapping securely by its explicit document ID.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId the individual database document key locating the flag
     * @return the fully populated instantiated Flag model
     * @throws RolloutError if the document does not exist
     */
    @Override
    public Flag getCoreFlag(Jwt jwt, String flagId) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new RolloutError("Flag not found", HttpStatus.NOT_FOUND));
        
        environmentService.getEnvironmentById(jwt, flag.getEnvironmentId());

        return flag;
    }

    /**
     * Background evaluation extractor meant largely for runtime proxy SDK systems validating state blocks.
     * Relies seamlessly on the generated platform SDK Key token mapped inside the environment headers.
     *
     * @param sdkKey secure application token assigned independently to an environment
     * @return a raw subset block holding every evaluated CORE logic flag accessible by environment
     */
    @Override
    public List<Flag> getCoreFlagsBySdkKey(String sdkKey) {
        Environment environment = environmentService.getEnvironmentBySdkKey(sdkKey);
        return flagRepository.findAllByEnvironmentIdAndCategory(environment.getId(), FlagCategory.CORE);
    }

    /**
     * Enforces delta validation blocks, increments logical document version counters, 
     * and securely stores target metadata/value overwrites for a standalone flag.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId specific document signature identifying the active flag
     * @param updateRequest incoming partial snapshot describing new configurations
     * @return the cleanly processed active document persisted synchronously
     * @throws RolloutError if types diverge, boundaries overlap or categories conflict
     */
    @Override
    public Flag updateCoreFlag(Jwt jwt, String flagId, Flag updateRequest) {
        Flag existingFlag = getCoreFlag(jwt, flagId); 

        if (existingFlag.getCategory() != FlagCategory.CORE) {
             throw new RolloutError("Only Core flags can be updated via this endpoint", HttpStatus.BAD_REQUEST);
        }

        boolean valueChanged = flagHelperLogic.validateAndApplyUpdate(existingFlag, updateRequest);
        
        if (valueChanged) {
            int currentVersion = existingFlag.getVersion() == null ? 1 : existingFlag.getVersion();
            existingFlag.setVersion(currentVersion + 1);
        }

        existingFlag.setUpdatedAt(Instant.now());
        Flag saved = flagRepository.save(existingFlag);
        if (valueChanged) {
             auditLogService.logActivity(existingFlag.getEnvironmentId(), "UPDATE_FLAG", saved.getId(), "FLAG", JwtHelper.getUidFromJwt(jwt), "Value modified");
        } else {
             auditLogService.logActivity(existingFlag.getEnvironmentId(), "UPDATE_FLAG", saved.getId(), "FLAG", JwtHelper.getUidFromJwt(jwt), "Metadata modified");
        }
        return saved;
    }

    /**
     * Hard-erases an identified CORE mapped feature flag, verifying first that 
     * no active DEPENDENT configurations rely on implicitly onto its baseline value.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId exact document sequence representing the flag configuration cache
     * @throws RolloutError if blocked by hierarchical dependency integrity conditions
     */
    @Override
    public void deleteCoreFlag(Jwt jwt, String flagId) {
        Flag flag = getCoreFlag(jwt, flagId);

        List<Flag> dependentFlags = flagRepository.findAllByEnvironmentIdAndCategory(flag.getEnvironmentId(), FlagCategory.DEPENDENT);
        List<String> blockingFlags = new ArrayList<>();

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
        auditLogService.logActivity(flag.getEnvironmentId(), "DELETE_FLAG", flagId, "FLAG", JwtHelper.getUidFromJwt(jwt), flag.getKey());
    }

    /**
     * Helper recursive graph verifier crawling internal hierarchy node branches
     * tracking conditional literal dependencies tied directly to the targeted flag.
     *
     * @param node currently evaluated branch root block inside the logical graph
     * @param coreFlagId specific parent flag reference identifier mapping downstream requirements
     * @return boolean signal declaring if an active constraint blockage exists
     */
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

    /**
     * Efficiently flips only the standalone enabled constraint parameters
     * governing evaluation execution routing bypassing complex delta verifications.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId active core flag record being mapped dynamically
     * @return fully persisted new object referencing toggled enabled flags
     * @throws RolloutError if the requested toggle hits non-Core categorical restrictions
     */
    @Override
    public Flag toggleCoreFlag(Jwt jwt, String flagId) {
        Flag flag = getCoreFlag(jwt, flagId);
        if (flag.getCategory() != FlagCategory.CORE) {
             throw new RolloutError("Only Core flags can be toggled via this endpoint", HttpStatus.BAD_REQUEST);
        }
        flagHelperLogic.applyToggle(flag);
        Flag saved = flagRepository.save(flag);
        auditLogService.logActivity(flag.getEnvironmentId(), "TOGGLE_FLAG", flagId, "FLAG", JwtHelper.getUidFromJwt(jwt), "Target state: " + flag.getEnabled());
        return saved;
    }

}
