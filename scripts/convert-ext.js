#!/usr/bin/env node
/**
 * convert-ext.js — renames Apps Script sources between .gs and .js in place.
 *
 * Two situations need this:
 *
 *   - You have an existing Apps Script project full of .gs files and want to work on it
 *     with this template's tooling. Nothing in Biome, CodeQL, Jest or a typical editor
 *     recognises .gs, so they all skip those files silently. Run `--to js` once.
 *
 *   - You would rather keep .gs sources than adopt the .js convention. Run `--to gs`, then
 *     change the `.js` extension checks in scripts/build.js and the `files.include` globs
 *     in biome.jsonc to match — and know that you are giving up lint and analysis on them.
 *
 * Uses `git mv` inside a git work tree so history follows the rename, and a plain rename
 * otherwise. Refuses to overwrite an existing file.
 *
 * Usage:
 *   node scripts/convert-ext.js --to js [dir]      (default dir: src)
 *   node scripts/convert-ext.js --to gs src --dry-run
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { to: null, dir: 'src', dryRun: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--to') {
      args.to = argv[++i];
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    } else if (argv[i].startsWith('--')) {
      throw new Error(`Unknown argument: ${argv[i]}`);
    } else {
      positional.push(argv[i]);
    }
  }
  if (args.to !== 'js' && args.to !== 'gs') {
    throw new Error('Pass --to js or --to gs.');
  }
  if (positional.length > 1) throw new Error('Pass at most one directory.');
  if (positional.length === 1) args.dir = positional[0];
  return args;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function inGitWorkTree() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const from = args.to === 'js' ? '.gs' : '.js';
  const to = args.to === 'js' ? '.js' : '.gs';

  const dir = path.resolve(ROOT, args.dir);
  if (!fs.existsSync(dir)) throw new Error(`Directory not found: ${args.dir}`);

  const targets = walk(dir).filter((f) => f.endsWith(from));
  if (targets.length === 0) {
    console.log(`convert-ext: no ${from} files under ${args.dir} — nothing to do.`);
    return;
  }

  const useGit = !args.dryRun && inGitWorkTree();
  let renamed = 0;
  for (const file of targets) {
    const target = file.slice(0, -from.length) + to;
    if (fs.existsSync(target)) {
      throw new Error(`Refusing to overwrite ${path.relative(ROOT, target)}`);
    }
    const label = `${path.relative(ROOT, file)} -> ${path.relative(ROOT, target)}`;
    if (args.dryRun) {
      console.log(`convert-ext: would rename ${label}`);
      continue;
    }
    if (useGit) {
      try {
        execFileSync('git', ['mv', file, target], { cwd: ROOT, stdio: 'pipe' });
      } catch {
        // Untracked files are not a git mv candidate; a plain rename is correct for them.
        fs.renameSync(file, target);
      }
    } else {
      fs.renameSync(file, target);
    }
    console.log(`convert-ext: ${label}`);
    renamed++;
  }

  if (args.dryRun) {
    console.log(
      `convert-ext: ${targets.length} file(s) would be renamed. Re-run without --dry-run.`
    );
    return;
  }
  console.log(`convert-ext: renamed ${renamed} file(s).`);
  if (to === '.gs') {
    console.log('convert-ext: update scripts/build.js and biome.jsonc to match, or the build');
    console.log('convert-ext: will find no sources and lint will skip them.');
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`convert-ext: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { parseArgs };
