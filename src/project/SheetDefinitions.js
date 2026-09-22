/**
 * SheetDefinitions.js — typed schemas for every config sheet.
 *
 * Each sheet has two functions:
 *   createXxxSheet_()    — idempotent: creates the sheet if absent, sets header.
 *   configureXxxSheet_() — header notes, column widths, dropdowns, checkboxes.
 *
 * Seed data lives in MIGRATIONS, never in the create or configure helpers.
 *
 * The two sheets below are a starting skeleton, not a suggestion about your domain. They
 * exist to demonstrate the conventions — header notes on every column, a dropdown, a
 * checkbox — so replace them. `examples/game-config/` is the same conventions at real
 * scale, and docs/adapting-the-template.md is the order to do it in.
 */

// ─── shared helpers ───────────────────────────────────────────────

function _writeHeader_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeader_(sheet, headers.length);
  freezeHeader_(sheet);
}

// ─── Settings ────────────────────────────────────────────────────

const SETTING_TYPES = ['string', 'number', 'boolean', 'json'];

function createSettingsSheet_() {
  var sheet = getOrCreateSheet('Settings');
  _writeHeader_(sheet, ['Key', 'Value', 'Type', 'IsActive', 'Notes']);
  configureSettingsSheet_(sheet);
  return sheet;
}

function configureSettingsSheet_(sheet) {
  sheet = sheet || getSheet('Settings');
  if (!sheet) return;
  applyHeaderNotes_(sheet, [
    'Setting key in dotted lowercase, e.g. feature.signup.enabled. Required, unique.',
    'The value, written as text. Parse it according to Type.',
    'How to parse Value: string, number, boolean or json. Required.',
    'Checkbox. Uncheck to ignore the row without deleting it.',
    'Free-form note explaining what this setting controls.',
  ]);
  setColumnWidths_(sheet, [320, 360, 120, 100, 360]);
  var rows = Math.max(1, sheet.getMaxRows() - 1);
  applyDropdownList_(
    sheet,
    2,
    3,
    rows,
    SETTING_TYPES,
    false,
    'Pick one of: ' + SETTING_TYPES.join(', ')
  );
  applyCheckboxColumn_(sheet, 2, 4, rows);
  trimSheet_(sheet, Math.max(2, sheet.getLastRow()), 5);
}

// ─── Localization ────────────────────────────────────────────────

function createLocalizationSheet_() {
  var sheet = getOrCreateSheet('Localization');
  _writeHeader_(sheet, ['Key', 'en', 'ru', 'Notes']);
  configureLocalizationSheet_(sheet);
  return sheet;
}

function configureLocalizationSheet_(sheet) {
  sheet = sheet || getSheet('Localization');
  if (!sheet) return;
  applyHeaderNotes_(sheet, [
    'Localization key, e.g. ui.menu.play. Required, unique.',
    'English source string. Required — the auto-translate plugin reads this column.',
    'Russian translation. Leave blank and run the auto-translate plugin to fill it.',
    'Free-form note for translators.',
  ]);
  setColumnWidths_(sheet, [320, 360, 360, 240]);
  trimSheet_(sheet, Math.max(2, sheet.getLastRow()), 4);
}
