# gs-config-template

[![CI](https://github.com/deniscuciuc/gs-config-template/actions/workflows/ci.yml/badge.svg)](https://github.com/deniscuciuc/gs-config-template/actions/workflows/ci.yml)
[![CodeQL](https://github.com/deniscuciuc/gs-config-template/actions/workflows/codeql.yml/badge.svg)](https://github.com/deniscuciuc/gs-config-template/actions/workflows/codeql.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-V8-4285F4.svg)](https://developers.google.com/apps-script/guides/v8-runtime)

> A Google Apps Script template for projects that keep their configuration in a Google
> Sheet. Migrations, typed sheet schemas, a plugin system and a health dashboard, bundled
> into one file you paste into the Apps Script editor.

A spreadsheet is a good configuration store right up to the moment two people disagree about
what a column means, or someone adds a row that nothing validates, or a change has to reach
four environments and nobody can say which of them already has it. This is the machinery
that keeps it honest: the schema lives in code, every change is a migration that records
itself, and each column carries a note explaining what belongs in it.

## Quick start

```
pnpm install
pnpm build
```

Then:

1. Open your spreadsheet, and choose **Extensions → Apps Script**.
2. Replace the contents of the single `Code.gs` file with `dist/bundle.gs`.
3. Reload the spreadsheet. A `⚙️ Sheet Config` menu appears — the label is `MENU_TITLE` in
   [src/project/Config.js](src/project/Config.js), and renaming it is usually the first
   thing you do.
4. Click **Run Migrations** to create the sheets.

If you would rather work file-by-file than paste a bundle, `pnpm export:gs` writes one `.gs`
file per source file for `clasp push`. See [docs/deploying.md](docs/deploying.md).

## What you get

| | |
|---|---|
| **Migrations** | Every change is an idempotent `up()` recorded in a hidden `__MigrationsHistory` sheet. `runMigrations()` is a pure runner: it skips what has already been applied, stops at the first failure, and contains no logic of its own. |
| **Typed schemas** | `createXxxSheet_()` / `configureXxxSheet_()` pairs you can re-run at any time to repair drift in headers, widths, dropdowns and validation. |
| **Column documentation** | Every column carries a header note, shown as a hover tooltip in the sheet. The people editing your config never have to read the code — and nothing else will ever tell them what `Priority` means. |
| **Reference sheet** | A `_Reference` tab rendered from plain data: formats, enumerations, anything not obvious from a header. |
| **Plugins** | Drop a file in `src/plugins/`, push one entry to `PLUGIN_MENU_ITEMS`, and it appears in the menu. Plugins call a small documented facade, not the internals. |
| **Health dashboard** | One click regenerates a `__Health` sheet: migrations registered, applied and pending, sheets present, validation errors. |
| **Progress reporter** | Apps Script's UI is modal-only, so long tasks report into a hidden `__Progress` sheet instead of freezing behind a dialog. |
| **One-file bundle** | No runtime dependencies, nothing transpiled. The build concatenates sources in a fixed order and checks the result parses before writing it. |

A migration is a file:

```javascript
const migration_202601010001_initial_setup = {
  id: '202601010001_initial_setup',
  description: 'Create the Settings, Localization and _Reference sheets.',
  up: function () {
    createSettingsSheet_();
    createLocalizationSheet_();
    createReferenceSheet_();
  },
};
```

And a column is documented where it is defined:

```javascript
applyHeaderNotes_(sheet, [
  'Setting key in dotted lowercase, e.g. feature.signup.enabled. Required, unique.',
  'The value, written as text. Parse it according to Type.',
  'How to parse Value: string, number, boolean or json. Required.',
  'Checkbox. Uncheck to ignore the row without deleting it.',
  'Free-form note explaining what this setting controls.',
]);
```

## Sources are .js, the bundle is .gs

The files under `src/` are `.js`. Apps Script calls its script files `.gs`, but no tool
outside Google recognises that extension — Biome, CodeQL, Jest and most editors skip `.gs`
files silently, which is how a syntax error lived in this repository undetected until the
sources were renamed.

`pnpm build` emits `dist/bundle.gs`, and clasp maps local `.js` to remote `.gs` on push, so
the Apps Script side is exactly the same. Two scripts are there if you want the other
arrangement: `pnpm export:gs` writes the sources out as individual `.gs` files, and
`scripts/convert-ext.js` renames them in place in either direction. What you give up by
going back to `.gs` is lint and static analysis on your runtime code.

## How the bundle is built

Apps Script evaluates every script in one shared global scope, so order is part of the
contract rather than an implementation detail:

```
src/core/        explicit order (CORE_ORDER in scripts/build.js)
src/migrations/  filename order
src/project/     explicit order (PROJECT_ORDER)
src/plugins/     filename order
```

A core file missing from `CORE_ORDER` fails the build. It used to be appended quietly,
which is how `SheetLayout` came to load after `Menu` without anyone noticing.

Note that migration *bundle* order is filename order, which is not necessarily the order
`runMigrations()` executes them in — the runner follows `ALL_MIGRATIONS`. That is fine,
because a migration file only declares a const, but do not read one as the other.

## Adapting it to your domain

`src/project/` is a two-sheet skeleton — `Settings` and `Localization` — that exists to show
the conventions, not to suggest a schema. Replacing it is the job, and
[docs/adapting-the-template.md](docs/adapting-the-template.md) is the order to do it in.

Three files are yours: `Config.js`, `SheetDefinitions.js` and `ReferenceSections.js`.
Everything in `src/core/` is generic and should not need editing.

## Examples

| Overlay | What it shows |
|---|---|
| [examples/game-config](examples/game-config) | A complete game-configuration domain: fourteen sheets, cross-sheet range validation, eight migrations including two that rewrite existing data, and a plugin that bulk-generates rows. Build it with `pnpm build:example`. |

An overlay replaces the project and migration layers while reusing the same core, so one
runtime can build several projects.

## Repository structure

```
gs-config-template/
├── src/
│   ├── core/                     template runtime, no project-specific references
│   │   ├── Core.js               spreadsheet access helpers
│   │   ├── Utilities.js          formatting, header notes, stripes, trimSheet_
│   │   ├── Validation.js         dropdowns, checkboxes
│   │   ├── SheetLayout.js        tab order and colours
│   │   ├── ProgressUI.js         long-task progress reporter
│   │   ├── MigrationRunner.js    runMigrations(), showMigrationStatus()
│   │   ├── HealthDashboard.js    showHealthDashboard()
│   │   ├── ReferenceSheet.js     generic _Reference renderer
│   │   ├── PluginApi.js          public facade for plugins
│   │   ├── PluginMenu.js         PLUGIN_MENU_ITEMS extension point
│   │   └── Menu.js               onOpen / onInstall
│   ├── project/                  the three files you rewrite
│   ├── migrations/               one file per migration, plus _template.js
│   └── plugins/                  generic plugins, plus _plugin_template.js
├── examples/game-config/         build overlay: project/, migrations/, plugins/
├── scripts/
│   ├── build.js                  produces dist/bundle.gs
│   ├── export-gs.js              produces one .gs file per source file
│   └── convert-ext.js            renames sources between .gs and .js
├── test/                         Jest suites and the Apps Script mock
└── docs/
```

## Status

**0.1.0.** Below 1.0, and staying there until someone other than its author has built a
project from it. Three things worth knowing before you adopt it:

- **A bundle runs with your Google account's authority.** A container-bound Apps Script
  executes as whoever authorises it, and the runtime declares `UrlFetchApp` and `DriveApp`
  among its available globals because plugins may want them. Build your own bundle from
  sources you have read; do not paste one somebody sent you. See [SECURITY.md](SECURITY.md).
- **Coverage is not reported for `src/`.** The test harness loads sources with indirect
  `eval` to mirror the single global scope, and neither Jest coverage provider can see
  through that. The suites do exercise the runtime; nothing can measure it. Reporting zero
  would be worse than reporting nothing.
- **`examples/game-config/` is somebody's real domain**, not a stub. That is deliberate —
  forty working columns document the conventions better than a paragraph — but it is not
  yours, and the adaptation guide assumes you delete it.

## Documentation

[Getting started](docs/getting-started.md) ·
[Adapting the template](docs/adapting-the-template.md) ·
[Architecture](docs/architecture.md) ·
[Migrations](docs/migrations.md) ·
[Sheet schemas](docs/sheet-schemas.md) ·
[Plugins](docs/plugins.md) ·
[Deploying](docs/deploying.md) ·
[Testing](docs/testing.md) ·
[Troubleshooting](docs/troubleshooting.md) ·
[Release process](docs/release-process.md)

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md),
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
