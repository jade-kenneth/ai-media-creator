#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';

const PLACEHOLDERS = {
  rootPackage: '@app/boilerplate',
  mobileName: 'App Boilerplate',
  mobileSlug: 'app-mobile',
  mobileDescription:
    'Project-agnostic multi-tenant Expo starter with authentication, profiles, notifications, theming, and i18n.',
  mobileScheme: 'appboilerplate',
  mobileId: 'com.example.appmobile',
  rootDatabase: 'mongodb://127.0.0.1:27017/app-db',
  apiDatabase: 'mongodb://127.0.0.1:27017/app-api',
  senderNameRoot: 'App Boilerplate',
  senderNameApi: 'Application',
  webName: 'Application',
  readmeTitle: '# Full-Stack Application Boilerplate',
  readmeIntro:
    'Project-agnostic Nx monorepo for a multi-tenant product with a web admin,\nExpo mobile app, and NestJS GraphQL API.',
};

const HELP = `Initialize a product created from app-boilerplate.

Usage:
  npm run project:init
  npm run project:init -- --name "Dala" --namespace com.jadey --domain dala.app

Options:
  --name <display name>          Required product display name
  --slug <slug>                  Default: derived from the display name
  --scope <npm scope>            Default: @<slug>
  --namespace <reverse domain>   Required mobile namespace, e.g. com.jadey
  --domain <domain>              Optional owned domain for example emails
  --database <name>              Default: <slug>-db
  --dry-run                      Show changes without writing files
  --force                        Replace values already customized by the product
  --non-interactive              Fail instead of prompting for missing inputs
  --help                         Show this help
`;

function parseArgs(argv) {
  const options = {};
  const valueFlags = new Set([
    '--name',
    '--slug',
    '--scope',
    '--namespace',
    '--domain',
    '--database',
    '--root',
  ]);
  const booleanFlags = new Set(['--dry-run', '--force', '--non-interactive', '--help']);

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (booleanFlags.has(flag)) {
      options[flag.slice(2).replaceAll('-', '_')] = true;
      continue;
    }
    if (!valueFlags.has(flag)) throw new Error(`Unknown option: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
    options[flag.slice(2)] = value;
    index += 1;
  }
  return options;
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function validateIdentity(identity) {
  const errors = [];
  if (!identity.name || identity.name.length > 80) {
    errors.push('name must contain 1-80 characters.');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identity.slug)) {
    errors.push('slug must use lowercase letters, numbers, and single hyphens.');
  }
  if (!/^@[a-z0-9][a-z0-9._-]*$/.test(identity.scope)) {
    errors.push('scope must be an npm scope such as @dala.');
  }
  const namespaceParts = identity.namespace.split('.');
  if (
    namespaceParts.length < 2 ||
    namespaceParts.some((part) => !/^[a-z][a-z0-9_]*$/.test(part))
  ) {
    errors.push('namespace must be a lowercase reverse domain such as com.jadey.');
  }
  if (identity.domain && !/^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(identity.domain)) {
    errors.push('domain must be a hostname such as dala.app, without a protocol or path.');
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(identity.database)) {
    errors.push('database must use lowercase letters, numbers, hyphens, or underscores.');
  }
  if (errors.length) throw new Error(`Invalid project identity:\n- ${errors.join('\n- ')}`);
}

async function collectIdentity(options) {
  const interactive = process.stdin.isTTY && process.stdout.isTTY && !options.non_interactive;
  const rl = interactive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

  try {
    const name = (options.name ?? (rl ? await rl.question('Project display name: ') : '')).trim();
    if (!name) throw new Error('Project name is required. Pass --name or run interactively.');

    const defaultSlug = slugify(name);
    const slugInput = options.slug ?? (rl ? await rl.question(`Project slug (${defaultSlug}): `) : '');
    const slug = (slugInput.trim() || defaultSlug).toLowerCase();

    const defaultScope = `@${slug}`;
    const scopeInput = options.scope ?? (rl ? await rl.question(`Package scope (${defaultScope}): `) : '');
    const scope = (scopeInput.trim() || defaultScope).toLowerCase();

    const namespace = (
      options.namespace ??
      (rl ? await rl.question('Mobile namespace (required, e.g. com.jadey): ') : '')
    )
      .trim()
      .toLowerCase();
    if (!namespace) {
      throw new Error('Mobile namespace is required. Pass --namespace or run interactively.');
    }

    const domain = (
      options.domain ??
      (rl ? await rl.question('Owned email/web domain (optional, press Enter to skip): ') : '')
    )
      .trim()
      .toLowerCase();

    const defaultDatabase = `${slug}-db`;
    const databaseInput =
      options.database ?? (rl ? await rl.question(`Local database name (${defaultDatabase}): `) : '');
    const database = (databaseInput.trim() || defaultDatabase).toLowerCase();

    const idSegment = slug.replaceAll('-', '');
    const identity = {
      name,
      slug,
      scope,
      namespace,
      domain,
      database,
      rootPackage: `${scope}/workspace`,
      mobileId: `${namespace}.${idSegment}`,
      mobileScheme: slug,
    };
    validateIdentity(identity);
    return identity;
  } finally {
    rl?.close();
  }
}

function readText(root, relativePath, required = true) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    if (required) throw new Error(`Required file is missing: ${relativePath}`);
    return null;
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function parseJson(text, relativePath) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${relativePath} is not valid JSON: ${error.message}`);
  }
}

