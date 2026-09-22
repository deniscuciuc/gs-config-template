#!/usr/bin/env node
/**
 * export-gs.js — writes the sources out as individual .gs files.
 *
 * `pnpm build` produces one bundle, which is the fastest way to get the template into a
 * spreadsheet: paste it into a single script file and you are done. This script is the
 * other option — one .gs file per source file, keeping the directory structure, which is
 * what you want if you would rather work file-by-file in the Apps Script editor or push
 * with clasp and see the same layout on both sides.
 *
 * Apps Script has no folders. A file pushed at core/Core.gs is simply *named* "core/Core"
 * in the editor, which is the convention clasp uses and reads back correctly.
 *
 * Usage:
 *   node scripts/export-gs.js
 *   node scripts/export-gs.js --overlay examples/game-config --out dist/gs-game-config
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const { collectFiles } = require('./build.js');

function parseArgs(argv) {
  const args = { overlay: null, out: path.join(ROOT, 'dist', 'gs') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--overlay') {
      args.overlay = path.resolve(ROOT, argv[++i]);
    } else if (argv[i] === '--out') {
      args.out = path.resolve(ROOT, argv[++i]);
    } else {
      throw new Error(`Unknown argument: ${argv[i]}`);
    }
  }
  if (args.overlay && !fs.existsSync(args.overlay)) {
    throw new Error(`Overlay directory not found: ${path.relative(ROOT, args.overlay)}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = collectFiles(args.overlay);

  fs.rmSync(args.out, { recursive: true, force: true });

  for (const file of files) {
    const target = path.join(args.out, file.rel.replace(/\.js$/, '.gs'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(file.base, file.rel), target);
  }

  console.log(`export-gs: wrote ${files.length} .gs files to ${path.relative(ROOT, args.out)}`);
  console.log('export-gs: push with `clasp push`, or copy them into the Apps Script editor.');
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`export-gs: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { parseArgs };
