# Testing

```
pnpm test           # jest
pnpm test:ci        # jest --ci, what CI runs
pnpm test:coverage  # coverage for scripts/
```

## What the harness is

Apps Script code cannot be `require`d. It has no exports, it assumes globals that only exist
inside Google's runtime, and it depends on every file sharing one scope. Two mocks bridge
that:

**`test/__mocks__/SpreadsheetApp.js`** is a hand-rolled fake of the Sheets API — sheets,
ranges, the UI, `Session` — covering what the tests actually touch, with a
`__resetSpreadsheet()` for isolation between tests. It is not a complete implementation and
is not trying to be. When a test needs an API the fake lacks, extend the fake rather than
working around it.

**`test/__mocks__/loader.js`** concatenates chosen source files and evaluates them into the
global scope:

```javascript
const { loadGsFiles } = require('./__mocks__/loader.js');
loadGsFiles(['core/Core.js', 'core/Utilities.js']);
```

Pass a second argument to load from somewhere other than `src/`, such as an example overlay.

## Why it uses eval

Indirect `eval` runs in the *caller's* realm. That is the whole reason it is there: the
tests and the `SpreadsheetApp` mock live in Jest's sandbox context, and code loaded through
`vm.runInThisContext` would land in the host realm instead — unable to see the mock, and
invisible to the tests. Both directions break.

`const` and `let` at the top level of an evaluated script stay script-scoped rather than
becoming globals, so the loader detects declared names by regex and mirrors them onto
`globalThis` explicitly. The evaluated code carries a `//# sourceURL` so it is attributable
in stack traces instead of anonymous.

## Why there is no coverage number for src/

Neither Jest coverage provider can attribute anything to an eval'd string. The istanbul
provider instruments at transform time and never sees these files, because they are read
with `fs.readFileSync` rather than required; the v8 provider does not attribute the
resulting script either. Both report **0% for all of `src/`** regardless of how many tests
exist.

So coverage is collected for `scripts/` only, where it means something. The runtime *is*
tested — the suites exercise the migration runner, the utilities and the bundler — but the
number is not measurable, and publishing a zero would say something false about the project.

Making it measurable means replacing the loader with something that preserves both the
shared-global-scope model and instrumentability. That is a real piece of work and a welcome
contribution.

## Adding a test

```javascript
const { loadGsFiles } = require('./__mocks__/loader.js');

describe('Utilities', () => {
  beforeEach(() => {
    __resetSpreadsheet();
    loadGsFiles(['core/Core.js', 'core/Utilities.js']);
  });

  test('trimSheet_ keeps at least two rows', () => {
    const sheet = getOrCreateSheet('S');
    trimSheet_(sheet, 1, 3);
    expect(sheet.getMaxRows()).toBeGreaterThanOrEqual(2);
  });
});
```

Load the smallest set of files the test needs. The loader is idempotent, so repeated loads
across tests are fine.

`test/build.test.js` is the exception to all of the above: `scripts/build.js` is ordinary
Node, so it is required directly and tested normally. It asserts the properties the bundle
contract depends on — core files in exactly `CORE_ORDER`, template stubs excluded, overlay
layers substituted correctly, byte-identical rebuilds, and a hard failure when a core file
is missing from the order.
