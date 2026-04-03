package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.entity.FlagType;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollout.io.server.controlplaneservice.helpers.JwtHelper;
import com.rollout.io.server.controlplaneservice.repository.FlagRepository;
import com.rollout.io.server.controlplaneservice.service.EnvironmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.rollout.io.server.controlplaneservice.entity.TargetingRule;
import com.rollout.io.server.controlplaneservice.entity.TargetOperator;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Centralized utility/logic class containing robust shared validation algorithms.
 * Handles strict type validations for boolean, JSON, string flags, and parses targeting rules formatting.
 */
@Component
@RequiredArgsConstructor
public class FlagHelperLogic {

    private final ObjectMapper objectMapper;
    private final FlagRepository flagRepository;
    private final EnvironmentService environmentService;

    /**
     * Validates a new flag's structure, checks for key/name uniqueness, enforces type constraints,
     * and sets defaults (version, timestamps, createdByUid) before persistence.
     *
     * @param jwt the authenticated JWT token
     * @param environmentId the target environment scope
     * @param flag the flag entity to validate and enrich
     */
    public void validateAndPrepareForCreation(Jwt jwt, String environmentId, Flag flag) {
        environmentService.getEnvironmentById(jwt, environmentId);

        if (flag == null || flag.getKey() == null || flag.getKey().trim().isEmpty()) {
            throw new RolloutError("Flag key is required", HttpStatus.BAD_REQUEST);
        }

        if (flagRepository.findByEnvironmentIdAndKey(environmentId, flag.getKey()).isPresent()) {
            throw new RolloutError("Flag with this key already exists in the environment", HttpStatus.CONFLICT);
        }

        if (flag.getDisplayName() != null && flagRepository.findByEnvironmentIdAndDisplayName(environmentId, flag.getDisplayName()).isPresent()) {
            throw new RolloutError("Flag with this name already exists in the environment", HttpStatus.CONFLICT);
        }

        validateFlagValue(flag);
        validateRolloutPercentage(flag.getRolloutPercentage());
        validateTargetingRules(flag.getTargetingRules());

        flag.setEnvironmentId(environmentId);
        flag.setVersion(1);
        flag.setCreatedAt(Instant.now());
        flag.setUpdatedAt(Instant.now());
        flag.setCreatedByUid(JwtHelper.getUidFromJwt(jwt));

        if (flag.getEnabled() == null) {
            flag.setEnabled(false);
        }
    }

    /**
     * Validates and merges an incoming update request into the existing flag entity.
     * Ensures immutable fields (key, type) are not changed, and checks for name conflicts.
     *
     * @param existingFlag the currently persisted flag state
     * @param updateRequest the partial update payload from the client
     * @return true if the flag's value was changed (triggers version bump)
     */
    public boolean validateAndApplyUpdate(Flag existingFlag, Flag updateRequest) {
        if (updateRequest.getKey() != null && !updateRequest.getKey().equals(existingFlag.getKey())) {
             throw new RolloutError("Flag key is immutable and cannot be changed", HttpStatus.BAD_REQUEST);
        }

        if (updateRequest.getDisplayName() != null && !updateRequest.getDisplayName().equals(existingFlag.getDisplayName())) {
            if (flagRepository.findByEnvironmentIdAndDisplayName(existingFlag.getEnvironmentId(), updateRequest.getDisplayName()).isPresent()) {
                throw new RolloutError("Flag with this name already exists", HttpStatus.CONFLICT);
            }
            existingFlag.setDisplayName(updateRequest.getDisplayName());
        }

        if (updateRequest.getDescription() != null) {
            existingFlag.setDescription(updateRequest.getDescription());
        }

        if (updateRequest.getRolloutPercentage() != null) {
            validateRolloutPercentage(updateRequest.getRolloutPercentage());
            existingFlag.setRolloutPercentage(updateRequest.getRolloutPercentage());
        }

        if (updateRequest.getTargetingRules() != null) {
            validateTargetingRules(updateRequest.getTargetingRules());
            existingFlag.setTargetingRules(updateRequest.getTargetingRules());
        }

        boolean valueChanged = false;
        
        if (updateRequest.getType() != null && updateRequest.getType() != existingFlag.getType()) {
             throw new RolloutError("Flag type is immutable and cannot be changed", HttpStatus.BAD_REQUEST);
        }

        if (updateRequest.getValue() != null && !Objects.equals(updateRequest.getValue(), existingFlag.getValue())) {
            existingFlag.setValue(updateRequest.getValue());
            valueChanged = true;
        }

        if (updateRequest.getEnabled() != null && !updateRequest.getEnabled().equals(existingFlag.getEnabled())) {
            throw new RolloutError("Flag 'enabled' status cannot be updated via this endpoint. Use the toggle endpoint instead.", HttpStatus.BAD_REQUEST);
        }

        if (valueChanged) {
            validateFlagValue(existingFlag);
        }
        return valueChanged;
    }

