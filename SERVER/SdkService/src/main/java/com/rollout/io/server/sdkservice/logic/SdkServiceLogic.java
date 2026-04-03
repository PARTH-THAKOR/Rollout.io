package com.rollout.io.server.sdkservice.logic;

import com.rollout.io.server.sdkservice.entity.*;
import com.rollout.io.server.sdkservice.exceptions.RolloutError;
import com.rollout.io.server.sdkservice.objects.*;
import com.rollout.io.server.sdkservice.repository.EnvironmentRepository;
import com.rollout.io.server.sdkservice.repository.FlagRepository;
import com.rollout.io.server.sdkservice.service.SdkService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.hash.Hashing;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.RedisTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * High-performance deterministic evaluation logic for feature flags.
 * Operates purely on high-frequency read operations accelerated by Redis caching matrices.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SdkServiceLogic implements SdkService {

    private final EnvironmentRepository environmentRepository;
    private final FlagRepository flagRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Evaluates completely all flags bounded to the provided SDK token based natively on runtime parameters.
     *
     * @param sdkConfig explicit configuration mapping boundary isolating target user payload
     * @return structurally typed proxy response transmitting validated evaluation states
     */
    @Override
    public SdkProxyResponse getFlagsForSdk(SdkConfig sdkConfig) {
        String sdkKey = sdkConfig.getSdkKey();
        List<Flag> flags = getCachedFlags(sdkKey);
        Map<String, Flag> flagById = flags.stream().collect(Collectors.toMap(Flag::getId, f -> f));

        Map<String, Object> flagsMap = flags.stream()
                .filter(Flag::getEnabled)
                .collect(Collectors.toMap(
                        Flag::getKey,
                        flag -> evaluateFlagValue(flag, flagById, sdkConfig.getUserId(), sdkConfig.getAttributes())
                ));

        return SdkProxyResponse.builder()
                .environmentKey(sdkKey)
                .version(1)
                .flags(flagsMap)
                .build();
    }

    /**
     * Executes the comprehensive algorithmic filter chain enforcing dependencies, targeting, and hashing rules.
     *
     * @param flag explicitly requested evaluating component context
     * @param flagById memory cache accelerating dependency lookup fetching paths
     * @param userId unique identifier string isolating execution subset targets
     * @param attributes dynamic JSON string configurations tracking client telemetry
     * @return resolved boolean or numeric mapping for the final state validation
     */
    private Object evaluateFlagValue(Flag flag, Map<String, Flag> flagById, String userId, Map<String, Object> attributes) {
        if (isUserTargeted(attributes, flag.getTargetingRules())) return getDefaultValue(flag.getType());
        if (isExcludedFromRollout(userId, flag.getKey(), flag.getRolloutPercentage())) return getDefaultValue(flag.getType());
        return resolveFlagValue(flag, flagById, userId, attributes);
    }

    /**
     * Safely transcribes execution metrics cleanly onto high-performance memory blocks preventing UI bottlenecks.
     *
     * @param report primitive matrix reporting evaluation choices and frequencies
     */
    @Override
    public void recordUnifiedReport(SdkReport report) {
        String sdkKey = report.getSdkKey();
        List<Flag> validFlags = getCachedFlags(sdkKey);
        boolean isValidFlag = validFlags.stream().anyMatch(f -> f.getKey().equals(report.getFlagKey()));
        
        if (!isValidFlag) {
            throw new RolloutError("Error: Flag key '" + report.getFlagKey() + "' doesn't exist.", HttpStatus.BAD_REQUEST);
        }

        String usageKey = "sdk:usage:" + sdkKey + ":" + LocalDate.now();
        String field = report.getFlagKey() + ":" + report.getVariationValue();
        redisTemplate.opsForHash().increment(usageKey, field, 1);
    }

    /**
     * Resolves accumulated metrics specifically mapping runtime performance directly from RAM arrays.
     *
     * @param sdkKey exact natively configured application container security hash
     * @return mapped nested properties analyzing hit metrics and variations
     */
    @Override
    public Map<String, Object> getEnvironmentStats(String sdkKey) {
        String usageKey = "sdk:usage:" + sdkKey + ":" + LocalDate.now();
        return Map.of(
            "sdkKey", sdkKey,
            "usage", redisTemplate.opsForHash().entries(usageKey)
        );
    }

    /**
     * Determines robustly whether user identity seeds escape fractional execution distribution targets.
     *
     * @param userId explicit client validation boundary
     * @param flagKey distinct string referencing the targeted flag property
     * @param percentage expected execution bounds evaluating fractional matching limits
     * @return true exclusively if hash modulus safely isolates boundary targeting
     */
    private boolean isExcludedFromRollout(String userId, String flagKey, Integer percentage) {
        if (percentage == null || percentage >= 100) return false; 
        if (userId == null) return true; 
        
        int hash = Hashing.murmur3_32_fixed()
                .hashString(userId + ":" + flagKey, StandardCharsets.UTF_8)
                .asInt();
        
        return ((hash & 0x7FFFFFFF) % 100) >= percentage;
    }

    /**
     * Injects Redis query caching reducing database latency boundaries successfully querying array payloads.
     *
     * @param sdkKey standard operational bounds isolating query structures
     * @return complete flag structures successfully generated matching parameters
     */
    private List<Flag> getCachedFlags(String sdkKey) {
        String key = "sdk:flags:" + sdkKey;
        Object cached = redisTemplate.opsForValue().get(key);
        if (cached instanceof List<?> raw) return raw.stream().map(i -> objectMapper.convertValue(i, Flag.class)).collect(Collectors.toList());
        List<Flag> flags = fetchFlagsFromDb(sdkKey);
        redisTemplate.opsForValue().set(key, flags);
        return flags;
    }

    /**
     * Safely executes read parameters natively mapping Mongo sequences explicitly bypassing cache checks.
     *
     * @param sdkKey boundary token evaluating parameters manually
     * @return un-mutated exact list mappings retrieved
     */
    private List<Flag> fetchFlagsFromDb(String sdkKey) {
        Environment env = environmentRepository.findBySdkKey(sdkKey).orElseThrow(() -> new RolloutError("Bad Key", HttpStatus.BAD_REQUEST));
        return flagRepository.findByEnvironmentId(env.getId());
    }

    /**
     * Triggers periodic synchronization cycles enforcing eventual consistency mappings without blocking application threads.
     */
    @Scheduled(fixedDelay = 30000)
    public void refresh() {
        environmentRepository.findAll().forEach(e -> {
            String k = e.getSdkKey();
            if (k != null) redisTemplate.opsForValue().set("sdk:flags:" + k, flagRepository.findByEnvironmentId(e.getId()));
        });
    }

    /**
     * Analyzes tree graph mappings actively isolating dependencies successfully.
     *
     * @param f mapped logic component
     * @param m memory cached target dependencies
     * @param u identifying literal token constraint parameter
     * @param a targeted mapping attributes bounds
     * @return extracted correctly sequenced explicit java value
     */
    private Object resolveFlagValue(Flag f, Map<String, Flag> m, String u, Map<String, Object> a) {
        if (f.getDependency() == null) return f.getValue();
        return evaluateRuleNode(f.getDependency(), m, u, a) ? f.getValue() : getDefaultValue(f.getType());
    }

    /**
     * Synchronously resolves complex conditional branches mapped iteratively validating constraints securely.
     *
     * @param n dependency mapped node sequence tracing rules
     * @param m map binding explicitly requested parent topologies
     * @param u uniquely identifying isolated target token
     * @param a attribute query blocks matching context limits
     * @return truth value mapping logical parameters successfully
     */
    private boolean evaluateRuleNode(RuleNode n, Map<String, Flag> m, String u, Map<String, Object> a) {
        if (n == null) return false;
        if (n.getOperator() != null) {
            if (n.getOperator() == LogicalOperator.AND) return n.getChildren().stream().allMatch(c -> evaluateRuleNode(c, m, u, a));
            if (n.getOperator() == LogicalOperator.OR) return n.getChildren().stream().anyMatch(c -> evaluateRuleNode(c, m, u, a));
        } else if (n.getCondition() != null) {
            Flag d = m.get(n.getCondition().getFlagId());
            if (d == null || !d.getEnabled()) return false;
            if (isUserTargeted(a, d.getTargetingRules())) return false;
            if (isExcludedFromRollout(u, d.getKey(), d.getRolloutPercentage())) return false;
            
            return Objects.equals(d.getValue(), n.getCondition().getExpectedValue());
        }
        return false;
    }

    /**
     * Ensures strict default type casting preventing invalid parameters generating errors unexpectedly.
     *
     * @param t isolated categorical mapping representing target primitives
     * @return mapped sequence value configured safely
     */
    private Object getDefaultValue(FlagType t) {
        if (t == null) return null;
        return switch (t) {
            case BOOLEAN -> false;
            case INTEGER -> 0;
            case DOUBLE -> 0.0;
            case STRING -> "";
            case JSON -> Collections.emptyMap();
        };
    }

    /**
     * Comprehensively evaluates complex custom rule constraints resolving target limits properly matching array maps natively.
     *
     * @param attrs mapping token explicitly representing runtime query structures
     * @param rules topological parameter enforcing client context paths
     * @return inverted subset matched condition bounds directly identifying exclusionary paths
     */
    private boolean isUserTargeted(Map<String, Object> attrs, List<TargetingRule> rules) {
        if (rules == null || rules.isEmpty()) return false;
        if (attrs == null) return true;
        return !rules.stream().allMatch(r -> {
            Object v = attrs.get(r.getAttribute());
            if (v == null) return false;
            String s = v.toString();
            String rv = String.valueOf(r.getValue());
            return switch (r.getOperator()) {
                case EQUALS -> Objects.equals(s, rv);
                case NOT_EQUALS -> !Objects.equals(s, rv);
                case CONTAINS -> s.contains(rv);
                case GT -> toD(s) > toD(rv);
                case GTE -> toD(s) >= toD(rv);
                case LT -> toD(s) < toD(rv);
                case LTE -> toD(s) <= toD(rv);
                default -> false;
            };
        });
    }

    /**
     * Dynamically casts string numerical constants mapping valid decimal double evaluation tracks accurately.
     *
     * @param v extracted string mapped numeral property explicitly
     * @return double matrix extracted value correctly
     */
    private double toD(String v) { try { return Double.parseDouble(v); } catch (Exception e) { return 0; } }

}
