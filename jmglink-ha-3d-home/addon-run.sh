#!/bin/sh
set -eu

runtime_options="$(node /app/addon-runtime-options.mjs /data/options.json)"
set -- $runtime_options

node_max_old_space_mb="$1"
nice_level="$2"
resource_log_interval_minutes="$3"

export HA3D_RESOURCE_LOG_INTERVAL_MINUTES="$resource_log_interval_minutes"

echo "Runtime limits: Node.js old-space=${node_max_old_space_mb} MiB, nice=${nice_level}, resource log interval=${resource_log_interval_minutes} min"

if command -v nice >/dev/null 2>&1; then
  exec nice -n "$nice_level" node --max-old-space-size="$node_max_old_space_mb" /app/addon-entry.js
fi

echo "Warning: nice is unavailable; starting with the default CPU priority"
exec node --max-old-space-size="$node_max_old_space_mb" /app/addon-entry.js
