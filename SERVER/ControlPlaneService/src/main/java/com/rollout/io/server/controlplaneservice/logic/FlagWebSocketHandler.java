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

import static com.rollout.io.server.controlplaneservice.logic.DependentFlagServiceLogic.getEnumDefaultValue;

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

    /**
     * Triggered upon a successful connection upgrade by the client.
     * Caches the session object and triggers the initial synchronization payload.
     *
     * @param session the verified WebSocket session establishing the persistent connection
     */
    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        log.debug("Session {} authenticated. Registering for updates.", session.getId());
        sessions.add(session);
        sendInitialSnapshot(session);
    }

    /**
     * Synchronously cleans up session maps once the connection is properly terminated by the client or server.
     *
     * @param session the WebSocket session closing its channel
     * @param status standard CloseStatus encapsulating closure reasons
     */
    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        log.debug("Session {} closed. Cleaning up registry.", session.getId());
        sessions.remove(session);
    }

    /**
     * Intercepts underlying transmission failures executing an aggressive cleanup protocol 
     * purging the failing socket from the broadcast collection list.
     *
     * @param session the active WebSocket session encountering faults
     * @param exception root exception thrown by the transport layer
     */
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

        Object evaluatedValue = evaluateSingle(flag, coreFlagsMap);
        broadcastToEnvironment(envId, "UPDATE", flag.getKey(), evaluatedValue);

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
     * Broadcasts a minimalist payload uniquely across matching scoped sessions isolating environments cleanly.
     *
     * @param envId literal namespace bounding the targeted group
     * @param type standard update event signature labeling message shape
     * @param key distinct string referencing the exact application feature flag
     * @param value evaluated explicit property associated tightly to the mapped flag key
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
     * Performs direct protocol frame generation and transmission injecting raw JSON strings sequentially.
     *
     * @param session the unique individual client recipient
     * @param eventType the generalized categorizer label evaluating data structure
     * @param flagKey human visible string key attached to mapping values
     * @param data generalized primitive or structured literal assigned into the object stream
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

    /**
     * Mass evaluates an array structure representing a snapshot resolving explicit static dependencies linearly.
     *
     * @param flags all configurations present inside the snapshot sequence
     * @return map isolating keys stringing exactly over finalized Boolean representations
     */
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

    /**
     * Computes the final resolved Boolean output based strongly upon static Core state assumptions recursively.
     *
     * @param flag explicitly requested evaluating component context
     * @param coreFlagsMap memory cache accelerating dependency lookup fetching paths
     * @return purely resolved Object representing exact parameter mapping values
     */
    private Object evaluateSingle(Flag flag, Map<String, Flag> coreFlagsMap) {
        boolean isEnabled = Boolean.TRUE.equals(flag.getEnabled());
        if (!isEnabled) return getDefaultValue(flag.getType());
        if (flag.getCategory() == FlagCategory.CORE || flag.getDependency() == null) return flag.getValue();

        return evaluateRuleNode(flag.getDependency(), coreFlagsMap) ? flag.getValue() : getDefaultValue(flag.getType());
    }

    /**
     * Traverses the rule node branch executing explicit boolean OR / AND evaluations synchronously validating nodes.
     *
     * @param node active executing condition node rule segment
     * @param coreFlagsMap memory cached block referencing true Core Flag constants
     * @return truth value mapping condition success requirements
     */
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

    /**
     * Validates type constraints across primitive numeric literal overlaps correctly ignoring long versus double bugs.
     *
     * @param type explicit string configuration of primitive constraints
     * @param actual active real time parameter block resolving natively
     * @param expected strict target representing expected condition mappings
     * @return valid boolean mapping
     */
    private boolean compareValues(FlagType type, Object actual, Object expected) {
        if (actual == null || expected == null) return false;
        return switch (type) {
            case BOOLEAN, STRING, JSON -> Objects.equals(actual, expected);
            case INTEGER -> (actual instanceof Number a && expected instanceof Number e) && (a.longValue() == e.longValue());
            case DOUBLE -> (actual instanceof Number a && expected instanceof Number e) && (Double.compare(a.doubleValue(), e.doubleValue()) == 0);
        };
    }

    /**
     * Converts a raw flag identifier into its zeroed equivalent.
     *
     * @param type literal flag class boundary
     * @return explicitly matched java type defaulting mapping correctly
     */
    private Object getDefaultValue(FlagType type) {
        return getEnumDefaultValue(type);
    }

    /**
     * Identifies if a child path contains reference dependencies tracing directly onto a unique parent document.
     *
     * @param node executing sequence condition evaluating actively
     * @param targetId identifying string targeting the root condition logic target parent
     * @return valid assertion truth testing connectivity overlap
     */
    private boolean usesCoreFlag(RuleNode node, String targetId) {
        if (node == null) return false;
        if (node.getCondition() != null) return targetId.equals(node.getCondition().getFlagId());
        if (node.getChildren() != null) {
            return node.getChildren().stream().anyMatch(c -> usesCoreFlag(c, targetId));
        }
        return false;
    }

}
