/**
 * Config.js — project-specific configuration.
 *
 * This file, SheetDefinitions.js and ReferenceSections.js beside it are the only three
 * files you rewrite when adopting the template. Everything under src/core/ is generic and
 * should not need editing — if you find yourself changing it, that is worth an issue.
 *
 * Lists the sheets the template manages and the migrations it applies. Migrations run in
 * the order they appear in ALL_MIGRATIONS, which is not necessarily the order the files
 * are bundled in. See docs/migrations.md.
 */

/** Shown in the health dashboard header. */
const PROJECT_NAME = 'gs-config';

/** The custom menu label, as it appears in the Google Sheets menu bar. */
const MENU_TITLE = '⚙️ Sheet Config';

const ALL_SHEET_NAMES = ['Settings', 'Localization', '_Reference'];

const ALL_MIGRATIONS = [migration_202601010001_initial_setup];

/**
 * Desired tab order and optional tab colours.
 * Sheets not listed here will be placed after the listed ones:
 *   - sheets whose names start with '_' come next (sorted alphabetically)
 *   - any other unlisted sheets are appended last in their current order
 *
 * Each entry: { name: 'SheetName' }  — no colour
 *          or: { name: 'SheetName', color: '#4a86e8' }  — with tab colour
 */
const SHEET_LAYOUT = [{ name: 'Settings', color: '#4a86e8' }, { name: 'Localization' }];

/**
 * Expected per-sheet schema. Used by validateAllSheets() and repairAllSheets().
 * Each entry: { columns: string[], required: string[] }
 */
const EXPECTED_SHEET_SCHEMA = {
  Settings: {
    columns: ['Key', 'Value', 'Type', 'IsActive', 'Notes'],
    required: ['Key', 'Type'],
  },
  Localization: {
    columns: ['Key', 'en', 'ru', 'Notes'],
    required: ['Key', 'en'],
  },
};

// ─── Validation entry points ───────────────────────────────────────────

function collectValidationErrors_() {
  var ss = getSpreadsheet();
  var errors = [];
  Object.keys(EXPECTED_SHEET_SCHEMA).forEach(function (name) {
    var schema = EXPECTED_SHEET_SCHEMA[name];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      errors.push(name + ': sheet missing');
      return;
    }
    var lastCol = sheet.getLastColumn();
    if (lastCol < schema.columns.length) {
      errors.push(name + ': expected ' + schema.columns.length + ' columns, found ' + lastCol);
    }
    var headers = sheet.getRange(1, 1, 1, Math.max(lastCol, schema.columns.length)).getValues()[0];
    for (var i = 0; i < schema.columns.length; i++) {
      if (String(headers[i] || '').trim() !== schema.columns[i]) {
        errors.push(
          name +
            ' col ' +
            (i + 1) +
            ': expected "' +
            schema.columns[i] +
            '", found "' +
            headers[i] +
            '"'
        );
      }
    }
    // Required field check
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var data = sheet.getRange(2, 1, lastRow - 1, schema.columns.length).getValues();
      for (var r = 0; r < data.length; r++) {
        for (var c = 0; c < schema.required.length; c++) {
          var colIdx = schema.columns.indexOf(schema.required[c]);
          if (colIdx < 0) continue;
          var v = data[r][colIdx];
          if (v === '' || v === null || v === undefined) {
            errors.push(name + ' row ' + (r + 2) + ': "' + schema.required[c] + '" required');
          }
        }
      }
    }
  });
  return errors;
}

function validateAllSheets() {
  var errors = collectValidationErrors_();
  if (errors.length === 0) {
    showAlert('Validation', '✅ All sheets passed validation.');
    return;
  }
  var preview = errors.slice(0, 50).join('\n');
  var more = errors.length > 50 ? '\n…and ' + (errors.length - 50) + ' more' : '';
  showAlert('Validation — ' + errors.length + ' error(s)', preview + more);
}

/**
 * Re-runs createXxxSheet_/configureXxxSheet_ for every sheet to repair drift
 * (header order, dropdowns, column widths). Does not delete user data — uses
 * idempotent create helpers from SheetDefinitions.js.
 */
function repairAllSheets() {
  var actions = [
    { name: 'Settings', fn: createSettingsSheet_ },
    { name: 'Localization', fn: createLocalizationSheet_ },
    { name: '_Reference', fn: createReferenceSheet_ },
  ];
  var p = beginProgress_('Repairing sheets', actions.length);
  for (var i = 0; i < actions.length; i++) {
    p.update(i, actions[i].name);
    try {
      actions[i].fn();
    } catch (e) {
      p.finish('Failed at ' + actions[i].name);
      showAlert('Repair failed', actions[i].name + ': ' + e);
      return;
    }
  }
  p.finish('Done');
  applySheetLayout_(SHEET_LAYOUT);
  showAlert('Repair', '✅ Repaired ' + actions.length + ' sheet(s).');
}

function reorderSheets() {
  applySheetLayout_(SHEET_LAYOUT);
  showAlert('Reorder Sheets', '✅ Sheets reordered.');
}

function removeAllConfigSheets() {
  if (
    !showConfirm_('Remove All Sheets', 'Delete every config sheet AND clear migration history?')
  ) {
    return;
  }
  var ss = getSpreadsheet();
  var blank = ss.getSheetByName('Sheet1') || ss.insertSheet('Sheet1');
  ss.setActiveSheet(blank);
  ALL_SHEET_NAMES.forEach(function (n) {
    deleteSheetIfExists_(n);
  });
  deleteSheetIfExists_(MIGRATIONS_SHEET_NAME);
  deleteSheetIfExists_(PROGRESS_SHEET_NAME);
  deleteSheetIfExists_(HEALTH_SHEET_NAME);
  showAlert('Remove All', '✅ All config sheets removed.');
}

function resetAllToDefaults() {
  if (
    !showConfirm_(
      'Reset to Defaults',
      'This will DELETE all config data and re-apply every migration from scratch. Continue?'
    )
  ) {
    return;
  }
  var ss = getSpreadsheet();
  var blank = ss.getSheetByName('Sheet1') || ss.insertSheet('Sheet1');
  ss.setActiveSheet(blank);
  ALL_SHEET_NAMES.forEach(function (n) {
    deleteSheetIfExists_(n);
  });
  deleteSheetIfExists_(MIGRATIONS_SHEET_NAME);
  runMigrations();
}
