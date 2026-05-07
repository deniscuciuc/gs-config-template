# gs-config-template

> Reusable Google Sheets config template — EF Core-style migrations, typed
> sheet schemas, plugin system, health dashboard. Drop the bundle into Apps
> Script and ship.

## What is this?

A reusable Google Apps Script template for projects that use a Google Sheet as
a lightweight app/game configuration store. It provides an EF Core-inspired
migration runner with a hidden `__MigrationsHistory` sheet, typed schemas with
**header notes (column documentation)**, dropdowns, and checkboxes for every
column, a pluggable extension system for one-off scripts, and CI-ready tooling
(Biome lint + Jest tests + single-file bundle build). After importing the
bundle you get a production-ready `⚙️ Sheet Config` menu out of the box.

## Features

- **Migration runner** — pure runner; every change is an idempotent `up()`
  recorded in `__MigrationsHistory`.
- **Idempotent sheet creation** — `createXxxSheet_()` / `configureXxxSheet_()`
  pairs you can safely call any time.
- **Typed schemas with column docs** — every column has a header **note**
  rendered in-sheet via `applyHeaderNotes_()`, plus column widths, dropdowns,
  checkboxes, and cross-sheet range validation.
- **Data-driven `_Reference` sheet** — sections defined as plain data,
  rendered with one generic loop.
- **Plugin system** — drop a `.gs` file in `src/plugins/`, push to
  `PLUGIN_MENU_ITEMS`, and it appears in the menu.
- **Auto-translate** — bundled plugin uses Google's `LanguageApp` to fill
  missing translations (no API key required).
- **Health dashboard** — one-click `__Health` sheet summarising migration
  state, sheet presence, and validation errors.
- **Progress reporter** — long-running tasks update a hidden `__Progress`
  sheet.
- **CI-ready** — Biome for lint/format, Jest for unit tests, single-file
  `dist/bundle.gs` build artefact via the shared `typescript-mini` pipeline.

## Project structure

