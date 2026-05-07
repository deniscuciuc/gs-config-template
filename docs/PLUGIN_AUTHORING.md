# Plugin authoring guide

A **plugin** is a self-contained `.gs` file dropped into `src/plugins/` that:

1. Implements one or more top-level functions to perform a task.
2. Registers them in the spreadsheet menu by pushing onto `PLUGIN_MENU_ITEMS`.

Plugins ship in the same bundle as the template core but are conceptually
separate from migrations:

| When to use a **plugin**                           | When to use a **migration**                                          |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| One-off operations (bulk seed, wizard, generators) | Permanent schema or data changes that must run once on every install |
| Run on demand from the menu                        | Run automatically by `runMigrations()`                               |
| Not tracked in history                             | Tracked in `__MigrationsHistory`                                     |

If in doubt: **persistent change → migration**, **on-demand utility → plugin**.

## Public API

Plugins must call only the public template facade in
[src/core/PluginApi.gs](../src/core/PluginApi.gs):

| Function                                                           | Purpose                                              |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| `getSpreadsheet()` / `getSheet(name)` / `getOrCreateSheet(name)`   | Sheet access                                         |
| `showAlert(title, message)`                                        | Modal dialog                                         |
| `beginProgress(label, total)` → `{ update(i, msg), finish(msg) }`  | Progress UI written to hidden `__Progress` sheet     |
| `readRows(sheetName)`                                              | Returns array of header-keyed row objects            |
| `writeRows(sheetName, rows)`                                       | Bulk replace data rows (header preserved)            |
| `upsertRowsByKey(sheetName, keyColumn, rows)`                      | Idempotent upsert by key column                      |
| `ensureColumn(sheetName, name, defaultValue)`                      | Add a column if missing                              |
| `translateBatch(texts, src, target)`                               | Batch translation via `LanguageApp`                  |

Functions ending in `_` are **private** — they may be renamed or removed
without notice. Do not call them from plugins.

## Menu registration

```javascript
PLUGIN_MENU_ITEMS.push({
  label: 'My plugin',
  functionName: 'myPlugin',
  section: 'Examples', // optional — groups items into a sub-menu
});
```

Items without a `section` appear flat under the main menu.

## Hello-world skeleton

```javascript
function myPlugin() {
  const p = beginProgress('My plugin', 3);
  p.update(1, 'reading rows');
  const games = readRows('Games');
  p.update(2, 'writing back');
  upsertRowsByKey('Tournaments', 'Id', [
    { Id: 'demo', Name: 'Demo', GameId: games[0]?.Id ?? '', IsEnabled: true },
  ]);
  p.update(3, 'done');
  p.finish('All good');
  showAlert('My plugin', 'Upserted demo tournament.');
}

PLUGIN_MENU_ITEMS.push({
  label: 'My plugin',
  functionName: 'myPlugin',
  section: 'Examples',
});
```

## Worked example — auto-translate

See [src/plugins/plugin_auto_translate.gs](../src/plugins/plugin_auto_translate.gs)
for a real-world plugin that fills missing Localization translations using the
built-in `LanguageApp` service. Highlights:

- Reads the entire sheet with **one** `getValues()` call.
- Translates only cells where the source (`en`) is set and the target is empty.
- Writes everything back with **one** `setValues()` call.
- Uses `translateBatch()` so per-cell errors don't abort the run.

## Hard rules

1. **Idempotent**: re-running the plugin must not duplicate data or corrupt
   sheets. Use `upsertRowsByKey` and `ensureColumn`.
2. **Batch reads/writes**: never read or write a single cell inside a hot
   loop — combine into `getValues()` / `setValues()`.
3. **Show progress**: any plugin processing more than ~50 rows or making
   network calls (e.g. `LanguageApp`) must call `beginProgress`.
4. **Don't run migrations**: plugins must not call `runMigrations()` or
   another migration's `up()` directly.

## AI assistance

A Copilot agent that knows these rules ships with the template at
[.github/agents/gs-config-plugin-author.agent.md](../.github/agents/gs-config-plugin-author.agent.md).
Invoke it from VS Code with `@gs-config-plugin-author` (or via the agent
picker) and describe the plugin you need; it will scaffold a file in
`src/plugins/` that complies with the API and rules above.
