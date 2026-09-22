# Contributing to gs-config-template

## Prerequisites

- Node.js 20.12 or newer
- pnpm 10 (`corepack enable && corepack prepare pnpm@10 --activate`)
- An editor that honours `.editorconfig`
- Optional: [clasp](https://github.com/google/clasp) and a scratch Google Sheet, for
  testing a bundle against the real runtime

## Setup

```bash
git clone https://github.com/deniscuciuc/gs-config-template.git
cd gs-config-template
pnpm install
pnpm verify
```

`pnpm verify` is the whole gate: lint, tests, and both bundles. CI runs the same thing.
It is spelled `verify` rather than `ci` because `pnpm ci` is a reserved pnpm command and
silently does something else.

## How the runtime works

Apps Script has no module system. Every script in a project shares one global scope, and
files are evaluated in a fixed order. Three consequences shape everything here:

- **`scripts/build.js` owns the order.** Core first, then migrations, then the project
  layer, then plugins. A core file missing from `CORE_ORDER` fails the build rather than
  being appended, because a bundle whose order is incidental is a bundle that breaks later.
- **Cross-file references are the design, not a mistake.** `noUndeclaredVariables` and
  `noUnusedVariables` are off in `biome.jsonc` for exactly this reason.
- **A trailing underscore means private.** `applyHeaderNotes_` is internal;
  `readRows` is public API. Plugins may call only what `src/core/PluginApi.js` documents.

## Sources are .js, the bundle is .gs

The files under `src/` are `.js`. Biome, CodeQL, Jest and editors can all read `.js` and
none of them can read `.gs` — when these files carried the `.gs` extension every one of
those tools skipped them silently, and a syntax error sat in `SheetDefinitions` unnoticed.

`pnpm build` emits `dist/bundle.gs`, and clasp maps local `.js` to remote `.gs` on push, so
nothing about the Apps Script side changes. If you would rather work in `.gs` anyway,
`scripts/convert-ext.js` will rename them and `docs/architecture.md` explains what you give
up. `pnpm export:gs` writes one `.gs` file per source file if you prefer that to a bundle.

## Code style

Biome owns both lint and format; `pnpm lint:ci` is what CI runs and `pnpm lint:fix` fixes
most of it. The runtime sources are written in an ES5 dialect — `var`, `function` callbacks,
string concatenation — and the rules that would fight that are turned off in `biome.jsonc`,
each with its reason next to it. Match the surrounding code rather than modernising it
file by file; a mixed dialect in one global scope is harder to read than either dialect.

## Repository layout

```
src/core/        the template runtime — generic, no sheet names, no domain data
src/project/     the two-sheet skeleton an adopter replaces
src/migrations/  one migration per file, plus the inert _template.js
src/plugins/     generic plugins, plus the inert _plugin_template.js
examples/        build overlays: the same conventions at real scale
scripts/         bundler and the .gs conversion utilities
test/            Jest suites and the hand-rolled Apps Script mock
```

The `src/core/` boundary is the one rule worth enforcing: nothing in it may name a sheet or
a domain concept. If core needs something from the project layer, read it defensively the
way `HealthDashboard.js` reads `PROJECT_NAME`, so core still works without it.

## Adding a sheet

See [docs/sheet-schemas.md](docs/sheet-schemas.md). Every column needs a header note — that
is not a style preference, it is the only documentation the people editing the config will
ever see.

## Adding a migration

See [docs/migrations.md](docs/migrations.md). Copy `src/migrations/_template.js`, give it an
ascending `YYYYMMDDNNNN` id, make `up()` idempotent, and register it in `ALL_MIGRATIONS`.

## Adding a plugin

See [docs/plugins.md](docs/plugins.md).

## Testing

`test/__mocks__/SpreadsheetApp.js` is a hand-rolled fake of the Sheets API covering what the
tests touch — extend it rather than working around it. `test/__mocks__/loader.js`
concatenates sources and evaluates them into one global scope, mirroring the Apps Script
model.

That loader uses indirect `eval` deliberately: it runs in the caller's realm, so the loaded
code can see the mock and the tests can see the loaded functions. `vm.runInThisContext`
would put them in different realms and neither would work.

The cost is that coverage cannot see through it. `pnpm test:coverage` reports on `scripts/`
only, and the number for `src/` would be zero no matter how many tests you write — so it is
not collected rather than reported as a falsehood. The suites do exercise `src/`; nothing
can measure it. Making that measurable means replacing the loader, which is a real piece of
work and a welcome one.

## Dependencies

There are no runtime dependencies — the bundle ships no third-party code. The development
dependencies are Biome and Jest, and `pnpm.overrides` in `package.json` pins five packages
Jest reaches transitively to their patched versions.

One of those pins is deliberately narrow. `@babel/core` is constrained to `^7.29.6` rather
than `>=7.29.6`, because 8.x is ESM-only while `babel-jest` still `require()`s it — which
fails on Node 20.12, the floor this project declares. Node 22 and later can `require()` an
ES module, so the only place it breaks is the oldest supported version. That is the reason
the CI matrix includes a 20.12 leg; it caught exactly this.

Widen that pin only together with a matching change to `engines.node`.

## Pull requests

- Keep a PR to a single concern.
- New behaviour and bug fixes need tests.
- Conventional commits, scoped: `feat(core): …`, `fix(build): …`, `docs(readme): …`.
- Note breaking changes in `CHANGELOG.md` under `## [Unreleased]`. Because adopters copy
  this template rather than depend on it, a breaking change is one they have to port by
  hand — say what that takes.
- CI must be green: lint, tests, both bundles, CodeQL and the secret scan.

## Releasing

See [docs/release-process.md](docs/release-process.md). Releases are git tags; nothing is
published to npm.
