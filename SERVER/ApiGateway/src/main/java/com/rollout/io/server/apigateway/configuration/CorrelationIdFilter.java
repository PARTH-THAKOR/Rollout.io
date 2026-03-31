package com.rollout.io.server.apigateway.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Global component intercepting all incoming Gateway requests.
 * Assigns a unique Correlation ID to trace logs across microservices.
 */
@Slf4j
@Component
public class CorrelationIdFilter implements GlobalFilter {

    private static final String CORRELATION_ID = "X-Correlation-ID";

    /**
     * Executes the filter logic, tracking trace ID and request durations.
     *
     * @param exchange The server web exchange containing request details
     * @param chain The gateway filter chain to proceed execution
     * @return Mono<Void> indicating the execution is intercepted and handled
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = UUID.randomUUID().toString();

        ServerHttpRequest request = exchange.getRequest()
                .mutate()
                .header(CORRELATION_ID, correlationId)
                .build();

        exchange.getResponse().getHeaders()
                .add(CORRELATION_ID, correlationId);

        long startTime = System.currentTimeMillis();

        return chain.filter(exchange.mutate().request(request).build())
                .then(Mono.fromRunnable(() -> {
                    long duration = System.currentTimeMillis() - startTime;
                    log.info("[{}] Request took: {}ms", correlationId, duration);
                }));
    }

}
