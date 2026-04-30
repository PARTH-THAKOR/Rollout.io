import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { controlPlaneApi, authApi } from './apiClient';
import { ENDPOINTS } from './config';

// ─── Constants ──────────────────────────────────────────────
const ICONS = ['ri-server-line', 'ri-cloud-line', 'ri-window-line', 'ri-code-box-line', 'ri-database-2-line'];
const GLOWS = ['blue-glow', 'purple-glow', 'red-glow', 'green-glow', 'yellow-glow'];

// ─── Helpers ────────────────────────────────────────────────

/**
 * Unwrap the standard { success, data } envelope from the backend.
 * Throws on HTTP errors or when `success` is false.
 */
export const unwrapResponse = async (response) => {
    if (!response.ok) {
        let text = await response.text().catch(() => '');
        // If the response is HTML (e.g., Vite proxy 503), do not dump raw HTML
        if (text.trim().startsWith('<')) {
            text = `Service returned an unexpected HTML response.`;
        }
        throw new Error(`API error ${response.status}: ${text}`);
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'Backend returned non-success');
    }
    return result.data;
};

/**
 * Map a raw backend project object into the shape the UI cards expect.
 */
const mapProject = (project, index) => ({
    id: project.id || String(index + 1),
    name: project.name || '',
    description: project.description || '',
    createdAt: project.createdAt
        ? new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : '',
    icon: ICONS[index % ICONS.length],
    glow: GLOWS[index % GLOWS.length],
    link: `/workspace?id=${project.id || String(index + 1)}&name=${encodeURIComponent(project.name || '')}`,
});

/**
 * Map a raw backend flag into the shape the CoreFlagTab expects.
 *
 * NOTE on field mapping:
 * - `status` is the UI-friendly alias for `enabled` (boolean). Both are provided
 *   for backward compatibility. Components should prefer `enabled`.
 * - `type` is a display string ("Boolean"), `rawType` is the backend enum ("BOOLEAN").
 * - `createdByUid` matches the backend Flag entity field name.
 */
const mapFlag = (flag, index) => ({
    id: flag.id || String(index),
    name: flag.key || flag.displayName || '',
    key: flag.key,
    description: flag.description || '',
    type: ({ BOOLEAN: 'Boolean', STRING: 'String', INTEGER: 'Integer', DOUBLE: 'Double', JSON: 'JSON' })[flag.type] || flag.type || 'Boolean',
    status: flag.enabled !== false,        // UI alias (legacy)
    enabled: flag.enabled !== false,       // Backend-native field
    date: new Date(flag.updatedAt || flag.createdAt || Date.now()).toLocaleString(),
    // Extended fields used by enhanced CoreFlagTab
    displayName: flag.displayName || flag.key || '',
    rawType: flag.type || 'BOOLEAN',
    updatedAt: flag.updatedAt || flag.createdAt || null,
    rolloutPercentage: flag.rolloutPercentage ?? null,
    value: flag.value ?? null,
    targetingRules: flag.targetingRules || [],
    dependency: flag.dependency || null,
    category: flag.category || null,
    version: flag.version ?? null,
    createdAt: flag.createdAt || null,
    createdByUid: flag.createdByUid || null,
});

// ═══════════════════════════════════════════════════════════
//  QUERY KEYS — single source of truth for cache keys
// ═══════════════════════════════════════════════════════════

export const projectKeys = {
    all: ['projects'],
    detail: (id) => ['projects', id],
    search: (query) => ['projects', 'search', query],
};

export const environmentKeys = {
    byProject: (projectId) => ['environments', projectId],
    detail: (envId) => ['environments', 'detail', envId],
};

export const flagKeys = {
    byEnv: (envId) => ['flags', envId],
    detail: (flagId) => ['flags', 'detail', flagId],
    json: (envId) => ['flags', 'json', envId],
};

export const auditKeys = {
    byEnv: (envId) => ['auditLogs', envId],
};

export const dependentFlagKeys = {
    byEnv: (envId) => ['dependentFlags', envId],
};

// ═══════════════════════════════════════════════════════════
//  PROJECT QUERIES
// ═══════════════════════════════════════════════════════════

/**
 * Fetch all projects. Returns UI-mapped project cards.
 */
export const useProjects = () => {
    return useQuery({
        queryKey: projectKeys.all,
        queryFn: async () => {
            const data = await unwrapResponse(await controlPlaneApi(ENDPOINTS.PROJECTS));
            const rawList = Array.isArray(data) ? data : (data.content || [data]);
            return rawList.map(mapProject);
        },
    });
};

