# Adapting the template

`src/project/` ships two sheets — `Settings` and `Localization` — and `examples/game-config/`
ships fourteen. Neither is your schema. This page is the order to replace them in.

The short version: three files are yours, everything in `src/core/` is not, and the
checkpoint that tells you the split is real is that the build still succeeds when the
project layer is empty.

## What you keep, what you replace

| | |
|---|---|
| `src/core/` (eleven files) | **Keep, unchanged.** Nothing in it names a sheet or a domain concept. If you find yourself editing it, that is worth an issue — either the boundary is wrong or there is a missing extension point. |
| `src/project/Config.js` | **Rewrite.** `PROJECT_NAME`, `MENU_TITLE`, `ALL_SHEET_NAMES`, `ALL_MIGRATIONS`, `SHEET_LAYOUT`, `EXPECTED_SHEET_SCHEMA` and the `repairAllSheets()` action list are all yours. |
| `src/project/SheetDefinitions.js` | **Rewrite the bodies, keep the shape.** The `createXxxSheet_` / `configureXxxSheet_` pairing is the convention; the sheets are not. |
| `src/project/ReferenceSections.js` | **Rewrite.** Plain data. The renderer is in core and does not change. |
| `src/migrations/` | **Replace** the initial setup migration with your own. Keep `_template.js`. |
| `src/plugins/plugin_auto_translate.js` | Keep if you have a Localization sheet with locale columns; delete otherwise. |
| `src/plugins/_plugin_template.js` | Keep. It is inert and excluded from the bundle. |
| `examples/` | **Delete**, once you have stopped referring to it. |
| `test/` | Keep. The suites test core and the bundler, not the domain. |

## The checklist

**1. Start from the template.**

```
gh repo create my-config --template deniscuciuc/gs-config-template --private --clone
cd my-config && pnpm install
```

**2. Name it.** In `src/project/Config.js`, set `PROJECT_NAME` (the health dashboard
header) and `MENU_TITLE` (the menu bar label). These are the two strings anyone using the
spreadsheet will see.

**3. Empty the project layer and build.**

```
pnpm build
```

Set `ALL_SHEET_NAMES` and `ALL_MIGRATIONS` to `[]`, empty `EXPECTED_SHEET_SCHEMA` and the
`repairAllSheets()` action list, and delete the bodies in `SheetDefinitions.js`. The build
must still succeed. This is the checkpoint: if it fails, something in core is reaching into
the domain, and that is a bug worth reporting rather than working around.

**4. Remove what you are not keeping.**

```
git rm -r examples
git rm src/migrations/202601010001_initial_setup.js
```

**5. Add your first sheet.** Follow [sheet-schemas.md](sheet-schemas.md). Write the
`createXxxSheet_` / `configureXxxSheet_` pair, add the entry to `EXPECTED_SHEET_SCHEMA`, add
the name to `ALL_SHEET_NAMES`, and add the create call to `repairAllSheets()`. Give every
column a header note — it is the only documentation your config editors will read.

**6. Write your first migration.** Copy `src/migrations/_template.js` to
`YYYYMMDDNNNN_initial_setup.js`, make `up()` call your create helpers, and register it in
`ALL_MIGRATIONS`. See [migrations.md](migrations.md) for the idempotency rule, which is the
one that matters.

**7. Rewrite `ReferenceSections.js`.** Document the formats and enumerations that a column
header cannot express: key conventions, value syntax, what each enum member means.

**8. Test it against a real spreadsheet.**

```
pnpm verify
```

Then load `dist/bundle.gs` into a scratch spreadsheet and run **Run Migrations** before you
point it at anything that matters. Run it twice — the second run must be a no-op.

**9. Make the repository yours.** Replace `README.md`, `CHANGELOG.md` and `SECURITY.md`
with your own, adjust `CODEOWNERS`, and delete this file. Keep `CONTRIBUTING.md` if other
people will touch the config; most of it is about the runtime rather than this project.

## Keeping up with the template

There is no upgrade path, because there is no dependency — you copied the code. What there
is instead is a clean diff, as long as you have not edited `src/core/`:

```
git remote add template https://github.com/deniscuciuc/gs-config-template.git
git fetch template
git diff HEAD template/main -- src/core/ scripts/
```

If that diff is confined to `src/core/` and `scripts/`, it applies cleanly. That is the
entire reason for the rule in step 2 of `CONTRIBUTING.md`, and the reason core carries no
domain references.

Releases attach a built bundle, so you can also just read
[the release notes](https://github.com/deniscuciuc/gs-config-template/releases) and decide
whether a change is worth porting.

## Things that will bite you

- **Two files cannot declare the same top-level name.** One global scope, one namespace. A
  collision is a syntax error for the entire bundle, not a scoped shadow.
- **A migration that is not idempotent will destroy data on its second run**, and the
  history sheet will not save you — it records *that* a migration ran, not what it did. If
  a migration is half-applied and you fix it and re-run, the parts that already succeeded
  run again.
- **`onOpen` runs with restricted authorisation the first time.** The menu may appear
  before the script is allowed to touch anything; the first click is what triggers the
  consent prompt.
- **The bundle is not the source of truth.** Editing it in the Apps Script editor works
  until the next `pnpm build` overwrites it. Change `src/`, rebuild, re-paste.
- **`Remove All Sheets` and `Reset to Defaults` do what they say.** They are in the menu
  because they are genuinely useful during development. They are also one click away from
  the config your product is running on.