```
gs-config-templates/
├── README.md
├── package.json                  # biome + jest + build scripts (no runtime deps)
├── biome.json                    # lint + format config
├── .gitlab-ci.yml                # extends shared typescript-mini pipeline
├── .gitignore
├── docs/
│   └── PLUGIN_AUTHORING.md       # public API + plugin authoring guide
├── .github/
│   └── agents/
│       └── gs-config-plugin-author.agent.md   # Copilot agent for plugin authoring
├── src/
│   ├── core/                     # template runtime, zero project-specific refs
│   │   ├── Core.gs               # spreadsheet access helpers
│   │   ├── Utilities.gs          # formatting, stripes, header, trimSheet_
│   │   ├── Validation.gs         # dropdowns, checkboxes
│   │   ├── ProgressUI.gs         # long-task progress reporter
│   │   ├── MigrationRunner.gs    # runMigrations(), showMigrationStatus()
│   │   ├── HealthDashboard.gs    # showHealthDashboard()
│   │   ├── PluginApi.gs          # public facade for plugins
│   │   ├── PluginMenu.gs         # PLUGIN_MENU_ITEMS extension point
│   │   └── Menu.gs               # onOpen / onInstall
│   ├── project/
│   │   ├── Config.gs             # ALL_SHEET_NAMES, ALL_MIGRATIONS, validation
│   │   ├── SheetDefinitions.gs   # createXxx/configureXxx for every sheet
│   │   └── ReferenceSheet.gs     # data-driven _Reference renderer
│   ├── migrations/               # one .gs per migration, chronological
│   │   ├── _template.gs
│   │   └── 2026…_*.gs
│   └── plugins/
│       ├── _plugin_template.gs
│       ├── plugin_auto_translate.gs
│       └── example_generate_tournaments.gs
├── test/
│   ├── migrationRunner.test.js
│   ├── utilities.test.js
│   └── __mocks__/
│       ├── SpreadsheetApp.js     # minimal GAS mock
│       └── loader.js             # concatenates + evaluates .gs files
└── scripts/
    └── build.js                  # produces dist/bundle.gs
```

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@10 --activate`)
- Optional: [`clasp`](https://github.com/google/clasp) for `clasp push` to
  Apps Script.

### Local workflow

```bash
pnpm install
pnpm lint        # biome check (lint + format)
pnpm test        # jest
pnpm build       # writes dist/bundle.gs
pnpm ci          # lint + test + build
```

### Deploy to Apps Script

1. Run `pnpm build` — produces `dist/bundle.gs`.
2. Open your spreadsheet → **Extensions → Apps Script**.
3. Replace the contents of any single `.gs` file with `dist/bundle.gs`.
4. Reload the spreadsheet — the `⚙️ Sheet Config` menu appears.
5. Click **Run Migrations** to materialise all sheets.

Or with clasp:

```bash
clasp push --force   # after running pnpm build
```

For multi-environment auto-deploy (dev/staging/prod) see
[ci-templates/pipelines/gas-clasp-deploy.yml](../ci-templates/pipelines/gas-clasp-deploy.yml).

## How migrations work

1. Copy `src/migrations/_template.gs` → `YYYYMMDDNNNN_short_description.gs`.
2. Implement `up()`. **Must be idempotent**: safe to re-run on any state.
   Call only `create*`, `configure*`, `seed*`, `upsert*`, `ensure*` helpers.
3. Register the exported const in `ALL_MIGRATIONS` in
   [src/project/Config.gs](src/project/Config.gs).
4. Run via menu: **⚙️ Sheet Config → Run Migrations**.
5. Applied migrations are recorded in the hidden `__MigrationsHistory`
   sheet (`MigrationId | Description | AppliedAtUtc | AppliedBy`).
6. On error, `runMigrations()` shows an alert with the partial log and
   stops — fix the migration and re-run.

`runMigrations()` is a pure runner: it iterates `ALL_MIGRATIONS`, skips
ids in history, runs the rest. There is **no** pre-flight logic anywhere.

## Adding a new sheet

1. Add the name to `ALL_SHEET_NAMES` in
   [src/project/Config.gs](src/project/Config.gs).
2. Add `createXxxSheet_()` + `configureXxxSheet_()` to
   [src/project/SheetDefinitions.gs](src/project/SheetDefinitions.gs).
   **Always include header notes** via `applyHeaderNotes_(sheet, [...])` —
   one note per column documenting required/unique/format/foreign-key info.
3. Add the schema entry to `EXPECTED_SHEET_SCHEMA` so `validateAllSheets()`
   covers it.
4. Add the create call to the `repairAllSheets()` action list.
5. Create a migration whose `up()` calls `createXxxSheet_()` (and seeds if
   needed). Register it in `ALL_MIGRATIONS`.

## Column documentation (header notes)

Every column must carry a one-line note explaining its purpose and constraints.
Notes appear as a hover tooltip on the header cell in the spreadsheet, so
end-users editing config never have to dig through code.

```javascript
applyHeaderNotes_(sheet, [
  'Slug game id (lowercase, hyphenated). Required, unique. Referenced by Tournaments.',
  'Display name shown to players.',
  'Game genre (Casual, Puzzle, Card, Slots, Other).',
  'Checkbox. Uncheck to disable without deleting.',
  'Free-form notes.',
]);
```

The list length must match the header row exactly. See examples in
[src/project/SheetDefinitions.gs](src/project/SheetDefinitions.gs).

## Plugins

Plugins are user-authored `.gs` files in `src/plugins/` that hook custom
actions into the menu. See [docs/PLUGIN_AUTHORING.md](docs/PLUGIN_AUTHORING.md)
for the public API and authoring rules.

Bundled examples:

- **`plugin_auto_translate.gs`** — fills missing Localization translations via
  Google's built-in `LanguageApp` (no API key, no per-row API calls).
- **`example_generate_tournaments.gs`** — bulk-generates monthly tournaments
  for every enabled game.

Menu wiring is automatic — push to `PLUGIN_MENU_ITEMS`:

```javascript
PLUGIN_MENU_ITEMS.push({
  label: 'Auto-translate missing locales',
  functionName: 'autoTranslateMissingLocales',
  section: 'Localization',
});
```

## CI setup (GitLab)

`.gitlab-ci.yml` extends the shared `typescript-mini` pipeline. The pipeline
runs three jobs on every push:

| Stage    | Command       | Notes                                   |
| -------- | ------------- | --------------------------------------- |
| validate | `pnpm lint`   | Biome lint + format check               |
| build    | `pnpm build`  | Produces `dist/bundle.gs` (30d artifact)|
| test     | `pnpm test`   | Jest unit tests                         |

## Design principles

- **Migrations are the source of truth.** Manual sheet edits drift; if it
  matters, it goes in a migration.
- **Every `up()` is idempotent.** Re-running must be a no-op once applied.
- **`runMigrations()` is a pure runner.** Zero business logic, zero
  pre-flight checks, zero seed calls outside `up()`.
- **Core is project-agnostic.** Files under `src/core/` contain no sheet
  names, no domain catalogs, no seed data.
- **Public API is small and stable.** Plugins call only what's exported in
  `PluginApi.gs`. Anything ending in `_` is private.
- **Batch reads/writes.** Never read/write single cells in loops — always
  one `getValues()` / `setValues()`.
- **Document every column.** Each schema entry must include a header note.
