# Getting started

## Prerequisites

- Node.js 20.12 or newer
- pnpm 10 — `corepack enable && corepack prepare pnpm@10 --activate`
- A Google Sheet you are willing to experiment in

## Get the code

Click **Use this template** on GitHub, or:

```
gh repo create my-config --template deniscuciuc/gs-config-template --private --clone
cd my-config
pnpm install
```

## Build

```
pnpm build
```

That writes `dist/bundle.gs`: every source file concatenated in a fixed order, with the
result parsed before it is written. Nothing is transpiled and there are no runtime
dependencies, so the bundle is exactly the code you can read in `src/`.

## Load it into Apps Script

1. In your spreadsheet, choose **Extensions → Apps Script**.
2. Select the whole contents of the single `Code.gs` file and replace it with
   `dist/bundle.gs`.
3. Save, then reload the spreadsheet tab. The custom menu only appears on load.

You should now see a `⚙️ Sheet Config` menu. If you do not,
[troubleshooting.md](troubleshooting.md) starts with that case.

The other route is one file per source file, which is nicer if you expect to iterate:

```
pnpm export:gs
clasp push --force
```

See [deploying.md](deploying.md).

## Run the migrations

Choose **Sheet Config → Run Migrations**. The skeleton ships one migration, which creates
three sheets:

- `Settings` — a key/value table with a `Type` dropdown and an `IsActive` checkbox
- `Localization` — keys and locale columns
- `_Reference` — rendered documentation for both

Two hidden sheets appear alongside them. `__MigrationsHistory` records what has been
applied; `__Progress` is where long tasks report, since Apps Script cannot show a
non-blocking dialog.

Hover a header cell. Every column carries a note explaining what belongs in it — that is a
hard rule of this template rather than a nicety, because it is the only documentation the
people editing your config will ever see.

## Look around the menu

| Item | What it does |
|---|---|
| **Run Migrations** | Applies anything in `ALL_MIGRATIONS` not yet in history |
| **Migration Status** | Lists every migration as applied or pending |
| **Validate All Sheets** | Checks headers and required fields against `EXPECTED_SHEET_SCHEMA` |
| **Repair All Sheets** | Re-runs the create and configure helpers to fix drift, without touching data |
| **Reorder Sheets** | Applies `SHEET_LAYOUT` — tab order and colours |
| **Health Dashboard** | Regenerates `__Health`: migration counts, sheet presence, validation errors |
| **Remove All Sheets** | Deletes the config sheets and the migration history |
| **Reset to Defaults** | Deletes everything and re-applies every migration from scratch |

The last two ask for confirmation and then do exactly what they say. Use them on a scratch
spreadsheet.

## Make it yours

The skeleton is a demonstration, not a schema suggestion. Read
[adapting-the-template.md](adapting-the-template.md) next — it is the ordered checklist for
replacing `src/project/` with your own domain.