/**
 * Fetch a single project by ID. Returns raw backend data (not UI-mapped).
 * Only fires when `id` is truthy.
 */
export const useProjectById = (id) => {
    return useQuery({
        queryKey: projectKeys.detail(id),
        queryFn: async () => {
            return await unwrapResponse(await controlPlaneApi(ENDPOINTS.PROJECT_BY_ID(id)));
        },
        enabled: !!id,
    });
};

/**
 * Search projects via the backend search endpoint.
 * Only fires when `query` is a non-empty string.
 * Returns UI-mapped project cards on success.
 */
export const useSearchProjects = (query) => {
    return useQuery({
        queryKey: projectKeys.search(query),
        queryFn: async () => {
            const data = await unwrapResponse(
                await controlPlaneApi(`${ENDPOINTS.PROJECT_SEARCH}?query=${encodeURIComponent(query)}`)
            );
            return (Array.isArray(data) ? data : []).map(mapProject);
        },
        enabled: !!query?.trim(),
        retry: 0, // Search should fail silently — local filter is the fallback
    });
};

// ═══════════════════════════════════════════════════════════
//  PROJECT MUTATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Create a new project.
 * Accepts { name, description } — both required.
 * Auto-invalidates the project list on success.
 */
export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ name, description }) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.PROJECTS, {
                    method: 'POST',
                    body: JSON.stringify({ name, description }),
                })
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
};

/**
 * Update a project's name and/or description.
 * Backend exposes separate PATCH endpoints for each field,
 * so they are called sequentially (name first, then description).
 *
 * Accepts { id, name, description, originalName, originalDescription }.
 * Auto-invalidates the project list on success.
 */
export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name, description, originalName, originalDescription }) => {
            const nameChanged = name !== originalName;
            const descChanged = description !== originalDescription;

            if (!nameChanged && !descChanged) return null; // Nothing to do

            // Step 1: Update name (if changed)
            if (nameChanged) {
                const nameRes = await controlPlaneApi(
                    `${ENDPOINTS.PROJECT_UPDATE_NAME(id)}?newName=${encodeURIComponent(name)}`,
                    { method: 'PATCH' }
                );
                if (!nameRes.ok) throw new Error('Failed to update project name');
            }

            // Step 2: Update description (if changed) — only after name succeeds
            if (descChanged) {
                const descRes = await controlPlaneApi(
                    `${ENDPOINTS.PROJECT_UPDATE_DESC(id)}?newDescription=${encodeURIComponent(description)}`,
                    { method: 'PATCH' }
                );
                if (!descRes.ok) throw new Error('Failed to update project description');
            }

            return { id, name, description };
        },
        onSuccess: (data) => {
            if (data !== null) {
                queryClient.invalidateQueries({ queryKey: projectKeys.all });
            }
        },
    });
};

/**
 * Delete a project by ID.
 * Uses optimistic removal for instant UI feedback, with automatic
 * rollback on error and a server refetch on settlement.
 */
export const useDeleteProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.PROJECT_BY_ID(id), { method: 'DELETE' })
            );
        },
        // Optimistic update: remove the card immediately
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: projectKeys.all });
            const previous = queryClient.getQueryData(projectKeys.all);
            queryClient.setQueryData(projectKeys.all, (old) =>
                old?.filter((p) => p.id !== id)
            );
            return { previous };
        },
        // Rollback if the server call fails
        onError: (_err, _id, context) => {
            queryClient.setQueryData(projectKeys.all, context.previous);
        },
        // Always refetch to guarantee sync
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
};

// ═══════════════════════════════════════════════════════════
//  ENVIRONMENT QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Fetch all environments for a project.
 * Returns the raw array of environment objects from the backend.
 */
export const useEnvironments = (projectId) => {
    return useQuery({
        queryKey: environmentKeys.byProject(projectId),
        queryFn: async () => {
            const data = await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.ENVIRONMENTS_BY_PROJECT(projectId))
            );
            return Array.isArray(data) ? data : [];
        },
        enabled: !!projectId,
    });
};

/**
 * Create a new environment under a project.
 * Accepts { projectId, name }.
 */
export const useCreateEnvironment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, name }) => {
            const payload = {
                name
            };

            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.ENVIRONMENTS_BY_PROJECT(projectId), {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
            );
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: environmentKeys.byProject(variables.projectId) });
        },
    });
};

// ═══════════════════════════════════════════════════════════
//  FEATURE FLAG QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Fetch basic core flags for a given environment id.
 * Returns UI-mapped flag objects.
 */
