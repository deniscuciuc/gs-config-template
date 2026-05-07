/**
 * Test loader — concatenates a chosen subset of .gs files and evaluates them
 * into the global scope, mirroring the GAS runtime where every script shares
 * one global namespace.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC_ROOT = path.resolve(__dirname, '..', '..', 'src');

function loadGsFiles(relativePaths) {
  const sources = relativePaths.map((p) => fs.readFileSync(path.join(SRC_ROOT, p), 'utf8'));
  const code = sources.join('\n;\n');

  // Indirect eval runs in the global scope of the caller's realm (Jest's
  // sandbox global), so top-level `var`/`function` declarations attach there.
  // `const`/`let` remain script-scoped and won't be visible — we mirror the
  // names we can detect onto globalThis explicitly.
  const names = new Set();
  const declRe = /^\s*(?:function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = declRe.exec(code))) names.add(m[1]);
  const varRe = /^\s*(?:var|const|let)\s+([A-Za-z_$][\w$]*)/gm;
  while ((m = varRe.exec(code))) names.add(m[1]);

  const exposeTail = `\n;\n${Array.from(names)
    .map((n) => `try { globalThis[${JSON.stringify(n)}] = ${n}; } catch (e) {}`)
    .join('\n')}`;

  // (0, eval) forces indirect (global) eval so declarations attach to the
  // surrounding global scope. This mirrors the Apps Script runtime's single
  // shared namespace and is intentional for the test harness only.
  // biome-ignore lint/security/noGlobalEval: required by the test harness
  // biome-ignore lint/style/noCommaOperator: indirect-eval idiom
  (0, eval)(code + exposeTail);
}

module.exports = { loadGsFiles, SRC_ROOT };
