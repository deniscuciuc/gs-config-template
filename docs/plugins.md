# Plugins

A plugin is a self-contained file dropped into `src/plugins/` that implements one or more
top-level functions and registers them in the spreadsheet menu by pushing onto
`PLUGIN_MENU_ITEMS`.

Plugins ship in the same bundle as the core but are a different thing from migrations:

| Use a plugin | Use a migration |
|---|---|
| One-off operations: bulk seeds, wizards, generators | Permanent schema or data changes that must run once on every install |
| Run on demand from the menu | Run automatically by `runMigrations()` |
| Not tracked in history | Tracked in `__MigrationsHistory` |

If in doubt: a persistent change is a migration, an on-demand utility is a plugin.

## Public API

Plugins call only the facade in [src/core/PluginApi.js](../src/core/PluginApi.js):

| Function | Purpose |
|---|---|
| `getSpreadsheet()` · `getSheet(name)` · `getOrCreateSheet(name)` | Sheet access |
| `showAlert(title, message)` | Modal dialog |
| `beginProgress(label, total)` → `{ update(i, msg), finish(msg) }` | Progress written to the hidden `__Progress` sheet |
| `readRows(sheetName)` | Array of header-keyed row objects |
| `writeRows(sheetName, rows)` | Bulk replace data rows, header preserved |
| `upsertRowsByKey(sheetName, keyColumn, rows)` | Idempotent upsert by key column |
| `ensureColumn(sheetName, name, defaultValue)` | Add a column if missing |
| `translateBatch(texts, src, target)` | Batch translation via `LanguageApp` |

Functions ending in `_` are private and may be renamed or removed without notice. The rule
is not decoration: the bundle puts everything in one global scope, so a plugin *can* reach
any internal helper, and nothing but this convention stops it breaking on the next release.

## Menu registration

```javascript
PLUGIN_MENU_ITEMS.push({
  label: 'My plugin',
  functionName: 'myPlugin',
  section: 'Examples', // optional — groups items into a sub-menu
});
```

Items without a `section` appear flat under the main menu.

## Skeleton

Copy [src/plugins/_plugin_template.js](../src/plugins/_plugin_template.js), which the build
excludes by name, or start from this:

```javascript
function myPlugin() {
  var p = beginProgress('My plugin', 3);
  p.update(1, 'reading rows');
  var settings = readRows('Settings');
  p.update(2, 'writing back');
  upsertRowsByKey('Settings', 'Key', [
    { Key: 'feature.demo.enabled', Value: 'TRUE', Type: 'boolean', IsActive: true },
  ]);
  p.update(3, 'done');
  p.finish('All good');
  showAlert('My plugin', 'Upserted ' + settings.length + ' setting(s).');
}

PLUGIN_MENU_ITEMS.push({
  label: 'My plugin',
  functionName: 'myPlugin',
  section: 'Examples',
});
```

## Worked examples

[src/plugins/plugin_auto_translate.js](../src/plugins/plugin_auto_translate.js) fills
missing Localization translations using the built-in `LanguageApp` service, with no API key
and no per-row network call. It:

- reads the entire sheet with one `getValues()` call
- translates only cells where the source (`en`) is set and the target is empty
- writes everything back with one `setValues()` call
- uses `translateBatch()` so a single failure does not abort the run

[examples/game-config/plugins/example_generate_tournaments.js](../examples/game-config/plugins/example_generate_tournaments.js)
is the other shape: bulk-generating rows across sheets from existing data.

## Hard rules

1. **Idempotent.** Re-running must not duplicate data or corrupt sheets. Use
   `upsertRowsByKey` and `ensureColumn` rather than appending.
2. **Batch reads and writes.** Never touch a single cell inside a loop. Apps Script charges
   a round trip for each call, and a per-row `setValue()` is the difference between one
   second and several minutes.
3. **Show progress.** Anything processing more than about fifty rows, or making network
   calls, must call `beginProgress` — Apps Script's UI is modal-only, so without it the
   sheet simply appears frozen.
4. **Do not run migrations.** Plugins must not call `runMigrations()` or another
   migration's `up()`.

## AI assistance

A Copilot agent that knows these rules ships with the template at
[.github/agents/gs-config-plugin-author.agent.md](../.github/agents/gs-config-plugin-author.agent.md).
Invoke it from VS Code with `@gs-config-plugin-author` and describe the plugin you need; it
scaffolds a file in `src/plugins/` that complies with the API and the rules above.
