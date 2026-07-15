#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'project-init.mjs');

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-init-'));
  write(root, 'package.json', '{\n  "name": "@app/boilerplate",\n  "private": true\n}\n');
  write(
    root,
    'package-lock.json',
    '{\n  "name": "@app/source",\n  "lockfileVersion": 3,\n  "packages": {\n    "": {\n      "name": "@app/source"\n    }\n  }\n}\n',
  );
  write(
    root,
    'apps/app-mobile/app.json',
    `${JSON.stringify(
      {
        expo: {
          name: 'App Boilerplate',
          slug: 'app-mobile',
          description:
            'Project-agnostic multi-tenant Expo starter with authentication, profiles, notifications, theming, and i18n.',
          scheme: 'appboilerplate',
          ios: { bundleIdentifier: 'com.example.appmobile' },
          android: { package: 'com.example.appmobile' },
        },
      },
      null,
      2,
    )}\n`,
  );
  write(
    root,
    '.env.example',
    [
      'MONGODB_URI=mongodb://127.0.0.1:27017/app-db',
      'DEFAULT_ADMIN_EMAIL=admin@example.com',
      'DEFAULT_SUPER_ADMIN_EMAIL=superadmin@example.com',
      'BREVO_SENDER_EMAIL=no-reply@example.com',
      'BREVO_SENDER_NAME=App Boilerplate',
      '',
    ].join('\n'),
  );
  write(
    root,
    'apps/app-api/.env.example',
    [
      'MONGODB_URI=mongodb://127.0.0.1:27017/app-api',
      'BREVO_SENDER_EMAIL=noreply@example.com',
      'BREVO_SENDER_NAME=Application',
      'DEFAULT_ADMIN_EMAIL=admin@example.com',
      'DEFAULT_SUPER_ADMIN_EMAIL=superadmin@example.com',
      '',
    ].join('\n'),
  );
  write(
    root,
    'apps/app-web/.env.example',
    [
      'NEXT_PUBLIC_APP_NAME=Application',
      'NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=privacy@example.com',
      '',
    ].join('\n'),
  );
  write(
    root,
    'README.md',
    '# Full-Stack Application Boilerplate\n\nProject-agnostic Nx monorepo for a multi-tenant product with a web admin,\nExpo mobile app, and NestJS GraphQL API.\n',
  );
  return root;
}

function run(root, extra = []) {
  return spawnSync(
    process.execPath,
    [
      SCRIPT,
      '--root',
      root,
      '--non-interactive',
      '--name',
      'Dala',
      '--namespace',
      'com.jadey',
      '--domain',
      'dala.app',
      ...extra,
    ],
    { encoding: 'utf8' },
  );
}

function snapshot(root) {
  const files = [
    'package.json',
    'package-lock.json',
    'apps/app-mobile/app.json',
    '.env.example',
    'apps/app-api/.env.example',
    'apps/app-web/.env.example',
    'README.md',
  ];
  return Object.fromEntries(files.map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
}

const roots = [];
try {
  const dryRoot = createFixture();
  roots.push(dryRoot);
  const beforeDryRun = snapshot(dryRoot);
  const dryRun = run(dryRoot, ['--dry-run']);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.deepEqual(snapshot(dryRoot), beforeDryRun, 'dry run must not write files');
  assert.match(dryRun.stdout, /No files were written/);

  const root = createFixture();
  roots.push(root);
  const first = run(root);
  assert.equal(first.status, 0, first.stderr);

  const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(rootPackage.name, '@dala/workspace');
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  assert.equal(lock.name, '@dala/workspace');
  assert.equal(lock.packages[''].name, '@dala/workspace');

  const mobile = JSON.parse(fs.readFileSync(path.join(root, 'apps/app-mobile/app.json'), 'utf8'));
  assert.equal(mobile.expo.name, 'Dala');
  assert.equal(mobile.expo.slug, 'dala');
  assert.equal(mobile.expo.scheme, 'dala');
  assert.equal(mobile.expo.ios.bundleIdentifier, 'com.jadey.dala');
  assert.equal(mobile.expo.android.package, 'com.jadey.dala');

  const rootEnv = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.match(rootEnv, /MONGODB_URI=mongodb:\/\/127\.0\.0\.1:27017\/dala-db/);
  assert.match(rootEnv, /BREVO_SENDER_NAME=Dala/);
  assert.match(rootEnv, /BREVO_SENDER_EMAIL=no-reply@dala\.app/);
  assert.match(rootEnv, /DEFAULT_ADMIN_EMAIL=admin@dala\.app/);
  const apiEnv = fs.readFileSync(path.join(root, 'apps/app-api/.env.example'), 'utf8');
  assert.match(apiEnv, /MONGODB_URI=mongodb:\/\/127\.0\.0\.1:27017\/dala-db/);
  assert.match(apiEnv, /BREVO_SENDER_EMAIL=no-reply@dala\.app/);
  const webEnv = fs.readFileSync(path.join(root, 'apps/app-web/.env.example'), 'utf8');
  assert.match(webEnv, /NEXT_PUBLIC_APP_NAME=Dala/);
  assert.match(webEnv, /NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=privacy@dala\.app/);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /^# Dala/);

  const afterFirst = snapshot(root);
  const second = run(root);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(snapshot(root), afterFirst, 'second run must be idempotent');
  assert.match(second.stdout, /already matches/);

  const guardedRoot = createFixture();
  roots.push(guardedRoot);
  const customPackage = JSON.parse(fs.readFileSync(path.join(guardedRoot, 'package.json'), 'utf8'));
  customPackage.name = '@existing/workspace';
  fs.writeFileSync(path.join(guardedRoot, 'package.json'), `${JSON.stringify(customPackage, null, 2)}\n`);
  const guardedBefore = snapshot(guardedRoot);
  const guarded = run(guardedRoot);
  assert.notEqual(guarded.status, 0);
  assert.match(guarded.stderr, /already customized/);
  assert.deepEqual(snapshot(guardedRoot), guardedBefore, 'guard failure must be atomic');

  const forced = run(guardedRoot, ['--force']);
  assert.equal(forced.status, 0, forced.stderr);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(guardedRoot, 'package.json'), 'utf8')).name,
    '@dala/workspace',
  );

  const invalidRoot = createFixture();
  roots.push(invalidRoot);
  const invalid = spawnSync(
    process.execPath,
    [
      SCRIPT,
      '--root',
      invalidRoot,
      '--non-interactive',
      '--name',
      'Dala',
      '--namespace',
      'Jadey',
    ],
    { encoding: 'utf8' },
  );
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /reverse domain/);

  console.log('Project initializer regression tests passed.');
} finally {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
}
