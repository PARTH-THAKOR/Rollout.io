package com.rollout.io.server.controlplaneservice.service;

import com.rollout.io.server.controlplaneservice.entity.Environment;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service interface outlining the business logic for managing Environments.
 * Defines operations for scoping environments under projects, and managing SDK keys.
 */
@Service
public interface EnvironmentService {

    /**
     * Provisions a unique operational environment belonging rigidly to a mapped Project scope.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the isolated boundary target the environment stems from
     * @param environment the nested properties structuring the environment metadata
     * @return the successfully configured Environment data mapped to database structures
     */
    Environment createEnvironment(Jwt jwt, String projectId, Environment environment);

    /**
     * Resolves all active Environments constrained specifically under a given Project context.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the root node configuration project identifier
     * @return sequence mapping representing all nested environments
     */
    List<Environment> getEnvironmentsByProjectId(Jwt jwt, String projectId);

    /**
     * Intercepts a direct search identifying an exact Environment identity namespace.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the requested environment identifier
     * @return the validated instance of the Environment data object
     */
    Environment getEnvironmentById(Jwt jwt, String environmentId);

    /**
     * Initiates total elimination of a mapped Environment object.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the mapped String UUID of the Environment sequence
     */
    void deleteEnvironment(Jwt jwt, String environmentId);

    /**
     * Forces invalidation of the current Client verification secret securely replacing it.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the constrained active Environment identifier
     * @return the accurately updated document bearing the newly minted SDK secret signature
     */
    Environment rotateSdkKey(Jwt jwt, String environmentId);

    /**
     * Resolves human-readable label replacements inside environments cleanly without losing linkage.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId target resolving root document node identifier
     * @param newName replacement alias for the application state configuration UI
     * @return the seamlessly rewritten configuration Environment logic snapshot
     */
    Environment updateEnvironmentName(Jwt jwt, String environmentId, String newName);

    /**
     * System-to-system retrieval method granting direct fetch by Client identification logic.
     *
     * @param sdkKey the securely parsed authentication bearer token fragment
     * @return the associated exact Environment matched internally
     */
    Environment getEnvironmentBySdkKey(String sdkKey);

}
