import { useMemo } from 'react';
import { useFlags, useJsonFlags } from '../api/queries';

// ═══════════════════════════════════════════════════════════
//  useAllCoreFlags — Shared hook for merged Core + JSON flags
//
//  Returns:
//    allCoreFlags  — deduplicated array of all core flags
//    coreFlagsMap  — { [flagId]: flagObject } for O(1) lookup
//    isLoading     — true while either query is still loading
//
//  Usage:
//    const { allCoreFlags, coreFlagsMap, isLoading } = useAllCoreFlags(envId);
// ═══════════════════════════════════════════════════════════

const useAllCoreFlags = (envId) => {
    const { data: basicCoreFlags = [], isLoading: isBasicLoading } = useFlags(envId);
    const { data: jsonCoreFlags = [], isLoading: isJsonLoading } = useJsonFlags(envId);

    // Merge basic + JSON into a single deduplicated list
    const allCoreFlags = useMemo(() => {
        const map = new Map();
        basicCoreFlags.forEach(f => map.set(f.id, f));
        jsonCoreFlags.forEach(f => map.set(f.id, f));
        return Array.from(map.values());
    }, [basicCoreFlags, jsonCoreFlags]);

    // O(1) lookup map: flagId → flag object
    const coreFlagsMap = useMemo(() => {
        const map = {};
        allCoreFlags.forEach(f => { map[f.id] = f; });
        return map;
    }, [allCoreFlags]);

    return {
        allCoreFlags,
        coreFlagsMap,
        isLoading: isBasicLoading || isJsonLoading,
    };
};

export default useAllCoreFlags;
