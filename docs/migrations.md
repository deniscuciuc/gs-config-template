# Migrations

Every change to the config schema or its seed data is a migration: a file declaring an id, a
description and an idempotent `up()`. `runMigrations()` applies the ones that have not run
and records them in a hidden `__MigrationsHistory` sheet.

The runner contains no logic of its own. It iterates `ALL_MIGRATIONS`, skips ids already in
history, runs the rest, and stops at the first failure. There are no pre-flight checks, no
seeds outside `up()`, and no special cases — which is what makes its behaviour predictable
when something goes wrong.

## Writing one

Copy `src/migrations/_template.js`:

```javascript
const migration_202601020001_add_feature_flags = {
  id: '202601020001_add_feature_flags',
  description: 'Add the feature-flag rows to Settings.',
  up: function () {
    createSettingsSheet_();
    upsertRowsByKey('Settings', 'Key', [
      { Key: 'feature.signup.enabled', Value: 'TRUE', Type: 'boolean', IsActive: true },
    ]);
  },
};
```

Then register it in `ALL_MIGRATIONS` in `src/project/Config.js`. A migration that is not
registered does not exist — the file being present changes nothing.

## The id convention

`YYYYMMDDNNNN_short_description`: a UTC date and a four-digit sequence for same-day ordering.
The filename must match the id, and ids should ascend.

Ascending ids are a readability rule rather than a correctness one, and it is worth being
precise about why:

- **`ALL_MIGRATIONS` order is execution order.** The runner follows the array.
- **Filename order is bundle order.** `scripts/build.js` sorts migration files by name.

These are allowed to differ, and nothing breaks when they do, because a migration file only
declares a const. But a bundle whose order contradicts the execution order is a bundle that
misleads whoever reads it next, so keep them in agreement.

## Idempotency

**`up()` must be safe to run twice.** This is the rule that actually matters, and the
history sheet does not enforce it — history records *that* a migration ran, not what it did.
The moment a migration fails halfway, you fix it and re-run, and everything that already
succeeded runs a second time.

So:

- Use `createXxxSheet_()`, which creates only if absent.
- Use `upsertRowsByKey()` rather than appending.
- Use `ensureColumn()` rather than `insertColumnAfter()`.
- Do not call `runMigrations()` or another migration's `up()`.

Test it by running the migration twice against a scratch spreadsheet. The second run should
change nothing.

## What happens on failure

`runMigrations()` stops at the first error and shows an alert listing what was applied
before the failure. Migrations that succeeded are already recorded in history and will not
re-run. The failed one is not recorded, so after you fix it the next run picks up from
exactly that point.

This is why partial application is survivable and why idempotency is non-negotiable: the
failed migration will be re-run from the top, including whatever part of it succeeded.

## History

`__MigrationsHistory` is hidden, and has four columns:

| Column | Meaning |
|---|---|
| `MigrationId` | The id, matched exactly |
| `Description` | Copied from the migration at the time it ran |
| `AppliedAtUtc` | ISO timestamp |
| `AppliedBy` | The Google account that ran it, or `unknown` |

To force a migration to re-run, delete its row. To mark one as applied without running it,
add a row with its id. Both are legitimate; both are also how people get into trouble, so
check `Migration Status` afterwards.

Unhiding the sheet: right-click any tab, choose **Show all sheets**, or use the sheet list.

## Renaming and squashing

Changing a migration's id makes it a new migration — every spreadsheet that already ran the
old one will run the new one. On a config store that has been deployed anywhere, do not
rename; add a follow-up migration instead.

Squashing is only safe before a migration has reached anything you care about. The example
overlay was squashed and renumbered before the first release, which was fine because it had
no users; the same edit against a live spreadsheet would have re-run eight migrations.

## Checking state

**Migration Status** lists every registered migration as applied or pending.
**Health Dashboard** adds sheet presence and validation errors to that, written into a
`__Health` sheet. Both are read-only.
