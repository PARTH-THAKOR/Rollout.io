package com.rollout.io.server.registryserver.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test class for verifying security configurations.
 * Ensures that endpoints are protected and accessible only by authorized roles.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class SecurityConfigTests {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Verifies that the Prometheus endpoint requires authentication.
     * Expects 401 Unauthorized when accessed anonymously.
     */
    @Test
    public void testActuatorPrometheusWithoutAuth() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Verifies that the Prometheus endpoint is accessible with PROMETHEUS role.
     * Expects 404 Not Found (MockMvc doesn't load micrometer bean) or 200 OK.
     * The key is it bypasses 401/403 Security filters.
     */
    @Test
    @WithMockUser(roles = "PROMETHEUS")
    public void testActuatorPrometheusWithPrometheusRole() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(result -> {
                    int statusCode = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(
                        statusCode == 200 || statusCode == 404, 
                        "Expected 200 or 404, but got: " + statusCode
                    );
                });
    }

    /**
     * Verifies that the Prometheus endpoint is forbidden with incorrect role.
     * Expects 403 Forbidden.
     */
    @Test
    @WithMockUser(roles = "USER")
    public void testActuatorPrometheusWithWrongRole() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isForbidden());
    }

    /**
     * Verifies that the Health endpoint requires authentication.
     * Expects 401 Unauthorized when accessed anonymously.
     */
    @Test
    public void testActuatorHealthWithoutAuth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Verifies that the Health endpoint is accessible with ADMIN role.
     * Expects 200 OK.
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    public void testActuatorHealthWithAdminRole() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

}
