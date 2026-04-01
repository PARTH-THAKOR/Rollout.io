package com.rollout.io.server.controlplaneservice.logic;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollout.io.server.controlplaneservice.entity.*;
import com.rollout.io.server.controlplaneservice.repository.FlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

/**
 * High-performance WebSocket handler for real-time feature flag updates.
 * Implements an evaluation engine that sends "slim" payloads (keys and values only)
 * to dashboard sessions, respecting user-specific environment scoping.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FlagWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final FlagRepository flagRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        log.debug("Session {} authenticated. Registering for updates.", session.getId());
        sessions.add(session);
        sendInitialSnapshot(session);
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        log.debug("Session {} closed. Cleaning up registry.", session.getId());
        sessions.remove(session);
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) {
        log.warn("Transport error for session {}: {}", session.getId(), exception.getMessage());
        sessions.remove(session);
        try {
            session.close(CloseStatus.SERVER_ERROR);
        } catch (IOException ignored) {}
    }

    /**
     * Sends the current state of all flags in the user's scope as the first message.
     * Only calculates and sends flags for the environmentId associated with the session.
     *
     * @param session the verified WebSocket session
     */
    private void sendInitialSnapshot(WebSocketSession session) {
        try {
            String environmentId = (String) session.getAttributes().get("environmentId");
            if (environmentId == null) return;

            List<Flag> allFlags = flagRepository.findAllByEnvironmentId(environmentId);
            Map<String, Object> evaluatedMap = evaluateAll(allFlags);
            
            broadcastSlimUpdate(session, "INITIAL_SNAPSHOT", null, evaluatedMap);
        } catch (Exception e) {
            log.error("Failed to generate initial snapshot for session: {}", session.getId(), e);
        }
    }

    /**
     * Processes a MongoDB mutation and broadcasts to relevant segmented users.
     * If a CORE flag is updated, it triggers a cascading re-evaluation of all DEPENDENT flags.
     *
     * @param operation the MongoDB operation type (INSERT, UPDATE, DELETE)
     * @param flag the mutated flag document
     */
    public void handleFlagChange(String operation, Flag flag) {
        String envId = flag.getEnvironmentId();
        
        if (operation.equals("DELETE")) {
            broadcastToEnvironment(envId, "DELETE", flag.getKey(), null);
            return;
        }

        List<Flag> envFlags = flagRepository.findAllByEnvironmentId(envId);
        Map<String, Flag> coreFlagsMap = envFlags.stream()
                .filter(f -> f.getCategory() == FlagCategory.CORE)
                .collect(Collectors.toMap(Flag::getId, f -> f));

        // 1. Broadcast the changed flag itself
        Object evaluatedValue = evaluateSingle(flag, coreFlagsMap);
        broadcastToEnvironment(envId, "UPDATE", flag.getKey(), evaluatedValue);

        // 2. Cascading updates: If CORE changed, re-evaluate all affected DEPENDENTS
        if (flag.getCategory() == FlagCategory.CORE) {
            for (Flag other : envFlags) {
                if (other.getCategory() == FlagCategory.DEPENDENT && usesCoreFlag(other.getDependency(), flag.getId())) {
                    Object depValue = evaluateSingle(other, coreFlagsMap);
                    broadcastToEnvironment(envId, "UPDATE", other.getKey(), depValue);
                }
            }
        }
    }

    /**
     * Broadcasts a minimalist payload to all sessions matching the environment scope.
     */
    private void broadcastToEnvironment(String envId, String type, String key, Object value) {
        sessions.forEach(s -> {
            String sessionEnvId = (String) s.getAttributes().get("environmentId");
            if (envId.equals(sessionEnvId) && s.isOpen()) {
                broadcastSlimUpdate(s, type, key, value);
            }
        });
    }

    /**
     * Sends a specifically formatted JSON update to a single session.
     */
    private void broadcastSlimUpdate(WebSocketSession session, String eventType, String flagKey, Object data) {
        Map<String, Object> update = new HashMap<>();
        update.put("eventType", eventType);
        if (flagKey != null) update.put("flagKey", flagKey);
        update.put("data", data);

        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(update)));
        } catch (IOException e) {
            log.error("Failed to transmit update to session {}", session.getId());
        }
    }

    private Map<String, Object> evaluateAll(List<Flag> flags) {
        Map<String, Flag> coreFlagsMap = flags.stream()
                .filter(f -> f.getCategory() == FlagCategory.CORE)
                .collect(Collectors.toMap(Flag::getId, f -> f));

        return flags.stream().collect(Collectors.toMap(
                Flag::getKey,
                f -> evaluateSingle(f, coreFlagsMap),
                (v1, v2) -> v1
        ));
    }

    private Object evaluateSingle(Flag flag, Map<String, Flag> coreFlagsMap) {
        boolean isEnabled = Boolean.TRUE.equals(flag.getEnabled());
        if (!isEnabled) return getDefaultValue(flag.getType());
        if (flag.getCategory() == FlagCategory.CORE || flag.getDependency() == null) return flag.getValue();

        return evaluateRuleNode(flag.getDependency(), coreFlagsMap) ? flag.getValue() : getDefaultValue(flag.getType());
    }

    private boolean evaluateRuleNode(RuleNode node, Map<String, Flag> coreFlagsMap) {
        if (node.getOperator() != null) {
            if (node.getOperator() == LogicalOperator.AND) {
                return node.getChildren().stream().allMatch(c -> evaluateRuleNode(c, coreFlagsMap));
            } else {
                return node.getChildren().stream().anyMatch(c -> evaluateRuleNode(c, coreFlagsMap));
            }
        } else if (node.getCondition() != null) {
            DependencyCondition cond = node.getCondition();
            Flag target = coreFlagsMap.get(cond.getFlagId());
            if (target == null || !Boolean.TRUE.equals(target.getEnabled())) return false;
            return compareValues(target.getType(), target.getValue(), cond.getExpectedValue());
        }
        return false;
    }

    private boolean compareValues(FlagType type, Object actual, Object expected) {
        if (actual == null || expected == null) return false;
        return switch (type) {
            case BOOLEAN, STRING, JSON -> Objects.equals(actual, expected);
            case INTEGER -> (actual instanceof Number a && expected instanceof Number e) && (a.longValue() == e.longValue());
            case DOUBLE -> (actual instanceof Number a && expected instanceof Number e) && (Double.compare(a.doubleValue(), e.doubleValue()) == 0);
        };
    }

    private Object getDefaultValue(FlagType type) {
        if (type == null) return null;
        return switch (type) {
            case BOOLEAN -> false;
            case INTEGER -> 0;
            case DOUBLE -> 0.0;
            case STRING -> "";
            case JSON -> Collections.emptyMap();
        };
    }

    private boolean usesCoreFlag(RuleNode node, String targetId) {
        if (node == null) return false;
        if (node.getCondition() != null) return targetId.equals(node.getCondition().getFlagId());
        if (node.getChildren() != null) {
            return node.getChildren().stream().anyMatch(c -> usesCoreFlag(c, targetId));
        }
        return false;
    }

}
