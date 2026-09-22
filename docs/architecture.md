# Architecture

## One global scope

Apps Script has no module system. Every script file in a project is evaluated into one
shared global scope, in an order the project defines. There is no `import`, no `require`,
and no way for one file to declare a dependency on another.

Three consequences run through every design decision here:

- **Order is part of the contract.** `scripts/build.js` names it explicitly rather than
  relying on directory listing order.
- **Cross-file references are the design.** A function defined in `Core.js` and called from
  `Config.js` is how the runtime works, which is why `noUndeclaredVariables` and
  `noUnusedVariables` are off in `biome.jsonc`.
- **Name collisions are fatal and silent-ish.** Two files declaring the same top-level
  `const` produce a syntax error for the whole bundle, not a scoped shadow.

Function declarations hoist, so a function may be called from a file bundled earlier.
Top-level `const` and `let` do not — a const read during another file's top-level
initialisation must be bundled before it. In practice the template only reads project
globals from inside functions, which is why the order rarely bites.

## Layers

```
src/core/        generic runtime. No sheet names, no domain data, no seed values.
src/project/     Config.js, SheetDefinitions.js, ReferenceSections.js — yours to rewrite.
src/migrations/  one file per migration.
src/plugins/     on-demand utilities.
```

The `src/core/` boundary is the load-bearing one. It is what lets an adopter take a newer
version of the template by diffing a single directory, and what lets one core build several
projects through overlays. When core genuinely needs something from the project layer, it
reads it defensively:

```javascript
var title = typeof PROJECT_NAME === 'string' && PROJECT_NAME
  ? PROJECT_NAME + ' — Config Health'
  : 'Config Health';
```

Core keeps working when the global is absent. This pattern is used for `PROJECT_NAME`,
`MENU_TITLE`, `ALL_MIGRATIONS` and `ALL_SHEET_NAMES`.

## Overlays

An overlay is a directory with the same shape as the project layer:

```
examples/game-config/
├── project/      replaces src/project/
├── migrations/   replaces src/migrations/
└── plugins/      added alongside src/plugins/
```

```
node scripts/build.js --overlay examples/game-config --out dist/bundle.game-config.gs
```

`core/` always comes from `src/`. This is how one runtime builds several configurations,
and how the repository ships a full worked example without that example being what you get
by default.

## Sources are .js, the bundle is .gs

Apps Script calls its script files `.gs`. The extension is Google's, and nothing outside
Google recognises it: Biome, CodeQL, Jest and most editors skip `.gs` files silently rather
than erroring. In this repository that was not theoretical — `SheetDefinitions` contained a
doc comment reading `create*/configure*`, whose `*/` closed the comment early and left a
syntax error in the file. It shipped, because nothing had ever parsed it.

So the sources are `.js` and the artefact is `.gs`. clasp already maps local `.js` to remote
`.gs` on push, so the Apps Script side is unchanged. `scripts/export-gs.js` writes the
sources out as individual `.gs` files if you would rather work that way, and
`scripts/convert-ext.js` renames the sources in place in either direction — at the cost of
lint and analysis if you go back.

## The build

`scripts/build.js` concatenates, in order: core by `CORE_ORDER`, migrations by filename,
project by `PROJECT_ORDER`, then plugins by filename. Files named `_template.js` and
`_plugin_template.js` are excluded.

Two properties are enforced rather than hoped for:

- **A core file missing from `CORE_ORDER` fails the build.** It used to be appended
  silently, which is how `SheetLayout` came to load after `Menu`.
- **The bundle is parsed before it is written.** A syntax error surfaces as a failed build
  rather than as a wall of red in a browser editor after the paste.

The build stamp is the tag or short commit, not a timestamp, so the same sources produce a
byte-identical bundle and a released artefact can be checked against its tag.

## Test harness

`test/__mocks__/SpreadsheetApp.js` is a hand-rolled fake of the parts of the Sheets API the
tests touch. `test/__mocks__/loader.js` concatenates sources and evaluates them into one
global scope, mirroring the runtime.

The loader uses indirect `eval` on purpose. It runs in the caller's realm, so the loaded
code can see the mock and the tests can see the loaded functions; `vm.runInThisContext`
would place them in different realms and neither direction would work. The cost is that
coverage instrumentation cannot see through it — see [testing.md](testing.md).
