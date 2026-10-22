const clamp = value => Math.max(0, Math.min(1, value));
export function resolveDaylight(entities = {}, now = Date.now()) {
  const sun = entities["sun.sun"] ?? Object.values(entities).find(e => e.domain === "sun");
  const elevation = sun?.attributes?.elevation;
  if (typeof elevation === "number" && Number.isFinite(elevation)) {
    // Civil twilight to low daytime sun, using the HA home's location rather than the terminal's clock.
    const progress = clamp((elevation + 6) / 16);
    return { daylight: progress * progress * (3 - 2 * progress), theme: elevation < 0 ? "night" : "day", source: "sun" };
  }
  const rising = Date.parse(sun?.attributes?.next_rising), setting = Date.parse(sun?.attributes?.next_setting);
  if (Number.isFinite(rising) && Number.isFinite(setting) && rising > now && setting > now) {
    const night = rising < setting;
    return { daylight: night ? 0 : 1, theme: night ? "night" : "day", source: "sun" };
  }
  if (["above_horizon", "below_horizon"].includes(sun?.state)) {
    const night = sun.state === "below_horizon";
    return { daylight: night ? 0 : 1, theme: night ? "night" : "day", source: "sun" };
  }
  const hour = new Date(now).getHours();
  const daylight = hour >= 7 && hour < 18 ? 1 : 0;
  return { daylight, theme: daylight ? "day" : "night", source: "clock-fallback" };
}
