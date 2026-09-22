# Troubleshooting

## The menu does not appear

The custom menu is built by `onOpen`, which runs when the spreadsheet loads — not when you
save the script. Reload the spreadsheet tab.

If it still does not appear:

- Check the Apps Script editor for a syntax error. A bundle that does not parse produces no
  menu and no obvious message in the spreadsheet. `pnpm build` parses the bundle before
  writing it, so this should only happen if you edited the code in the browser.
- Run `buildMainMenu_` manually from the editor's function dropdown. The error, if there is
  one, appears in the execution log.
- Check that you replaced the *whole* contents of `Code.gs`. A half-pasted bundle often
  parses and then behaves strangely.

## The menu appears but nothing happens when I click

The first click triggers Google's authorisation prompt. Accept it. `onOpen` runs in a
restricted mode where it may build a menu without yet being allowed to touch the document,
so the menu can exist before the script can do anything.

## A migration failed halfway

`runMigrations()` stops at the first failure and shows what was applied before it. Those are
recorded in history and will not run again. The failed one is not recorded.

Fix the migration, rebuild, re-paste, and run again. It will resume at the failed migration
— and will re-run everything inside that migration's `up()`, including the parts that
succeeded before the error. That is exactly why `up()` must be idempotent; see
[migrations.md](migrations.md).

## Migrations say they are applied but the sheets are wrong

History records *that* a migration ran, not what it did. Someone editing the sheet by hand
will not be noticed by the runner.

Use **Repair All Sheets**: it re-runs every create and configure helper, restoring headers,
widths, dropdowns and validation without touching data. Then **Validate All Sheets** to see
what is still off.

If a sheet is missing entirely from the repair, check it is in the `repairAllSheets()`
action list in `src/project/Config.js` — the easiest step to forget when adding a sheet.

## A migration should re-run

Delete its row from `__MigrationsHistory` (right-click a tab → **Show all sheets** to
unhide it) and run again. Confirm with **Migration Status** afterwards.

Do not renumber a migration to force this. Changing an id makes it a new migration for every
spreadsheet, including ones you did not mean to touch.

## The build fails with "not listed in CORE_ORDER"

You added a file to `src/core/` without saying where it loads. Add it to `CORE_ORDER` in
`scripts/build.js`, in the position it should be evaluated. This is deliberate: the bundle's
contract is a deterministic order, and silently appending is how `SheetLayout` once came to
load after `Menu`.

## The build fails with "is not parsable"

The concatenated bundle is not valid JavaScript. Usually one source file has a syntax error;
`pnpm lint:ci` will point at it.

The classic case in this codebase was a doc comment containing `*/` inside a sentence, which
closed the comment early. Watch for `*/` in prose — `create*/configure*` is the one that got
through.

## clasp push overwrites or duplicates files

`clasp push --force` replaces the remote contents. Without `rootDir` pointing at
`dist/gs`, it pushes the whole repository — including `examples/` and the template stubs,
which then collide in the shared global scope.

Set `rootDir` in `.clasp.json`, or use `.claspignore`. See [deploying.md](deploying.md).

## Two files declare the same name

One global scope, one namespace. A duplicate top-level `const` is a syntax error for the
entire bundle, not a scoped shadow — so the symptom is "nothing works", not "one thing
works oddly". `pnpm build` will refuse to write it.

## Sheets are in the wrong order

`SHEET_LAYOUT` is applied by **Reorder Sheets** and at the end of **Repair All Sheets**. If
it is empty, nothing moves. A sheet not listed there is placed after the listed ones.

## Hidden sheets are cluttering things

`__MigrationsHistory`, `__Progress` and `__Health` are hidden on purpose and regenerated as
needed. `__Health` and `__Progress` can be deleted freely. Deleting `__MigrationsHistory`
makes every migration pending again.