function assertReplaceable(relativePath, label, current, placeholder, target, force) {
  if (current === placeholder || current === target || force) return;
  throw new Error(
    `${relativePath}: ${label} is already customized as ${JSON.stringify(current)}. ` +
      'Rerun with --force only if replacing it is intentional.',
  );
}

function setJsonValue(relativePath, label, object, key, placeholder, target, force) {
  assertReplaceable(relativePath, label, object[key], placeholder, target, force);
  object[key] = target;
}

function replaceEnvValue(text, relativePath, key, placeholder, target, force) {
  const expression = new RegExp(`^${key}=([^\\r\\n]*)$`, 'm');
  const match = text.match(expression);
  if (!match) throw new Error(`${relativePath}: missing ${key}.`);
  assertReplaceable(relativePath, key, match[1], placeholder, target, force);
  return text.replace(expression, `${key}=${target}`);
}

function planChanges(root, identity, force) {
  const planned = new Map();

  const packagePath = 'package.json';
  const packageJson = parseJson(readText(root, packagePath), packagePath);
  setJsonValue(
    packagePath,
    'name',
    packageJson,
    'name',
    PLACEHOLDERS.rootPackage,
    identity.rootPackage,
    force,
  );
  planned.set(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const lockPath = 'package-lock.json';
  const lockText = readText(root, lockPath, false);
  if (lockText !== null) {
    const lock = parseJson(lockText, lockPath);
    setJsonValue(lockPath, 'name', lock, 'name', PLACEHOLDERS.rootPackage, identity.rootPackage, force);
    if (lock.packages?.['']) {
      setJsonValue(
        lockPath,
        'packages[""].name',
        lock.packages[''],
        'name',
        PLACEHOLDERS.rootPackage,
        identity.rootPackage,
        force,
      );
    }
    planned.set(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  }

  const mobilePath = 'apps/app-mobile/app.json';
  const mobileJson = parseJson(readText(root, mobilePath), mobilePath);
  const expo = mobileJson.expo;
  if (!expo?.ios || !expo?.android) throw new Error(`${mobilePath}: expected Expo iOS and Android config.`);
  setJsonValue(mobilePath, 'expo.name', expo, 'name', PLACEHOLDERS.mobileName, identity.name, force);
  setJsonValue(mobilePath, 'expo.slug', expo, 'slug', PLACEHOLDERS.mobileSlug, identity.slug, force);
  setJsonValue(
    mobilePath,
    'expo.description',
    expo,
    'description',
    PLACEHOLDERS.mobileDescription,
    `${identity.name} mobile application.`,
    force,
  );
  setJsonValue(
    mobilePath,
    'expo.scheme',
    expo,
    'scheme',
    PLACEHOLDERS.mobileScheme,
    identity.mobileScheme,
    force,
  );
  setJsonValue(
    mobilePath,
    'expo.ios.bundleIdentifier',
    expo.ios,
    'bundleIdentifier',
    PLACEHOLDERS.mobileId,
    identity.mobileId,
    force,
  );
  setJsonValue(
    mobilePath,
    'expo.android.package',
    expo.android,
    'package',
    PLACEHOLDERS.mobileId,
    identity.mobileId,
    force,
  );
  planned.set(mobilePath, `${JSON.stringify(mobileJson, null, 2)}\n`);

  const rootEnvPath = '.env.example';
  let rootEnv = readText(root, rootEnvPath);
  rootEnv = replaceEnvValue(
    rootEnv,
    rootEnvPath,
    'MONGODB_URI',
    PLACEHOLDERS.rootDatabase,
    `mongodb://127.0.0.1:27017/${identity.database}`,
    force,
  );
  rootEnv = replaceEnvValue(
    rootEnv,
    rootEnvPath,
    'BREVO_SENDER_NAME',
    PLACEHOLDERS.senderNameRoot,
    identity.name,
    force,
  );
  if (identity.domain) {
    for (const [key, localPart, placeholder] of [
      ['DEFAULT_ADMIN_EMAIL', 'admin', 'admin@example.com'],
      ['DEFAULT_SUPER_ADMIN_EMAIL', 'superadmin', 'superadmin@example.com'],
      ['BREVO_SENDER_EMAIL', 'no-reply', 'no-reply@example.com'],
    ]) {
      rootEnv = replaceEnvValue(
        rootEnv,
        rootEnvPath,
        key,
        placeholder,
        `${localPart}@${identity.domain}`,
        force,
      );
    }
  }
  planned.set(rootEnvPath, rootEnv);

  const apiEnvPath = 'apps/app-api/.env.example';
  let apiEnv = readText(root, apiEnvPath);
  apiEnv = replaceEnvValue(
    apiEnv,
    apiEnvPath,
    'MONGODB_URI',
    PLACEHOLDERS.apiDatabase,
    `mongodb://127.0.0.1:27017/${identity.database}`,
    force,
  );
  apiEnv = replaceEnvValue(
    apiEnv,
    apiEnvPath,
    'BREVO_SENDER_NAME',
    PLACEHOLDERS.senderNameApi,
    identity.name,
    force,
  );
  if (identity.domain) {
    for (const [key, localPart, placeholder] of [
      ['DEFAULT_ADMIN_EMAIL', 'admin', 'admin@example.com'],
      ['DEFAULT_SUPER_ADMIN_EMAIL', 'superadmin', 'superadmin@example.com'],
      ['BREVO_SENDER_EMAIL', 'no-reply', 'noreply@example.com'],
    ]) {
      apiEnv = replaceEnvValue(
        apiEnv,
        apiEnvPath,
        key,
        placeholder,
        `${localPart}@${identity.domain}`,
        force,
      );
    }
  }
  planned.set(apiEnvPath, apiEnv);

  const webEnvPath = 'apps/app-web/.env.example';
  let webEnv = readText(root, webEnvPath);
  webEnv = replaceEnvValue(
    webEnv,
    webEnvPath,
    'NEXT_PUBLIC_APP_NAME',
    PLACEHOLDERS.webName,
    identity.name,
    force,
  );
  if (identity.domain) {
    webEnv = replaceEnvValue(
      webEnv,
      webEnvPath,
      'NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL',
      'privacy@example.com',
      `privacy@${identity.domain}`,
      force,
    );
  }
  planned.set(webEnvPath, webEnv);

  const readmePath = 'README.md';
  let readme = readText(root, readmePath);
  const targetTitle = `# ${identity.name}`;
  assertReplaceable(
    readmePath,
    'title',
    readme.split(/\r?\n/, 1)[0],
    PLACEHOLDERS.readmeTitle,
    targetTitle,
    force,
  );
  readme = readme.replace(/^#[^\r\n]*/u, targetTitle);
  const targetIntro =
    `${identity.name} is initialized from the full-stack application boilerplate. ` +
    'Replace this paragraph with the product overview.';
  if (!readme.includes(targetIntro)) {
    if (!readme.includes(PLACEHOLDERS.readmeIntro) && !force) {
      throw new Error(
        `${readmePath}: introduction is already customized. Rerun with --force only if replacing it is intentional.`,
      );
    }
    readme = readme.replace(PLACEHOLDERS.readmeIntro, targetIntro);
  }
  planned.set(readmePath, readme);

  return planned;
}

function applyChanges(root, planned, dryRun) {
  const changed = [];
  const unchanged = [];
  for (const [relativePath, content] of planned) {
    const current = readText(root, relativePath);
    if (current === content) unchanged.push(relativePath);
    else changed.push(relativePath);
  }

  console.log('\nProject identity files:');
  for (const relativePath of changed) console.log(`- change: ${relativePath}`);
  for (const relativePath of unchanged) console.log(`- unchanged: ${relativePath}`);

  if (!dryRun) {
    for (const relativePath of changed) {
      fs.writeFileSync(path.join(root, relativePath), planned.get(relativePath));
    }
  }
  return { changed, unchanged };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return;
  }
  const root = path.resolve(options.root ?? process.cwd());
  const identity = await collectIdentity(options);
  const planned = planChanges(root, identity, Boolean(options.force));

  console.log('\nResolved project identity:');
  console.log(`- display name: ${identity.name}`);
  console.log(`- slug: ${identity.slug}`);
  console.log(`- root package: ${identity.rootPackage}`);
  console.log(`- mobile ID: ${identity.mobileId}`);
  console.log(`- database: ${identity.database}`);
  console.log(`- domain: ${identity.domain || 'not configured'}`);

  const result = applyChanges(root, planned, Boolean(options.dry_run));
  if (options.dry_run) console.log('\nDry run complete. No files were written.');
  else if (!result.changed.length) console.log('\nProject identity already matches; nothing changed.');
  else console.log('\nProject identity initialized successfully.');

  console.log('\nStill configure separately:');
  if (!identity.domain) console.log('- owned domain and public/admin email addresses');
  console.log('- Expo owner and EAS project ID');
  console.log('- S3, deployment projects, and production secrets');
  console.log('- product logos, icons, colors, copy, and store assets');
  console.log('\nArchitectural names such as app-web, app-mobile, and app-api were preserved.');
}

main().catch((error) => {
  console.error(`Project initialization failed:\n${error.message}`);
  process.exitCode = 1;
});

