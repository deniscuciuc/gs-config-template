#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * build.js — concatenates all core + project + migration .gs files into
 * a single dist/bundle.gs ready to paste into Apps Script (or push via clasp).
 *
 * Order matters because GAS treats every script as part of one global scope:
 *   1. core/ (Core, Utilities, Validation, ProgressUI, MigrationRunner,
 *      HealthDashboard, PluginApi, PluginMenu, Menu)
 *   2. migrations/ (sorted by filename — chronological by convention)
 *   3. project/ (Config, SheetDefinitions, ReferenceSheet)
 *   4. plugins/ (every file except _plugin_template.gs)
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST_DIR = path.join(ROOT, 'dist');
const OUT = path.join(DIST_DIR, 'bundle.gs');

const CORE_ORDER = [
  'Core.gs',
  'Utilities.gs',
  'Validation.gs',
  'ProgressUI.gs',
  'MigrationRunner.gs',
  'HealthDashboard.gs',
  'PluginApi.gs',
  'PluginMenu.gs',
  'Menu.gs',
];

const PROJECT_ORDER = ['Config.gs', 'SheetDefinitions.gs', 'ReferenceSheet.gs'];

function readDir(rel) {
  const dir = path.join(SRC, rel);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.gs'))
    .map((f) => path.join(rel, f));
}

function listCoreFiles() {
  const present = new Set(readDir('core').map((p) => path.basename(p)));
  const ordered = CORE_ORDER.filter((f) => present.has(f)).map((f) => path.join('core', f));
  // Append any files not in the explicit order (defensive — should be empty).
  const extras = readDir('core').filter((p) => !CORE_ORDER.includes(path.basename(p)));
  return ordered.concat(extras);
}

function listMigrationFiles() {
  return readDir('migrations')
    .filter((p) => path.basename(p) !== '_template.gs')
    .sort();
}

function listProjectFiles() {
  const present = new Set(readDir('project').map((p) => path.basename(p)));
  const ordered = PROJECT_ORDER.filter((f) => present.has(f)).map((f) => path.join('project', f));
  const extras = readDir('project').filter((p) => !PROJECT_ORDER.includes(path.basename(p)));
  return ordered.concat(extras);
}

function listPluginFiles() {
  return readDir('plugins')
    .filter((p) => path.basename(p) !== '_plugin_template.gs')
    .sort();
}

function main() {
  const files = []
    .concat(listCoreFiles())
    .concat(listMigrationFiles())
    .concat(listProjectFiles())
    .concat(listPluginFiles());

  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

  const parts = [];
  parts.push('// gs-config-template — bundled output');
  parts.push(`// Generated: ${new Date().toISOString()}`);
  parts.push(`// Files: ${files.length}`);
  parts.push('');

  let totalLines = 0;
  for (const rel of files) {
    const abs = path.join(SRC, rel);
    const content = fs.readFileSync(abs, 'utf8');
    parts.push(`// ── ${rel.replace(/\\/g, '/')} ──`);
    parts.push(content.trimEnd());
    parts.push('');
    totalLines += content.split('\n').length;
  }

  fs.writeFileSync(OUT, parts.join('\n'), 'utf8');
  console.log(`build: wrote ${path.relative(ROOT, OUT)}`);
  console.log(`build: ${files.length} files, ${totalLines} source lines`);
}

main();
