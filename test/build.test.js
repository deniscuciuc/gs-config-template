/**
 * Tests for scripts/build.js — the bundler's contract is a deterministic file order and a
 * parsable output, and both used to be assumptions rather than assertions.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'scripts', 'build.js');
const { collectFiles, parseArgs, CORE_ORDER, PROJECT_ORDER } = require('../scripts/build.js');

function runBuild(args) {
  return execFileSync('node', [BUILD, ...args], { cwd: ROOT, encoding: 'utf8' });
}

function bannersOf(bundlePath) {
  return fs
    .readFileSync(bundlePath, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('// ── '))
    .map((l) => l.replace('// ── ', '').replace(' ──', ''));
}

describe('build: file collection', () => {
  test('core files come first, in exactly CORE_ORDER', () => {
    const core = collectFiles(null)
      .filter((f) => f.rel.startsWith(`core${path.sep}`))
      .map((f) => path.basename(f.rel));
    expect(core).toEqual(CORE_ORDER);
  });

  test('SheetLayout.js is listed explicitly, not appended as an afterthought', () => {
    // It used to fall through the extras branch and load after Menu.js.
    expect(CORE_ORDER).toContain('SheetLayout.js');
    expect(CORE_ORDER.indexOf('SheetLayout.js')).toBeLessThan(CORE_ORDER.indexOf('Menu.js'));
  });

  test('project files follow PROJECT_ORDER', () => {
    const project = collectFiles(null)
      .filter((f) => f.rel.startsWith(`project${path.sep}`))
      .map((f) => path.basename(f.rel));
    expect(project).toEqual(PROJECT_ORDER.filter((f) => project.includes(f)));
  });

  test('template stubs are excluded from every bundle', () => {
    const names = collectFiles(null).map((f) => path.basename(f.rel));
    expect(names).not.toContain('_template.js');
    expect(names).not.toContain('_plugin_template.js');
  });

  test('layer order is core, then migrations, then project, then plugins', () => {
    const layers = collectFiles(null).map((f) => f.rel.split(path.sep)[0]);
    const firstIndexOf = (layer) => layers.indexOf(layer);
    expect(firstIndexOf('core')).toBeLessThan(firstIndexOf('migrations'));
    expect(firstIndexOf('migrations')).toBeLessThan(firstIndexOf('project'));
    expect(firstIndexOf('project')).toBeLessThan(firstIndexOf('plugins'));
  });
});

describe('build: overlay', () => {
  const overlay = 'examples/game-config';

  test('an overlay replaces the project and migration layers', () => {
    const files = collectFiles(path.join(ROOT, overlay));
    const migrations = files.filter((f) => f.rel.startsWith(`migrations${path.sep}`));
    expect(migrations.length).toBeGreaterThan(1);
    // Every migration and project file comes from the overlay, none from src/.
    for (const f of files) {
      const layer = f.rel.split(path.sep)[0];
      if (layer === 'migrations' || layer === 'project') {
        expect(f.base).toBe(path.join(ROOT, overlay));
      }
      if (layer === 'core') expect(f.base).toBe(path.join(ROOT, 'src'));
    }
  });

  test('overlay migrations are bundled in ascending id order', () => {
    const ids = collectFiles(path.join(ROOT, overlay))
      .filter((f) => f.rel.startsWith(`migrations${path.sep}`))
      .map((f) => path.basename(f.rel));
    expect(ids).toEqual([...ids].sort());
  });

  test('the overlay contributes its plugins alongside the shared ones', () => {
    const plugins = collectFiles(path.join(ROOT, overlay))
      .filter((f) => f.rel.startsWith(`plugins${path.sep}`))
      .map((f) => path.basename(f.rel));
    expect(plugins).toContain('plugin_auto_translate.js');
    expect(plugins).toContain('example_generate_tournaments.js');
  });
});

describe('build: argument parsing', () => {
  test('defaults to dist/bundle.gs with no overlay', () => {
    const args = parseArgs([]);
    expect(args.overlay).toBeNull();
    expect(args.out).toBe(path.join(ROOT, 'dist', 'bundle.gs'));
  });

  test('rejects an unknown argument', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/Unknown argument/);
  });

  test('rejects an overlay directory that does not exist', () => {
    expect(() => parseArgs(['--overlay', 'examples/nope'])).toThrow(/not found/);
  });
});

describe('build: output', () => {
  let outDir;

  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-build-'));
  });

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  test('writes a parsable bundle and reports the file count', () => {
    const out = path.join(outDir, 'bundle.gs');
    const stdout = runBuild(['--out', out]);
    expect(stdout).toMatch(/wrote/);
    expect(fs.existsSync(out)).toBe(true);
    // Every file in the bundle is announced by a banner comment.
    expect(bannersOf(out)).toEqual(collectFiles(null).map((f) => f.rel.split(path.sep).join('/')));
  });

  test('the same sources produce byte-identical bundles', () => {
    // An embedded timestamp used to make every build differ, so a released bundle could
    // not be checked against its tag.
    const a = path.join(outDir, 'a.gs');
    const b = path.join(outDir, 'b.gs');
    runBuild(['--out', a]);
    runBuild(['--out', b]);
    expect(fs.readFileSync(a, 'utf8')).toBe(fs.readFileSync(b, 'utf8'));
  });

  test('an unlisted core file fails the build instead of being appended silently', () => {
    const stray = path.join(ROOT, 'src', 'core', '__stray_test__.js');
    fs.writeFileSync(stray, '// temporary fixture\n');
    try {
      expect(() => runBuild(['--out', path.join(outDir, 'stray.gs')])).toThrow(
        /__stray_test__\.js/
      );
    } finally {
      fs.rmSync(stray, { force: true });
    }
  });
});
