/**
 * Test loader — concatenates a chosen subset of source files and evaluates them into the
 * global scope, mirroring the Apps Script runtime where every script shares one global
 * namespace.
 *
 * Sources are .js on disk (so Biome, CodeQL and coverage can read them) and only become
 * .gs when the bundle is pasted into Apps Script. See docs/architecture.md.
 */
const fs = require('node:fs');
const path = require('node:path');

const SRC_ROOT = path.resolve(__dirname, '..', '..', 'src');

/**
 * @param {string[]} relativePaths Paths relative to `root`.
 * @param {string} [root] Defaults to `src/`. Pass a different root to load an example
 *   overlay from `examples/<name>/`.
 */
function loadGsFiles(relativePaths, root) {
  const base = root || SRC_ROOT;
  const sources = relativePaths.map((p) => fs.readFileSync(path.join(base, p), 'utf8'));
  const code = sources.join('\n;\n');

  // Top-level `var` and `function` declarations attach to the global scope on their own.
  // `const`/`let` stay script-scoped and would be invisible to the tests, so mirror every
  // name we can detect onto globalThis explicitly.
  const names = new Set();
  const declRe = /^\s*(?:function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = declRe.exec(code))) names.add(m[1]);
  const varRe = /^\s*(?:var|const|let)\s+([A-Za-z_$][\w$]*)/gm;
  while ((m = varRe.exec(code))) names.add(m[1]);

  const exposeTail = `\n;\n${Array.from(names)
    .map((n) => `try { globalThis[${JSON.stringify(n)}] = ${n}; } catch (e) {}`)
    .join('\n')}`;

  // Indirect eval runs in the *caller's* realm. That matters more than it looks: the
  // tests and the SpreadsheetApp mock live in Jest's sandbox context, and anything loaded
  // through vm.runInThisContext would land in the host realm instead — unable to see the
  // mock, and invisible to the tests. Keeping it here is what makes one shared global
  // namespace work, which is the Apps Script model this harness exists to mirror.
  //
  // The sourceURL gives the evaluated script a name so it can be attributed rather than
  // showing up anonymous in stack traces and V8 coverage data.
  // biome-ignore lint/security/noGlobalEval: required by the test harness
  // biome-ignore lint/style/noCommaOperator: indirect-eval idiom
  (0, eval)(`${code}${exposeTail}\n//# sourceURL=gs-bundle.js`);
}

module.exports = { loadGsFiles, SRC_ROOT };
