function boundedInteger(value, fallback, minimum, maximum) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return fallback;
    return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}

export function normalizeAddonRuntimeOptions(options = {}) {
    return {
        nodeMaxOldSpaceMb: boundedInteger(options.node_max_old_space_mb, 256, 128, 512),
        niceLevel: boundedInteger(options.nice_level, 10, 0, 19),
        resourceLogIntervalMinutes: boundedInteger(options.resource_log_interval_minutes, 5, 0, 60),
    };
}
