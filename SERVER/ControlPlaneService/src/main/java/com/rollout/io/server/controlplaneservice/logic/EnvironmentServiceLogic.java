package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.Environment;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.repository.EnvironmentRepository;
import com.rollout.io.server.controlplaneservice.repository.ProjectRepository;
import com.rollout.io.server.controlplaneservice.service.EnvironmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import com.rollout.io.server.controlplaneservice.helpers.JwtHelper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Concrete implementation of the EnvironmentService interface.
 * Enforces hierarchical association of Environments within Projects and ensures SDK keys are safely generated and validated.
 */
@Service
@RequiredArgsConstructor
public class EnvironmentServiceLogic implements EnvironmentService {

    private final EnvironmentRepository environmentRepository;
    private final ProjectRepository projectRepository;

    /**
     * Provisions a unique operational environment belonging rigidly to a mapped Project scope.
     * Generates the immutable cryptographic SDK verification key to connect services asynchronously.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the isolated boundary target the environment stems from
     * @param environment the nested properties structuring the environment metadata
     * @return the successfully configured Environment data mapped to database structures
     * @throws RolloutError if project conflicts are detected or authentication is lost
     */
    @Override
    public Environment createEnvironment(Jwt jwt, String projectId, Environment environment) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        environment.setProjectId(projectId);

        projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found or access denied", HttpStatus.NOT_FOUND));

        if (environmentRepository.findByProjectIdAndName(projectId, environment.getName()).isPresent()) {
            throw new RolloutError("Environment with this name already exists in the project", HttpStatus.CONFLICT);
        }

        environment.setSdkKey(generateSdkKey());
        environment.setCreatedByUid(uid);
        environment.setCreatedAt(Instant.now());

        return environmentRepository.save(environment);
    }

    /**
     * Resolves all active Environments constrained specifically under a given Project context.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the root node configuration project identifier
     * @return sequence mapping representing all nested environments
     * @throws RolloutError if context mapping permission blocks traversal
     */
    @Override
    public List<Environment> getEnvironmentsByProjectId(Jwt jwt, String projectId) {
        String uid = JwtHelper.getUidFromJwt(jwt);

        projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found or access denied", HttpStatus.NOT_FOUND));

        return environmentRepository.findAllByProjectId(projectId);
    }

    /**
     * Intercepts a direct search identifying an exact Environment identity namespace.
     * Enforces tight referential boundary logic assuring the target actually belongs to the user.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the requested environment identifier
     * @return the validated instance of the Environment data object
     * @throws RolloutError if standard resolution finds an empty response exception
     */
    @Override
    public Environment getEnvironmentById(Jwt jwt, String environmentId) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        Environment environment = environmentRepository.findById(environmentId)
                .orElseThrow(() -> new RolloutError("Environment not found", HttpStatus.NOT_FOUND));

        projectRepository.findByIdAndCreatedByUid(environment.getProjectId(), uid)
                .orElseThrow(() -> new RolloutError("Access denied to this environment", HttpStatus.FORBIDDEN));

        return environment;
    }

    /**
     * Initiates total elimination of a mapped Environment object from underlying Mongo boundaries.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the mapped String UUID of the Environment sequence
     * @throws RolloutError if caller ownership properties reject database mutations
     */
    @Override
    public void deleteEnvironment(Jwt jwt, String environmentId) {
        Environment environment = getEnvironmentById(jwt, environmentId);
        environmentRepository.delete(environment);
    }

    /**
     * Forces invalidation of the current Client verification secret securely replacing it
     * with an entirely randomized pseudo-hashing UUID. Destroys all subsequent cache paths.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the constrained active Environment identifier
     * @return the accurately updated document bearing the newly minted SDK secret signature
     */
    @Override
    public Environment rotateSdkKey(Jwt jwt, String environmentId) {
        Environment environment = getEnvironmentById(jwt, environmentId);
        environment.setSdkKey(generateSdkKey());
        return environmentRepository.save(environment);
    }

    /**
     * Resolves human-readable label replacements inside environments cleanly without losing linkage.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId target resolving root document node identifier
     * @param newName replacement alias for the application state configuration UI
     * @return the seamlessly rewritten configuration Environment logic snapshot
     * @throws RolloutError if namespace overlap collision crashes save transactions
     */
    @Override
    public Environment updateEnvironmentName(Jwt jwt, String environmentId, String newName) {
        Environment environment = getEnvironmentById(jwt, environmentId);

        if (environment.getName().equals(newName)) {
            return environment;
        }

        if (environmentRepository.findByProjectIdAndName(environment.getProjectId(), newName).isPresent()) {
            throw new RolloutError("Environment with this name already exists in the project", HttpStatus.CONFLICT);
        }

        environment.setName(newName);
        return environmentRepository.save(environment);
    }

    /**
     * System-to-system retrieval method granting direct fetch by Client identification logic.
     * Predominately invoked by internal proxy interceptors matching evaluation traces.
     *
     * @param sdkKey the securely parsed authentication bearer token fragment
     * @return the associated exact Environment matched internally
     * @throws RolloutError if evaluation is rejected through string parsing exceptions
     */
    @Override
    public Environment getEnvironmentBySdkKey(String sdkKey) {
        return environmentRepository.findBySdkKey(sdkKey)
                .orElseThrow(() -> new RolloutError("Environment not found for the given SDK Key", HttpStatus.NOT_FOUND));
    }

    /**
     * Computes random deterministic logic sequences generating cryptographic identifier blocks.
     *
     * @return string value uniquely bound to single authentication contexts
     */
    private String generateSdkKey() {
        return "sdk_" + UUID.randomUUID().toString().replace("-", "");
    }

}
