/**
 * Plugin template — copy this file, rename to plugin_<short_name>.js
 *
 * A plugin is a self-contained .js file that:
 *   1. Implements one or more top-level functions to do work.
 *   2. Registers them in the spreadsheet menu by pushing onto PLUGIN_MENU_ITEMS.
 *
 * Use only the public API documented in src/core/PluginApi.js:
 *   getSpreadsheet, getSheet, getOrCreateSheet, showAlert,
 *   beginProgress, readRows, writeRows, upsertRowsByKey, ensureColumn,
 *   translateBatch
 *
 * Do NOT rely on private helpers (anything ending in _) — those may change.
 */

// function helloWorldPlugin() {
//   const p = beginProgress('Hello world', 3);
//   p.update(1, 'reading rows');
//   const rows = readRows('Games');
//   p.update(2, 'computing');
//   p.update(3, 'done');
//   p.finish('All good');
//   showAlert('Hello plugin', 'Found ' + rows.length + ' games.');
// }
//
// PLUGIN_MENU_ITEMS.push({
//   label: 'Hello plugin',
//   functionName: 'helloWorldPlugin',
//   section: 'Examples',
// });
