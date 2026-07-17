import fs from 'node:fs';
import path from 'node:path';

export const SYNC_CONFIG_FILENAME = 'boilerplate-sync.config.json';

export function loadSyncConfig(root) {
  const configPath = path.join(root, SYNC_CONFIG_FILENAME);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!Array.isArray(config.foundationPaths) || !Array.isArray(config.productPaths) ||
      [...config.foundationPaths, ...config.productPaths].some((pattern) => typeof pattern !== 'string' || !pattern)) {
    throw new Error(`${SYNC_CONFIG_FILENAME} is invalid: foundationPaths and productPaths must be arrays of non-empty strings.`);
  }
  return config;
}

function matchSpecificity(file, pattern) {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -2);
    return file.startsWith(prefix) ? prefix.length : -1;
  }
  return file === pattern ? Number.POSITIVE_INFINITY : -1;
}

function bestSpecificity(file, patterns) {
  return patterns.reduce((best, pattern) => Math.max(best, matchSpecificity(file, pattern)), -1);
}

/**
 * Classifies a repo-relative path against the sync config. The most specific
 * matching pattern wins, so an enumerated foundation module such as
 * `apps/app-api/src/modules/auth/**` takes precedence over the broader
 * product glob `apps/app-api/src/modules/**`. Ties resolve to foundation so
 * ambiguous paths always require explicit review.
 */
export function classifyPath(file, config) {
  const foundation = bestSpecificity(file, config.foundationPaths);
  const product = bestSpecificity(file, config.productPaths);
  if (foundation === -1 && product === -1) return 'other';
  return foundation >= product ? 'foundation' : 'product';
}

/**
 * Converts the configured patterns into git pathspecs covering the whole
 * foundation surface (directory prefixes for `/**` globs, exact files as-is).
 */
export function foundationPathspecs(config) {
  return config.foundationPaths.map((pattern) =>
    pattern.endsWith('/**') ? pattern.slice(0, -3) : pattern,
  );
}
