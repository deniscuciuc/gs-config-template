# Example: game config

The configuration store for a mobile game backend — games, tournaments and their reward
tables, a fortune wheel, cyclic quests, avatars, a check-in calendar, admin permissions and
a localization table. Fourteen sheets and about a thousand lines.

```
pnpm build:example
```

Writes `dist/bundle.game-config.gs`, built from `src/core/` plus this directory.

## Why it is a real domain rather than a stub

Every convention the template has is easier to copy from working code than to learn from a
paragraph. A note on all forty-odd columns, `createXxx_`/`configureXxx_` pairs applied
consistently, a data-driven `_Reference` page, and foreign keys enforced in the spreadsheet
itself — this is what those look like at a size where they start to matter.

It is also not your domain, and it is the first thing to delete. See
[docs/adapting-the-template.md](../../docs/adapting-the-template.md).

## Worth looking at specifically

| File | Why |
|---|---|
| [project/SheetDefinitions.js](project/SheetDefinitions.js) | Fourteen create/configure pairs. `configureTournamentsSheet_` uses `applyDropdownRange_` to tie `GameId` to the `Games` sheet, so an invalid foreign key cannot be typed in. |
| [project/Config.js](project/Config.js) | A full `EXPECTED_SHEET_SCHEMA`, and a `SHEET_LAYOUT` that groups related tabs by colour. |
| [project/ReferenceSections.js](project/ReferenceSections.js) | Nine documentation sections rendered by one generic loop — reward formats, objective syntax, rarity tiers. |
| [migrations/202505030001_use_slug_game_ids.js](migrations/202505030001_use_slug_game_ids.js) | A data migration that rewrites existing rows and the references to them, rather than just creating a sheet. |
| [migrations/202505040001_remove_games_slug_column.js](migrations/202505040001_remove_games_slug_column.js) | Removing a column safely, as a follow-up to the migration above. |
| [plugins/example_generate_tournaments.js](plugins/example_generate_tournaments.js) | Bulk-generating rows across sheets from existing data, with progress reporting. |

## A note on the migration ids

These were renumbered before the first release so that filename order matches the order
`ALL_MIGRATIONS` executes them in. That was safe here because the example had no users.

Do not do it to a live config store: changing an id makes it a new migration, and every
spreadsheet that ran the old one will run the new one. See
[docs/migrations.md](../../docs/migrations.md).
