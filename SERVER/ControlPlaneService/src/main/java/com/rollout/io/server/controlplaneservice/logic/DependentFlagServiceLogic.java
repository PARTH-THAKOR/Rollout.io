package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.*;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.repository.FlagRepository;
import com.rollout.io.server.controlplaneservice.service.DependentFlagService;
import com.rollout.io.server.controlplaneservice.service.EnvironmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Concrete implementation of the DependentFlagService interface.
 * Includes advanced data evaluations for cascading rule graphs, preventing cyclic dependency loops.
 */
@Service
@RequiredArgsConstructor
public class DependentFlagServiceLogic implements DependentFlagService {

    private final FlagRepository flagRepository;
    private final EnvironmentService environmentService;
    private final FlagHelperLogic flagHelperLogic;
    private final com.rollout.io.server.controlplaneservice.service.AuditLogService auditLogService;

    /**
     * Creates a new dependent flag with a validated dependency rule tree.
     *
     * @param jwt the authenticated JWT token
     * @param environmentId the target environment scope
     * @param flag the dependent flag entity to create
     * @return the persisted dependent flag
     */
    @Override
    public Flag createDependentFlag(Jwt jwt, String environmentId, Flag flag) {
        flagHelperLogic.validateAndPrepareForCreation(jwt, environmentId, flag);

        if (flag.getDependency() == null) {
            throw new RolloutError("Dependent flags must have a valid dependency rule structure", HttpStatus.BAD_REQUEST);
        }

        flag.setCategory(FlagCategory.DEPENDENT);

        validateRuleNode(environmentId, null, flag.getDependency());

        Flag saved = flagRepository.save(flag);
        auditLogService.logActivity(environmentId, "CREATE_FLAG", saved.getId(), "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), flag.getKey());
        return saved;
    }

    @Override
    public List<Flag> getDependentFlags(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);
        return flagRepository.findAllByEnvironmentIdAndCategory(environmentId, FlagCategory.DEPENDENT);
    }

