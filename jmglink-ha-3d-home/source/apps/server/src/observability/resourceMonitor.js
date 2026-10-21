const DEFAULT_INTERVAL_MINUTES = 5;
const MAX_INTERVAL_MINUTES = 60;

export function normalizeResourceLogIntervalMinutes(
    value,
    fallback = DEFAULT_INTERVAL_MINUTES,
) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return fallback;
    return Math.min(MAX_INTERVAL_MINUTES, Math.max(0, parsed));
}

function toMiB(value) {
    return Math.round((value / 1024 / 1024) * 10) / 10;
}

export function createResourceMonitor({ logger, intervalMinutes, collect = () => ({}) }) {
    const normalizedInterval = normalizeResourceLogIntervalMinutes(intervalMinutes);
    let previousCpu = process.cpuUsage();
    let previousSampleAt = process.hrtime.bigint();
    let timer;

    const sample = () => {
        const sampledAt = process.hrtime.bigint();
        const elapsedMs = Number(sampledAt - previousSampleAt) / 1_000_000;
        const cpu = process.cpuUsage(previousCpu);
        previousCpu = process.cpuUsage();
        previousSampleAt = sampledAt;
        const memory = process.memoryUsage();
        const cpuPercent = elapsedMs > 0
            ? Math.round((((cpu.user + cpu.system) / 1000 / elapsedMs) * 100) * 10) / 10
            : 0;
        const snapshot = {
            rssMiB: toMiB(memory.rss),
            heapUsedMiB: toMiB(memory.heapUsed),
            heapTotalMiB: toMiB(memory.heapTotal),
            externalMiB: toMiB(memory.external),
            arrayBuffersMiB: toMiB(memory.arrayBuffers ?? 0),
            cpuPercent,
            uptimeSeconds: Math.round(process.uptime()),
            ...collect(),
        };
        logger.info({ resources: snapshot }, "Runtime resource usage");
        return snapshot;
    };

    if (normalizedInterval > 0) {
        timer = setInterval(sample, normalizedInterval * 60_000);
        timer.unref?.();
    }

    return {
        enabled: normalizedInterval > 0,
        intervalMinutes: normalizedInterval,
        sample,
        stop() {
            if (timer)
                clearInterval(timer);
            timer = undefined;
        },
    };
}
