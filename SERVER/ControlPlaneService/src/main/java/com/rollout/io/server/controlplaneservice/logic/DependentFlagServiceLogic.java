package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.*;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.helpers.JwtHelper;
import com.rollout.io.server.controlplaneservice.objects.*;
import com.rollout.io.server.controlplaneservice.repository.FlagRepository;
import com.rollout.io.server.controlplaneservice.service.AuditLogService;
import com.rollout.io.server.controlplaneservice.service.DependentFlagService;
import com.rollout.io.server.controlplaneservice.service.EnvironmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
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
    private final AuditLogService auditLogService;

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
        auditLogService.logActivity(environmentId, "CREATE_FLAG", saved.getId(), "FLAG", JwtHelper.getUidFromJwt(jwt), flag.getKey());
        return saved;
    }

    /**
     * Gathers every existing dependency categorized feature flag under the given environment.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId boundary constraint mapping query namespace
     * @return fully mapped collection containing complex tree flags
     */
    @Override
    public List<Flag> getDependentFlags(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);
        return flagRepository.findAllByEnvironmentIdAndCategory(environmentId, FlagCategory.DEPENDENT);
    }

    /**
     * Resolves exactly one dependent flag checking standard authorization ownership traces.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId distinct object identifier sequence
     * @return explicitly fetched instance mapping topological properties
     */
    @Override
    public Flag getDependentFlag(Jwt jwt, String flagId) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new RolloutError("Dependent flag not found", HttpStatus.NOT_FOUND));

        if (flag.getCategory() != FlagCategory.DEPENDENT) {
             throw new RolloutError("This flag is not a dependent flag", HttpStatus.BAD_REQUEST);
        }

        environmentService.getEnvironmentById(jwt, flag.getEnvironmentId());

        return flag;
    }

    /**
     * Applies delta payload configuration modifying constraints or dependency edges for a dependent flag.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId explicitly targeted topological feature element
     * @param updateRequest configuration blueprint containing delta updates
     * @return resulting object precisely stored successfully inside Mongo
     */
    @Override
    public Flag updateDependentFlag(Jwt jwt, String flagId, Flag updateRequest) {
        Flag existingFlag = getDependentFlag(jwt, flagId);

        boolean valueChanged = flagHelperLogic.validateAndApplyUpdate(existingFlag, updateRequest);

        boolean ruleChanged = false;
        if (updateRequest.getDependency() != null && !updateRequest.getDependency().equals(existingFlag.getDependency())) {
            validateRuleNode(existingFlag.getEnvironmentId(), existingFlag.getId(), updateRequest.getDependency());
            existingFlag.setDependency(updateRequest.getDependency());
            ruleChanged = true;
        }
        
        if (valueChanged || ruleChanged) {
            int currentVersion = existingFlag.getVersion() == null ? 1 : existingFlag.getVersion();
            existingFlag.setVersion(currentVersion + 1);
        }

        existingFlag.setUpdatedAt(Instant.now());
        Flag saved = flagRepository.save(existingFlag);
        if (valueChanged || ruleChanged) {
            String changeDesc = valueChanged && ruleChanged ? "Value and Rules modified" : (ruleChanged ? "Rules modified" : "Value modified");
            auditLogService.logActivity(existingFlag.getEnvironmentId(), "UPDATE_FLAG", saved.getId(), "FLAG", JwtHelper.getUidFromJwt(jwt), changeDesc);
        } else {
            auditLogService.logActivity(existingFlag.getEnvironmentId(), "UPDATE_FLAG", saved.getId(), "FLAG", JwtHelper.getUidFromJwt(jwt), "Metadata modified");
        }
        return saved;
    }

    /**
     * Systematically drops a mapped dependent flag configuration.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId unique document mapping identifying deletion target
     */
    @Override
    public void deleteDependentFlag(Jwt jwt, String flagId) {
        Flag flag = getDependentFlag(jwt, flagId);
        flagRepository.delete(flag);
        auditLogService.logActivity(flag.getEnvironmentId(), "DELETE_FLAG", flagId, "FLAG", JwtHelper.getUidFromJwt(jwt), flag.getKey());
    }

    /**
     * Overrides internal boolean constraint flags governing operational viability.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId precise document locator parameter
     * @return structurally preserved flag returned with newly toggled baseline configuration
     */
    @Override
    public Flag toggleDependentFlag(Jwt jwt, String flagId) {
        Flag flag = getDependentFlag(jwt, flagId);
        flagHelperLogic.applyToggle(flag);
        Flag saved = flagRepository.save(flag);
        auditLogService.logActivity(flag.getEnvironmentId(), "TOGGLE_FLAG", flagId, "FLAG", JwtHelper.getUidFromJwt(jwt), "Target state: " + flag.getEnabled());
        return saved;
    }

    /**
     * Constructs the visual node/edge schema mapping all dependencies correctly structured.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId active environment namespace mapping rules
     * @return topological layout structure designed for React Flow format parsing directly
     */
    @Override
    public DependencyGraphResponse getDependentFlagsGraph(Jwt jwt, String environmentId) {
        environmentService.getEnvironmentById(jwt, environmentId);

        List<Flag> allFlags = new ArrayList<>();
        allFlags.addAll(flagRepository.findAllByEnvironmentIdAndCategory(environmentId, FlagCategory.CORE));
        allFlags.addAll(flagRepository.findAllByEnvironmentIdAndCategory(environmentId, FlagCategory.DEPENDENT));

        Map<String, Flag> allFlagsMap = allFlags.stream().collect(Collectors.toMap(Flag::getId, f -> f));
        Set<String> seenEdges = new HashSet<>();

        List<GraphNode> nodes = new ArrayList<>();
        List<GraphEdge> edges = new ArrayList<>();

        for (Flag flag : allFlags) {
            nodes.add(GraphNode.builder()
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

        return DependencyGraphResponse.builder()
                .nodes(nodes)
                .edges(edges)
                .build();
    }

    /**
     * Crawls actively mapped condition branches building deterministic GraphNode bindings visually.
     *
     * @param dependentFlag source generating structural constraints connecting mapping relations
     * @param node active condition node validating rules 
     * @param edges dynamically filling array buffer containing visual paths
     * @param allFlagsMap high-speed lookup cache storing raw flag metadata objects via string ID configurations
     * @param seenEdges memory-safeguard containing string tracking maps preventing recursion bugs
     */
    private void extractEdges(
            Flag dependentFlag,
            RuleNode node,
            List<GraphEdge> edges,
            Map<String, Flag> allFlagsMap,
            Set<String> seenEdges) {

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
                
                edges.add(GraphEdge.builder()
                        .source(coreFlagId)
                        .sourceKey(coreFlag.getKey())
                        .target(dependentFlagId)
                        .targetKey(dependentFlag.getKey())
                        .expectedValue(condition.getExpectedValue())
                        .build());
            }
        }
    }

    /**
     * Executes real-time complex dependency computation parsing runtime rules for an explicit dependent flag.
     *
     * @param sdkKey exact securely generated cryptographic execution identification boundary
     * @param flagKey human visible application reference identifier mapped natively
     * @return single explicitly modeled execution trace confirming boolean resolution paths
     */
    @Override
    public EvaluationResult evaluateDependentFlagBySdkKey(String sdkKey, String flagKey) {
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

    /**
     * Mass processes computations evaluating every mapped topology node against present system states.
     *
     * @param sdkKey operational authentication bearer token fragment isolating environment queries
     * @return combined list representing complete Boolean matrices for active rules
     */
    @Override
    public List<EvaluationResult> evaluateAllDependentFlagsBySdkKey(String sdkKey) {
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
    private EvaluationResult evaluateFlag(Flag dependentFlag, Map<String, Flag> coreFlagsMap) {
        boolean isEnabled = Boolean.TRUE.equals(dependentFlag.getEnabled());
        boolean ruleMatched = false;

        if (isEnabled && dependentFlag.getDependency() != null) {
            ruleMatched = evaluateRuleNodeRuntime(dependentFlag.getDependency(), coreFlagsMap);
        }

        boolean finalResult = isEnabled && ruleMatched;
        Object returnedValue = finalResult ? dependentFlag.getValue() : getDefaultValue(dependentFlag.getType());

        return EvaluationResult.builder()
                .flagKey(dependentFlag.getKey())
                .isEnabled(isEnabled)
                .ruleMatched(ruleMatched)
                .finalResult(finalResult)
                .flagValue(returnedValue)
                .build();
    }

    /**
     * Resolves parameter variables cleanly returning specific zero-state primitive types mapping defaults recursively.
     *
     * @param type categorical binding enforcing primitive type
     * @return matched generic Java primitive instance modeling a zero-sum constraint
     */
    private Object getDefaultValue(FlagType type) {
        return getEnumDefaultValue(type);
    }

    /**
     * Resolves parameter variables cleanly returning specific zero-state primitive types mapping defaults recursively.
     *
     * @param type categorical binding enforcing primitive type
     * @return matched generic Java primitive instance modeling a zero-sum constraint
     */
    public static Object getEnumDefaultValue(FlagType type) {
        if (type == null) return null;
        return switch (type) {
            case BOOLEAN -> false;
            case INTEGER -> 0;
            case DOUBLE -> 0.0;
            case STRING -> "";
            case JSON -> Collections.emptyMap();
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
            case BOOLEAN, STRING, JSON -> Objects.equals(actual, expected);
            case INTEGER -> (actual instanceof Number && expected instanceof Number) && 
                            (((Number) actual).longValue() == ((Number) expected).longValue());
            case DOUBLE -> (actual instanceof Number && expected instanceof Number) && 
                           (Double.compare(((Number) actual).doubleValue(), ((Number) expected).doubleValue()) == 0);
        };
    }

    /**
     * Recursive validation of the rule tree. 
     * Ensures dependent flags reference actual core flags prevent circular dependencies and validates strict types.
     *
     * @param environmentId bounding ID representing the local operational sandbox
     * @param currentFlagId specifically blocked constraint mapping tracking sequence
     * @param node executing sequence mapping algorithm node validating integrity constraints actively
     */
    private void validateRuleNode(String environmentId, String currentFlagId, RuleNode node) {
        if (node == null) {
            throw new RolloutError("Rule node cannot be empty or null", HttpStatus.BAD_REQUEST);
        }

        if (node.getOperator() != null) { 
            if (node.getChildren() == null || node.getChildren().isEmpty()) {
                throw new RolloutError("Logical operator node MUST have children conditions", HttpStatus.BAD_REQUEST);
            }
            if (node.getCondition() != null) {
                throw new RolloutError("Rule node cannot have both an operator and a condition", HttpStatus.BAD_REQUEST);
            }
            for (RuleNode child : node.getChildren()) {
                validateRuleNode(environmentId, currentFlagId, child);
            }
        } else if (node.getCondition() != null) { 
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

    /**
     * Resolves matching structural types matching runtime type mappings with JSON generic class evaluations recursively.
     *
     * @param type explicit enumerator bounding constraints matching standard validation mapping values
     * @param value evaluated explicit block sequence tested successfully
     */
    private void validateExpectedValueStrictType(FlagType type, Object value) {
        boolean valid = switch (type) {
            case BOOLEAN -> value instanceof Boolean;
            case INTEGER -> value instanceof Integer || value instanceof Long;
            case DOUBLE -> value instanceof Double || value instanceof Float;
            case STRING -> value instanceof String;
            case JSON -> value instanceof Map || value instanceof List;
        };
        if (!valid) {
            throw new RolloutError("Dependency expected value strictly does not match target core flag type (" + type + ")", HttpStatus.BAD_REQUEST);
        }
    }

}