    @Override
    public Flag getDependentFlag(Jwt jwt, String flagId) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new RolloutError("Dependent flag not found", HttpStatus.NOT_FOUND));

        if (flag.getCategory() != FlagCategory.DEPENDENT) {
             throw new RolloutError("This flag is not a dependent flag", HttpStatus.BAD_REQUEST);
        }

        // Validate access
        environmentService.getEnvironmentById(jwt, flag.getEnvironmentId());

        return flag;
    }

    @Override
    public Flag updateDependentFlag(Jwt jwt, String flagId, Flag updateRequest) {
        Flag existingFlag = getDependentFlag(jwt, flagId); // Handles access check

        boolean valueChanged = flagHelperLogic.validateAndApplyUpdate(existingFlag, updateRequest);

        boolean ruleChanged = false;
        if (updateRequest.getDependency() != null && !updateRequest.getDependency().equals(existingFlag.getDependency())) {
            validateRuleNode(existingFlag.getEnvironmentId(), existingFlag.getId(), updateRequest.getDependency());
            existingFlag.setDependency(updateRequest.getDependency());
            ruleChanged = true;
        }
        
        if (valueChanged || ruleChanged) {
            int currentVersion = existingFlag.getVersion() == null ? 1 : existingFlag.getVersion();
            existingFlag.setVersion(currentVersion + 1); // Increment version on structural/value changes
        }

        existingFlag.setUpdatedAt(Instant.now());
        Flag saved = flagRepository.save(existingFlag);
        if (valueChanged || ruleChanged) {
            String changeDesc = valueChanged && ruleChanged ? "Value and Rules modified" : (ruleChanged ? "Rules modified" : "Value modified");
            auditLogService.logActivity(existingFlag.getEnvironmentId(), "UPDATE_FLAG", saved.getId(), "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), changeDesc);
        } else {
            auditLogService.logActivity(existingFlag.getEnvironmentId(), "UPDATE_FLAG", saved.getId(), "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), "Metadata modified");
        }
        return saved;
    }

    @Override
    public void deleteDependentFlag(Jwt jwt, String flagId) {
        Flag flag = getDependentFlag(jwt, flagId); // Handles access check
        flagRepository.delete(flag);
        auditLogService.logActivity(flag.getEnvironmentId(), "DELETE_FLAG", flagId, "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), flag.getKey());
    }

    @Override
    public Flag toggleDependentFlag(Jwt jwt, String flagId) {
        Flag flag = getDependentFlag(jwt, flagId);
        flagHelperLogic.applyToggle(flag);
        Flag saved = flagRepository.save(flag);
        auditLogService.logActivity(flag.getEnvironmentId(), "TOGGLE_FLAG", flagId, "FLAG", com.rollout.io.server.controlplaneservice.helpers.JwtHelper.getUidFromJwt(jwt), "Target state: " + flag.getEnabled());
        return saved;
    }

    @Override
    public com.rollout.io.server.controlplaneservice.objects.DependencyGraphResponse getDependentFlagsGraph(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);

        List<Flag> allFlags = new java.util.ArrayList<>();
        allFlags.addAll(flagRepository.findAllByEnvironmentIdAndCategory(environmentId, FlagCategory.CORE));
        allFlags.addAll(flagRepository.findAllByEnvironmentIdAndCategory(environmentId, FlagCategory.DEPENDENT));

        Map<String, Flag> allFlagsMap = allFlags.stream().collect(Collectors.toMap(Flag::getId, f -> f));
        java.util.Set<String> seenEdges = new java.util.HashSet<>();

        List<com.rollout.io.server.controlplaneservice.objects.GraphNode> nodes = new java.util.ArrayList<>();
        List<com.rollout.io.server.controlplaneservice.objects.GraphEdge> edges = new java.util.ArrayList<>();

        for (Flag flag : allFlags) {
            nodes.add(com.rollout.io.server.controlplaneservice.objects.GraphNode.builder()
                    .id(flag.getId())
                    .key(flag.getKey())
                    .label(flag.getKey())
                    .category(flag.getCategory())
                    .type(flag.getType() != null ? flag.getType().name() : null)
                    .enabled(flag.getEnabled())
                    .build());

            if (flag.getCategory() == FlagCategory.DEPENDENT && flag.getDependency() != null) {
                extractEdges(flag, flag.getDependency(), edges, allFlagsMap, seenEdges);
            }
        }

        return com.rollout.io.server.controlplaneservice.objects.DependencyGraphResponse.builder()
                .nodes(nodes)
                .edges(edges)
                .build();
    }

    private void extractEdges(
            Flag dependentFlag,
            RuleNode node,
            List<com.rollout.io.server.controlplaneservice.objects.GraphEdge> edges,
            Map<String, Flag> allFlagsMap,
            java.util.Set<String> seenEdges) {

        if (node.getOperator() != null && node.getChildren() != null) {
            for (RuleNode child : node.getChildren()) {
                extractEdges(dependentFlag, child, edges, allFlagsMap, seenEdges);
            }
        } else if (node.getCondition() != null) {
            DependencyCondition condition = node.getCondition();
            String coreFlagId = condition.getFlagId();
            String dependentFlagId = dependentFlag.getId();
            
            String edgeKey = coreFlagId + "->" + dependentFlagId;
            
            if (!seenEdges.contains(edgeKey)) {
                seenEdges.add(edgeKey);
                
                Flag coreFlag = allFlagsMap.get(coreFlagId);
                if (coreFlag == null) return;
                
                edges.add(com.rollout.io.server.controlplaneservice.objects.GraphEdge.builder()
                        .source(coreFlagId)
                        .sourceKey(coreFlag.getKey())
                        .target(dependentFlagId)
                        .targetKey(dependentFlag.getKey())
                        .expectedValue(condition.getExpectedValue())
                        .build());
            }
        }
    }

    @Override
    public com.rollout.io.server.controlplaneservice.objects.EvaluationResult evaluateDependentFlagBySdkKey(String sdkKey, String flagKey) {
        Environment environment = environmentService.getEnvironmentBySdkKey(sdkKey);
        Flag dependentFlag = flagRepository.findByEnvironmentIdAndKey(environment.getId(), flagKey)
                .orElseThrow(() -> new RolloutError("Dependent flag not found", HttpStatus.NOT_FOUND));

        if (dependentFlag.getCategory() != FlagCategory.DEPENDENT) {
            throw new RolloutError("Flag is not a dependent flag", HttpStatus.BAD_REQUEST);
        }

        List<Flag> allCoreFlags = flagRepository.findAllByEnvironmentIdAndCategory(environment.getId(), FlagCategory.CORE);
        Map<String, Flag> coreFlagsMap = allCoreFlags.stream().collect(Collectors.toMap(Flag::getId, f -> f));

        return evaluateFlag(dependentFlag, coreFlagsMap);
    }

    @Override
    public List<com.rollout.io.server.controlplaneservice.objects.EvaluationResult> evaluateAllDependentFlagsBySdkKey(String sdkKey) {
        Environment environment = environmentService.getEnvironmentBySdkKey(sdkKey);
        List<Flag> dependentFlags = flagRepository.findAllByEnvironmentIdAndCategory(environment.getId(), FlagCategory.DEPENDENT);

        List<Flag> allCoreFlags = flagRepository.findAllByEnvironmentIdAndCategory(environment.getId(), FlagCategory.CORE);
        Map<String, Flag> coreFlagsMap = allCoreFlags.stream().collect(Collectors.toMap(Flag::getId, f -> f));

        return dependentFlags.stream().map(f -> evaluateFlag(f, coreFlagsMap)).collect(Collectors.toList());
    }

    /**
     * Evaluates a single dependent flag against its dependency rule tree.
     *
     * @param dependentFlag the flag to evaluate
     * @param coreFlagsMap lookup map of all core flags by ID
     * @return the evaluation result with computed flag value
     */
    private com.rollout.io.server.controlplaneservice.objects.EvaluationResult evaluateFlag(Flag dependentFlag, Map<String, Flag> coreFlagsMap) {
        boolean isEnabled = Boolean.TRUE.equals(dependentFlag.getEnabled());
        boolean ruleMatched = false;

        if (isEnabled && dependentFlag.getDependency() != null) {
            ruleMatched = evaluateRuleNodeRuntime(dependentFlag.getDependency(), coreFlagsMap);
        }

        boolean finalResult = isEnabled && ruleMatched;
        Object returnedValue = finalResult ? dependentFlag.getValue() : getDefaultValue(dependentFlag.getType());

        return com.rollout.io.server.controlplaneservice.objects.EvaluationResult.builder()
                .flagKey(dependentFlag.getKey())
                .isEnabled(isEnabled)
                .ruleMatched(ruleMatched)
                .finalResult(finalResult)
                .flagValue(returnedValue)
                .build();
    }

    private Object getDefaultValue(FlagType type) {
        if (type == null) return null;
        return switch (type) {
            case BOOLEAN -> false;
            case INTEGER -> 0;
            case DOUBLE -> 0.0;
            case STRING -> "";
            case JSON -> java.util.Collections.emptyMap();
        };
    }

    /**
     * Recursively evaluates AND/OR rule nodes or leaf dependency conditions at runtime.
     *
     * @param node the current rule node being evaluated
     * @param coreFlagsMap lookup map of all core flags by ID
     * @return true if the rule node is satisfied
     */
    private boolean evaluateRuleNodeRuntime(RuleNode node, Map<String, Flag> coreFlagsMap) {
        if (node.getOperator() != null) {
            if (node.getOperator() == LogicalOperator.AND) {
                for (RuleNode child : node.getChildren()) {
                    if (!evaluateRuleNodeRuntime(child, coreFlagsMap)) return false;
                }
                return true;
            } else if (node.getOperator() == LogicalOperator.OR) {
                for (RuleNode child : node.getChildren()) {
                    if (evaluateRuleNodeRuntime(child, coreFlagsMap)) return true;
                }
                return false;
            }
        } else if (node.getCondition() != null) {
            DependencyCondition condition = node.getCondition();
            Flag coreFlag = coreFlagsMap.get(condition.getFlagId());

            if (coreFlag == null) return false;

            if (!Boolean.TRUE.equals(coreFlag.getEnabled())) {
                return false;
            }
            
            return compareValues(coreFlag.getType(), coreFlag.getValue(), condition.getExpectedValue());
        }
        return false;
    }

    /**
     * Compares actual and expected values respecting numeric type precision.
     *
     * @param type the flag's declared type
     * @param actual the core flag's current value
     * @param expected the dependency condition's expected value
     * @return true if values match
     */
    private boolean compareValues(FlagType type, Object actual, Object expected) {
        if (actual == null || expected == null) return false;
        
        return switch (type) {
            case BOOLEAN, STRING, JSON -> java.util.Objects.equals(actual, expected);
            case INTEGER -> (actual instanceof Number && expected instanceof Number) && 
                            (((Number) actual).longValue() == ((Number) expected).longValue());
            case DOUBLE -> (actual instanceof Number && expected instanceof Number) && 
                           (Double.compare(((Number) actual).doubleValue(), ((Number) expected).doubleValue()) == 0);
        };
    }

    /**
     * Recursive validation of the rule tree. 
     * Ensures dependent flags reference actual core flags prevent circular dependencies and validates strict types.
     */
    private void validateRuleNode(String environmentId, String currentFlagId, RuleNode node) {
        if (node == null) {
            throw new RolloutError("Rule node cannot be empty or null", HttpStatus.BAD_REQUEST);
        }

        if (node.getOperator() != null) { // Group Node (AND/OR)
            if (node.getChildren() == null || node.getChildren().isEmpty()) {
                throw new RolloutError("Logical operator node MUST have children conditions", HttpStatus.BAD_REQUEST);
            }
            if (node.getCondition() != null) {
                throw new RolloutError("Rule node cannot have both an operator and a condition", HttpStatus.BAD_REQUEST);
            }
            for (RuleNode child : node.getChildren()) {
                validateRuleNode(environmentId, currentFlagId, child);
            }
        } else if (node.getCondition() != null) { // Leaf Node
            DependencyCondition condition = node.getCondition();
            if (condition.getFlagId() == null || condition.getFlagId().isBlank()) {
                throw new RolloutError("Dependency condition must specify a flagId", HttpStatus.BAD_REQUEST);
            }
            
            if (condition.getFlagId().equals(currentFlagId)) {
                throw new RolloutError("A dependent flag cannot depend on itself", HttpStatus.BAD_REQUEST);
            }

            Optional<Flag> coreFlagOpt = flagRepository.findById(condition.getFlagId());
            if (coreFlagOpt.isEmpty() || !coreFlagOpt.get().getEnvironmentId().equals(environmentId)) {
                throw new RolloutError("Dependency target flagId: " + condition.getFlagId() + " does not exist in this environment", HttpStatus.BAD_REQUEST);
            }

            Flag targetFlag = coreFlagOpt.get();
            if (targetFlag.getCategory() == FlagCategory.DEPENDENT) {
                throw new RolloutError("Dependent flags can ONLY depend on CORE flags to prevent circular dependencies (Violating flag: " + targetFlag.getKey() + ")", HttpStatus.BAD_REQUEST);
            }

            if (condition.getExpectedValue() == null) {
                throw new RolloutError("Expected value cannot be null for dependency condition", HttpStatus.BAD_REQUEST);
            }

            validateExpectedValueStrictType(targetFlag.getType(), condition.getExpectedValue());
             
        } else {
            throw new RolloutError("Rule node must have either an operator with children OR a condition", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateExpectedValueStrictType(FlagType type, Object value) {
        boolean valid = switch (type) {
            case BOOLEAN -> value instanceof Boolean;
            case INTEGER -> value instanceof Integer || value instanceof Long;
            case DOUBLE -> value instanceof Double || value instanceof Float;
            case STRING -> value instanceof String;
            case JSON -> value instanceof java.util.Map || value instanceof List;
        };
        if (!valid) {
            throw new RolloutError("Dependency expected value strictly does not match target core flag type (" + type + ")", HttpStatus.BAD_REQUEST);
        }
    }
}