export const useFlags = (envId) => {
    return useQuery({
        queryKey: flagKeys.byEnv(envId),
        queryFn: async () => {
            const data = await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.CORE_FLAGS_BASIC(envId))
            );
            return (Array.isArray(data) ? data : []).map(mapFlag);
        },
        enabled: !!envId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

/**
 * Fetch JSON-type core flags for a given environment id.
 */
export const useJsonFlags = (envId) => {
    return useQuery({
        queryKey: flagKeys.json(envId),
        queryFn: async () => {
            const data = await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.CORE_FLAGS_JSON(envId))
            );
            return (Array.isArray(data) ? data : []).map(mapFlag);
        },
        enabled: !!envId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

/**
 * Create a core flag under an environment.
 * Accepts { envId, payload }.
 */
export const useCreateFlag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ envId, payload }) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.CORE_FLAGS(envId), {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
            );
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: flagKeys.byEnv(variables.envId) });
            queryClient.invalidateQueries({ queryKey: flagKeys.json(variables.envId) });
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
        },
    });
};

/**
 * Toggle a core flag's enabled status.
 * Accepts flagId.
 */
export const useToggleFlag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ flagId }) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.CORE_FLAG_TOGGLE(flagId), { method: 'PATCH' })
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
        }
    });
};

/**
 * Update a core flag (displayName, description).
 * Accepts { flagId, payload }.
 */
export const useUpdateFlag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ flagId, payload }) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.CORE_FLAG_BY_ID(flagId), {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                })
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
        }
    });
};

/**
 * Delete a core flag.
 * Accepts flagId.
 */
export const useDeleteFlag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ flagId }) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.CORE_FLAG_BY_ID(flagId), { method: 'DELETE' })
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
        }
    });
};

// ═══════════════════════════════════════════════════════════
//  AUDIT LOG QUERIES
// ═══════════════════════════════════════════════════════════

/**
 * Fetch audit logs for a given environment id.
 * Returns mapped log entries.
 */
export const useAuditLogs = (envId) => {
    return useQuery({
        queryKey: auditKeys.byEnv(envId),
        queryFn: async () => {
            const data = await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.AUDIT_LOGS(envId))
            );
            return (Array.isArray(data) ? data : []).map((item, index) => ({
                id: item.id || String(index),
                action: item.action || 'UNKNOWN',
                resource: item.resourceId || '',
                resourceType: item.resourceType || 'FLAG',
                changes: item.changes || null,
                timestamp: item.timestamp || null,
            }));
        },
        enabled: !!envId,
    });
};

// ═══════════════════════════════════════════════════════════
//  DEPENDENT FLAG QUERIES
// ═══════════════════════════════════════════════════════════

/**
 * Fetch dependent flags for a given environment id.
 * Returns full flag objects (same shape as core flags) via mapFlag.
 */
export const useDependentFlags = (envId) => {
    return useQuery({
        queryKey: dependentFlagKeys.byEnv(envId),
        queryFn: async () => {
            const data = await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.DEPENDENT_FLAGS(envId))
            );
            return (Array.isArray(data) ? data : []).map(mapFlag);
        },
        enabled: !!envId,
    });
};

/**
 * Create a dependent flag under an environment.
 * Accepts { envId, payload }.
 */
export const useCreateDependentFlag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ envId, payload }) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.DEPENDENT_FLAGS(envId), {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
            );
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: dependentFlagKeys.byEnv(variables.envId) });
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
        },
    });
};

/**
 * Toggle a dependent flag's enabled status.
 * Accepts { flagId }.
 */
export const useToggleDependentFlag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ flagId }) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.DEPENDENT_FLAG_TOGGLE(flagId), { method: 'PATCH' })
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
        }
    });
};

/**
 * Delete a dependent flag.
 * Accepts { flagId }.
 */
export const useDeleteDependentFlag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ flagId }) => {
            return await unwrapResponse(
                await controlPlaneApi(ENDPOINTS.DEPENDENT_FLAG_BY_ID(flagId), { method: 'DELETE' })
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
        }
    });
};

// ─── User Profile Queries ───────────────────────────────────

export const authKeys = {
    all: ['auth'],
    currentUser: () => [...authKeys.all, 'currentUser'],
};

/**
 * Fetch the currently authenticated user's profile from AuthService.
 */
export const useCurrentUser = () => {
    return useQuery({
        queryKey: authKeys.currentUser(),
        queryFn: async () => {
            const data = await unwrapResponse(
                await authApi(ENDPOINTS.USER_ME)
            );
            return data;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });
};
