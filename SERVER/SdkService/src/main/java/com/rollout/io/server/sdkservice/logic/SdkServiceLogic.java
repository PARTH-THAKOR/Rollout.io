package com.rollout.io.server.sdkservice.logic;

import com.rollout.io.server.sdkservice.entity.Environment;
import com.rollout.io.server.sdkservice.entity.Flag;
import com.rollout.io.server.sdkservice.objects.SdkProxyResponse;
import com.rollout.io.server.sdkservice.repository.EnvironmentRepository;
import com.rollout.io.server.sdkservice.repository.FlagRepository;
import com.rollout.io.server.sdkservice.service.SdkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.rollout.io.server.sdkservice.entity.RuleNode;
import com.rollout.io.server.sdkservice.entity.DependencyCondition;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.rollout.io.server.sdkservice.exceptions.RolloutError;
import com.rollout.io.server.sdkservice.objects.SdkConfig;
import com.rollout.io.server.sdkservice.entity.TargetingRule;

/**
 * Concrete implementation of SdkService.
 * Contains extremely fast high-performance evaluation logic for resolving complex feature flags.
 * Includes Targeting Rule computations, deterministic percentage rollouts, and cascading graph evaluations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SdkServiceLogic implements SdkService {

    private final EnvironmentRepository environmentRepository;
    private final FlagRepository flagRepository;
    private final org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Override
    public SdkProxyResponse getFlagsForSdk(SdkConfig sdkConfig) {
        String sdkKey = sdkConfig.getSdkKey();
        String userId = sdkConfig.getUserId();
        Map<String, Object> attributes = sdkConfig.getAttributes();
        log.info("Fetching flags for SDK Key: {}, UserId: {}, Attributes: {}", sdkKey, userId, attributes);

        // Step 1: Get raw flag definitions (Redis hit or DB miss)
        List<Flag> flags = getCachedFlags(sdkKey);

        // Step 2: Precompute maps for O(1) lookups
        Map<String, Flag> flagById = flags.stream()
                .collect(Collectors.toMap(Flag::getId, f -> f));

        // Step 3: Evaluate flags → targeting → rollout → dependency
        Map<String, Object> flagsMap = flags.stream()
                .filter(Flag::getEnabled)
                .collect(Collectors.toMap(
                        Flag::getKey,
                        flag -> {
                            // 1. Targeting check — user attributes match rules?
                            if (isUserTargeted(attributes, flag.getTargetingRules())) {
                                return false;
                            }

                            // 2. Rollout check — deterministic hash bucket
                            if (!isUserInRollout(userId, flag.getKey(), flag.getRolloutPercentage())) {
                                return false;
                            }

                            // 3. Dependency resolve
                            return resolveFlagValue(flag, flagById, userId, attributes);
                        }
                ));

        return SdkProxyResponse.builder()
                .environmentKey(sdkKey)
                .version(1)
                .flags(flagsMap)
                .build();
    }

    /**
     * Deterministic percentage rollout using MurmurHash3 (industry-grade).
     * Computes a stable 0-99 bucket from userId + flagKey.
     * Same user + same flag = same bucket = consistent experience.
     * MurmurHash3 guarantees uniform distribution, preventing rollout skew
     * that Java's hashCode() can cause at scale.
     */
    private boolean isUserInRollout(String userId, String flagKey, Integer rolloutPercentage) {
        // null rolloutPercentage = 100% rolled out (default behavior)
        if (rolloutPercentage == null) return true;
        // 0% = nobody gets it, 100% = everyone gets it
        if (rolloutPercentage == 0) return false;
        if (rolloutPercentage >= 100) return true;

        // Agar userId nahi diya to rollout check skip, flag milega
        if (userId == null || userId.isBlank()) return true;

        // MurmurHash3 deterministic bucket: uniform distribution across 0-99
        int hash = com.google.common.hash.Hashing.murmur3_32_fixed()
                .hashString(userId + ":" + flagKey, java.nio.charset.StandardCharsets.UTF_8)
                .asInt();
        int bucket = (hash & 0x7FFFFFFF) % 100;
        return bucket < rolloutPercentage;
    }

    /**
     * Redis cache se flags laao, miss hone pe DB se fetch karke cache karo.
     */
    private List<Flag> getCachedFlags(String sdkKey) {
        String redisKey = "sdk:flags:" + sdkKey;

        Object cachedValue = redisTemplate.opsForValue().get(redisKey);
        if (cachedValue != null) {
            log.info("⚡ Redis cache hit for SDK Key: {}", sdkKey);
            if (cachedValue instanceof List<?> rawList) {
                return rawList.stream()
                        .map(item -> objectMapper.convertValue(item, Flag.class))
                        .collect(Collectors.toList());
            }
        }

        log.info("Redis cache miss. Fetching from DB for SDK Key: {}", sdkKey);
        List<Flag> flags = fetchFlagsFromDb(sdkKey);

        // Cache raw flag definitions
        redisTemplate.opsForValue().set(redisKey, flags);
        return flags;
    }

    private List<Flag> fetchFlagsFromDb(String sdkKey) {
        Optional<Environment> environmentOpt = environmentRepository.findBySdkKey(sdkKey);
        if (environmentOpt.isEmpty()) {
            throw new RolloutError("Invalid SDK Key provided.", org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        Environment environment = environmentOpt.get();
        return flagRepository.findByEnvironmentId(environment.getId());
    }

    // Background refresh every 30s — raw flag definitions warm karta hai
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 30000)
    public void backgroundRefresh() {
        log.info("Running background refresh of SDK flags...");
        List<Environment> environments = environmentRepository.findAll();
        for (Environment environment : environments) {
            try {
                String sdkKey = environment.getSdkKey();
                if (sdkKey == null || sdkKey.isBlank()) continue;

                List<Flag> flags = flagRepository.findByEnvironmentId(environment.getId());
                String cacheKey = "sdk:flags:" + sdkKey;
                redisTemplate.opsForValue().set(cacheKey, flags);
                log.debug("Refreshed cache for environment: {}", sdkKey);
            } catch (Exception e) {
                log.error("Failed to refresh flags for environment: {}", environment.getId(), e);
            }
        }
    }

    private Object resolveFlagValue(Flag flag, Map<String, Flag> flagMap, String userId, Map<String, Object> attributes) {
        if (flag.getDependency() == null) {
            return flag.getValue();
        }

        boolean ruleMatched = evaluateRuleNodeRuntime(flag.getDependency(), flagMap, userId, attributes);
        return ruleMatched ? flag.getValue() : false;
    }

    private boolean evaluateRuleNodeRuntime(RuleNode node, Map<String, Flag> flagMap, String userId, Map<String, Object> attributes) {
        if (node == null) return false;
        
        if (node.getOperator() != null) {
            if (node.getOperator() == com.rollout.io.server.sdkservice.entity.LogicalOperator.AND) {
                for (RuleNode child : node.getChildren()) {
                    if (!evaluateRuleNodeRuntime(child, flagMap, userId, attributes)) return false;
                }
                return true;
            } else if (node.getOperator() == com.rollout.io.server.sdkservice.entity.LogicalOperator.OR) {
                for (RuleNode child : node.getChildren()) {
                    if (evaluateRuleNodeRuntime(child, flagMap, userId, attributes)) return true;
                }
                return false;
            }
        } else if (node.getCondition() != null) {
            DependencyCondition condition = node.getCondition();
            Flag dependencyFlag = flagMap.get(condition.getFlagId());

            if (dependencyFlag == null || !dependencyFlag.getEnabled()) {
                return false;
            }

            if (isUserTargeted(attributes, dependencyFlag.getTargetingRules())) {
                return false;
            }

            boolean depInRollout = isUserInRollout(userId, dependencyFlag.getKey(), dependencyFlag.getRolloutPercentage());
            if (!depInRollout) {
                return false;
            }

            if (condition.getExpectedValue() != null) {
                return java.util.Objects.equals(dependencyFlag.getValue(), condition.getExpectedValue());
            }
            return true;
        }
        return false;
    }

    // ======================== TARGETING ENGINE ========================

    /**
     * Targeting engine — ALL rules must match (AND logic).
     * null/empty rules = no targeting = everyone gets it.
     */
    private boolean isUserTargeted(Map<String, Object> attributes, List<TargetingRule> rules) {
        if (rules == null || rules.isEmpty()) return false;
        if (attributes == null || attributes.isEmpty()) return true; // rules exist but no attributes → fail

        return !rules.stream().allMatch(rule -> evaluateRule(rule, attributes));
    }

    /**
     * Evaluate a single targeting rule against user attributes.
     */
    private boolean evaluateRule(TargetingRule rule, Map<String, Object> attributes) {
        Object userValue = attributes.get(rule.getAttribute());
        if (userValue == null) return false; // attribute missing → rule fails

        String userStr = userValue.toString();

        return switch (rule.getOperator()) {
            case EQUALS -> java.util.Objects.equals(userStr, String.valueOf(rule.getValue()));
            case NOT_EQUALS -> !java.util.Objects.equals(userStr, String.valueOf(rule.getValue()));
            case IN -> {
                if (rule.getValues() == null) yield false;
                yield rule.getValues().stream()
                        .anyMatch(v -> java.util.Objects.equals(userStr, String.valueOf(v)));
            }
            case NOT_IN -> {
                if (rule.getValues() == null) yield true;
                yield rule.getValues().stream()
                        .noneMatch(v -> java.util.Objects.equals(userStr, String.valueOf(v)));
            }
            case CONTAINS -> userStr.contains(String.valueOf(rule.getValue()));
            case GT -> toDouble(userStr) > toDouble(String.valueOf(rule.getValue()));
            case GTE -> toDouble(userStr) >= toDouble(String.valueOf(rule.getValue()));
            case LT -> toDouble(userStr) < toDouble(String.valueOf(rule.getValue()));
            case LTE -> toDouble(userStr) <= toDouble(String.valueOf(rule.getValue()));
        };
    }

    private double toDouble(String val) {
        try {
            return Double.parseDouble(val);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