    /**
     * Inverts the flag's enabled state and increments the version counter.
     *
     * @param flag the flag entity to toggle
     */
    public void applyToggle(Flag flag) {
        flag.setEnabled(!Boolean.TRUE.equals(flag.getEnabled()));
        int currentVersion = flag.getVersion() == null ? 1 : flag.getVersion();
        flag.setVersion(currentVersion + 1);
        flag.setUpdatedAt(Instant.now());
    }

    /**
     * Validates the flag's value strictly against its declared type (BOOLEAN, INTEGER, DOUBLE, STRING, JSON).
     * Coerces compatible input types and throws on type mismatches.
     *
     * @param flag the flag entity containing type and value to validate
     */
    public void validateFlagValue(Flag flag) {
        FlagType type = flag.getType();
        Object value = flag.getValue();

        if (type == null) {
            throw new RolloutError("Flag type cannot be null", HttpStatus.BAD_REQUEST);
        }

        if (value == null) {
            throw new RolloutError("Flag value cannot be null for Core flags", HttpStatus.BAD_REQUEST);
        }

        try {
            switch (type) {
                case BOOLEAN:
                    if (!(value instanceof Boolean)) {
                        throw new IllegalArgumentException();
                    }
                    break;
                case INTEGER:
                    if (value instanceof Number) {
                        long longVal = ((Number) value).longValue();
                        if (longVal < Integer.MIN_VALUE || longVal > Integer.MAX_VALUE) {
                            throw new IllegalArgumentException("Integer value out of bounds");
                        }
                        flag.setValue((int) longVal);
                    } else if (value instanceof String) {
                        flag.setValue(Integer.parseInt((String) value));
                    } else {
                        throw new IllegalArgumentException();
                    }
                    break;
                case DOUBLE:
                    if (value instanceof Number) {
                        flag.setValue(((Number) value).doubleValue());
                    } else if (value instanceof String) {
                        flag.setValue(Double.parseDouble((String) value));
                    } else {
                        throw new IllegalArgumentException();
                    }
                    break;
                case STRING:
                    if (!(value instanceof String)) {
                        throw new IllegalArgumentException("Value must be a strictly formatted string");
                    }
                    break;
                case JSON:
                    if (value instanceof Map || value instanceof List) {
                        break;
                    } else if (value instanceof String) {
                        try {
                            JsonNode node = objectMapper.readTree((String) value);
                            if (node == null || node.isNull()) {
                                throw new IllegalArgumentException("Top level JSON cannot be null");
                            }
                            flag.setValue(objectMapper.convertValue(node, Object.class));
                        } catch (Exception e) {
                            throw new IllegalArgumentException("String value is not a valid JSON structure");
                        }
                    } else {
                        throw new IllegalArgumentException("JSON flag value must be a valid JSON object or array");
                    }
                    break;
            }
        } catch (Exception e) {
            throw new RolloutError("Invalid value for flag type " + type, HttpStatus.BAD_REQUEST);
        }
        
    }

    /**
     * Validates numerical limits on probability variables preventing negative weights.
     *
     * @param rolloutPercentage explicit targeted probability execution integer
     * @throws RolloutError if percentage escapes logical boundary limits
     */
    private void validateRolloutPercentage(Integer rolloutPercentage) {
        if (rolloutPercentage != null && (rolloutPercentage < 0 || rolloutPercentage > 100)) {
            throw new RolloutError("Rollout percentage must be between 0 and 100", HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Fully validates custom complex array sequence maps containing attribute evaluations.
     *
     * @param rules list segment representing client execution context queries
     * @throws RolloutError if operator values or parameters fail logical compliance checks
     */
    private void validateTargetingRules(List<TargetingRule> rules) {
        if (rules == null || rules.isEmpty()) return;

        for (TargetingRule rule : rules) {
            if (rule.getAttribute() == null || rule.getAttribute().isBlank()) {
                throw new RolloutError("Targeting rule attribute cannot be empty", HttpStatus.BAD_REQUEST);
            }
            if (rule.getOperator() == null) {
                throw new RolloutError("Targeting rule operator is required for attribute: " + rule.getAttribute(), HttpStatus.BAD_REQUEST);
            }
            if ((rule.getOperator() == TargetOperator.IN || rule.getOperator() == TargetOperator.NOT_IN)
                    && (rule.getValues() == null || rule.getValues().isEmpty())) {
                throw new RolloutError("Targeting rule with IN/NOT_IN operator requires 'values' list for attribute: " + rule.getAttribute(), HttpStatus.BAD_REQUEST);
            }
            if (rule.getOperator() != TargetOperator.IN && rule.getOperator() != TargetOperator.NOT_IN
                    && rule.getValue() == null) {
                throw new RolloutError("Targeting rule requires 'value' for attribute: " + rule.getAttribute(), HttpStatus.BAD_REQUEST);
            }
        }
    }

}
