import fs from 'node:fs';
import path from 'node:path';

export const DESIGN_CONFIG_FILENAME = 'design.config.json';
export const DESIGN_SOURCES = ['claude-design', 'spec'];

function checkBrief(brief) {
  if (typeof brief !== 'string' || !brief.trim()) {
    throw new Error(`${DESIGN_CONFIG_FILENAME} brief must be a non-empty repository-relative path.`);
  }
  const trimmed = brief.trim();
  if (path.isAbsolute(trimmed) || trimmed.split(/[\\/]/).includes('..')) {
    throw new Error(`${DESIGN_CONFIG_FILENAME} brief must stay inside the repository.`);
  }
  return trimmed;
}

/**
 * Resolves where a product's UI and behavior originate.
 *
 * - `claude-design`: the committed `design/` export and its release manifest.
 * - `spec`: a written product brief reconciled into `Product Specification.md`,
 *   built on the repository's own design system; no `design/` export exists.
 *
 * An explicit `design.config.json` always wins. Without it, a committed
 * `design/design-release.json` implies `claude-design`, so products that
 * adopted Claude Design before the switch existed keep working unchanged.
 * Otherwise the source is `undecided` and the planner asks the user once.
 */
export function resolveDesignSource(root) {
  const configPath = path.join(root, DESIGN_CONFIG_FILENAME);
  const hasRelease = fs.existsSync(path.join(root, 'design', 'design-release.json'));
  const warnings = [];

  if (fs.existsSync(configPath)) {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      throw new Error(`${DESIGN_CONFIG_FILENAME} is not valid JSON: ${error.message}`);
    }
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error(`${DESIGN_CONFIG_FILENAME} must contain a JSON object.`);
    }
    if (!DESIGN_SOURCES.includes(config.designSource)) {
      throw new Error(
        `${DESIGN_CONFIG_FILENAME} designSource must be one of: ${DESIGN_SOURCES.join(', ')}.`,
      );
    }
    const brief = config.brief === undefined ? null : checkBrief(config.brief);
    if (config.designSource === 'spec' && brief && !fs.existsSync(path.join(root, brief))) {
      warnings.push(`brief ${brief} does not exist yet.`);
    }
    if (config.designSource === 'spec' && hasRelease) {
      warnings.push(
        'design/design-release.json exists but is ignored while designSource is "spec".',
      );
    }
    return { source: config.designSource, origin: 'config', brief, warnings };
  }

  if (hasRelease) {
    return { source: 'claude-design', origin: 'release-manifest', brief: null, warnings };
  }
  return { source: 'undecided', origin: 'none', brief: null, warnings };
}

export function writeDesignSource(root, source, brief) {
  if (!DESIGN_SOURCES.includes(source)) {
    throw new Error(`Design source must be one of: ${DESIGN_SOURCES.join(', ')}.`);
  }
  const config = { designSource: source };
  if (brief !== undefined && brief !== null) config.brief = checkBrief(brief);
  fs.writeFileSync(
    path.join(root, DESIGN_CONFIG_FILENAME),
    JSON.stringify(config, null, 2) + '\n',
  );
  return resolveDesignSource(root);
}
