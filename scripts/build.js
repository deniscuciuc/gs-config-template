#!/usr/bin/env node
/**
 * build.js — concatenates the source tree into a single .gs bundle ready to paste into the
 * Apps Script editor (or push with clasp).
 *
 * Sources are .js on disk so that Biome, CodeQL and editors can read them. The bundle is
 * .gs because that is what Apps Script calls a script file. Nothing is transpiled; the
 * files are concatenated verbatim.
 *
 * Order matters because Apps Script treats every script as part of one global scope:
 *   1. core/       explicit order, see CORE_ORDER
 *   2. migrations/ sorted by filename
 *   3. project/    explicit order, see PROJECT_ORDER
 *   4. plugins/    sorted by filename, templates excluded
 *
 * Note that migration *bundle* order is filename order, which is not necessarily the order
 * runMigrations() executes them in — the runner follows ALL_MIGRATIONS. That is fine,
 * because migration files only declare a const. See docs/migrations.md.
 *
 * Usage:
 *   node scripts/build.js
 *   node scripts/build.js --overlay examples/game-config --out dist/bundle.game-config.gs
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const CORE_ORDER = [
  'Core.js',
  'Utilities.js',
  'Validation.js',
  'SheetLayout.js',
  'ProgressUI.js',
  'MigrationRunner.js',
  'HealthDashboard.js',
  'ReferenceSheet.js',
  'PluginApi.js',
  'PluginMenu.js',
  'Menu.js',
];

const PROJECT_ORDER = ['Config.js', 'SheetDefinitions.js', 'ReferenceSections.js'];

// Inert starting points, not part of any bundle.
const TEMPLATE_FILES = new Set(['_template.js', '_plugin_template.js']);

function parseArgs(argv) {
  const args = { overlay: null, out: path.join(ROOT, 'dist', 'bundle.gs') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--overlay') {
      args.overlay = argv[++i];
    } else if (argv[i] === '--out') {
      args.out = path.resolve(ROOT, argv[++i]);
    } else {
      throw new Error(`Unknown argument: ${argv[i]}`);
    }
  }
  if (args.overlay) {
    const dir = path.resolve(ROOT, args.overlay);
    if (!fs.existsSync(dir)) throw new Error(`Overlay directory not found: ${args.overlay}`);
    args.overlay = dir;
  }
  return args;
}

function readDir(base, rel) {
  const dir = path.join(base, rel);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js') && !TEMPLATE_FILES.has(f))
    .sort();
}

/**
 * Files listed in `order`, in that order. An unlisted file is a hard error rather than
 * something silently appended: the bundle's whole contract is a deterministic order, and
 * appending quietly is how SheetLayout.js came to load after Menu.js without anyone
 * noticing.
 */
function listOrdered(base, rel, order, label) {
  const present = readDir(base, rel);
  const unlisted = present.filter((f) => !order.includes(f));
  if (unlisted.length > 0) {
    const names = unlisted.join(', ');
    const [verb, pronoun] = unlisted.length === 1 ? ['is', 'it'] : ['are', 'them'];
    throw new Error(
      `${names} in ${rel}/ ${verb} not listed in ${label} in scripts/build.js. ` +
        `Add ${pronoun} in the position the bundle should load it, so the order stays deterministic.`
    );
  }
  return order.filter((f) => present.includes(f)).map((f) => ({ base, rel: path.join(rel, f) }));
}

function listSorted(base, rel) {
  return readDir(base, rel).map((f) => ({ base, rel: path.join(rel, f) }));
}

function collectFiles(overlay) {
  // core/ always comes from src/. An overlay replaces the project and migration layers
  // wholesale and may contribute extra plugins alongside the shared ones.
  const layers = [
    listOrdered(SRC, 'core', CORE_ORDER, 'CORE_ORDER'),
    listSorted(overlay || SRC, 'migrations'),
    listOrdered(overlay || SRC, 'project', PROJECT_ORDER, 'PROJECT_ORDER'),
    listSorted(SRC, 'plugins'),
  ];
  if (overlay) layers.push(listSorted(overlay, 'plugins'));
  return layers.flat();
}

/**
 * A build stamp that is the same for the same commit. An embedded timestamp made every
 * build byte-different, which meant a released bundle could not be checked against its tag
 * and anyone diffing bundles got noise on every rebuild.
 */
function buildStamp() {
  return (
    process.env.GITHUB_REF_NAME ||
    (process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : null) ||
    'local'
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = collectFiles(args.overlay);

  const outDir = path.dirname(args.out);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const parts = [
    '// gs-config-template — bundled output',
    `// Build: ${buildStamp()}`,
    `// Files: ${files.length}`,
    '',
  ];

  let totalLines = 0;
  for (const file of files) {
    const content = fs.readFileSync(path.join(file.base, file.rel), 'utf8');
    parts.push(`// ── ${file.rel.split(path.sep).join('/')} ──`);
    parts.push(content.trimEnd());
    parts.push('');
    totalLines += content.split('\n').length;
  }

  const bundle = parts.join('\n');

  // Parse the bundle before writing it. Apps Script reports a syntax error as a wall of
  // red in a browser editor, long after the paste; a build that cannot produce a parsable
  // file should fail here instead. This is not hypothetical — a stray `*/` inside a
  // sentence in a doc comment took SheetDefinitions out entirely, and nothing noticed
  // because no tool in the pipeline had ever parsed these sources.
  try {
    new vm.Script(bundle, { filename: path.basename(args.out) });
  } catch (err) {
    throw new Error(`${path.basename(args.out)} is not parsable: ${err.message}`);
  }

  fs.writeFileSync(args.out, bundle, 'utf8');
  console.log(`build: wrote ${path.relative(ROOT, args.out)}`);
  console.log(`build: ${files.length} files, ${totalLines} source lines`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`build: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { collectFiles, parseArgs, CORE_ORDER, PROJECT_ORDER };
