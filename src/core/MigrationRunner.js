/**
 * MigrationRunner.gs — EF Core-style migration runner.
 *
 * RULES:
 *  1. runMigrations() iterates ALL_MIGRATIONS and runs pending ones — nothing else.
 *  2. Each migration.up() must be self-contained and idempotent.
 *  3. History tracked in hidden '__MigrationsHistory' sheet.
 *  4. On error: alert with partial log, stop (do not continue).
 */

const MIGRATIONS_SHEET_NAME = '__MigrationsHistory';
const MIGRATIONS_SHEET_COLS = 4;
const MIGRATIONS_SHEET_HEADERS = ['MigrationId', 'Description', 'AppliedAtUtc', 'AppliedBy'];

function ensureMigrationsHistorySheet_() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(MIGRATIONS_SHEET_NAME);
  if (sheet) return sheet;

  sheet = ss.insertSheet(MIGRATIONS_SHEET_NAME);
  sheet.getRange(1, 1, 1, MIGRATIONS_SHEET_COLS).setValues([MIGRATIONS_SHEET_HEADERS]);
  sheet
    .getRange(1, 1, 1, MIGRATIONS_SHEET_COLS)
    .setFontWeight('bold')
    .setBackground('#37474F')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(2, 360);
  sheet.setColumnWidth(3, 200);
  sheet.setColumnWidth(4, 200);
  sheet.hideSheet();
  trimSheet_(sheet, 2, MIGRATIONS_SHEET_COLS);
  return sheet;
}

function getAppliedMigrationIds_() {
  var sheet = ensureMigrationsHistorySheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var ids = [];
  for (var i = 0; i < values.length; i++) {
    var v = values[i][0];
    if (v) ids.push(String(v));
  }
  return new Set(ids);
}

function recordMigration_(id, description) {
  var sheet = ensureMigrationsHistorySheet_();
  sheet.appendRow([id, description, new Date().toISOString(), getActiveUserEmail_()]);
  var lastRow = sheet.getLastRow();
  trimSheet_(sheet, Math.max(2, lastRow), MIGRATIONS_SHEET_COLS);
}

function _getRegisteredMigrations_() {
  if (typeof ALL_MIGRATIONS === 'undefined' || !Array.isArray(ALL_MIGRATIONS)) {
    throw new Error('ALL_MIGRATIONS is not defined. Define it in project/Config.gs.');
  }
  return ALL_MIGRATIONS.slice();
}

function getPendingMigrations_() {
  var applied = getAppliedMigrationIds_();
  return _getRegisteredMigrations_().filter(function (m) {
    return !applied.has(m.id);
  });
}

function runMigrations() {
  var migrations = _getRegisteredMigrations_();
  var applied = getAppliedMigrationIds_();
  var pending = migrations.filter(function (m) {
    return !applied.has(m.id);
  });

  if (pending.length === 0) {
    showAlert('Migrations', '✅ Schema is up to date — no pending migrations.');
    return;
  }

  var progress = beginProgress_('Running migrations', pending.length);
  var done = [];
  for (var i = 0; i < pending.length; i++) {
    var m = pending[i];
    progress.update(i, m.id);
    try {
      m.up();
      recordMigration_(m.id, m.description);
      done.push('✅ ' + m.id);
    } catch (err) {
      var partial = done.length > 0 ? done.join('\n') : '(none)';
      progress.finish('Failed at ' + m.id);
      showAlert(
        'Migration failed',
        'Migration: ' +
          m.id +
          '\n\n' +
          'Applied before failure:\n' +
          partial +
          '\n\n' +
          'Error: ' +
          (err?.message ? err.message : err)
      );
      return;
    }
  }
  progress.finish('Done');
  showAlert('Migrations', '✅ Applied ' + done.length + ' migration(s):\n\n' + done.join('\n'));
}

function showMigrationStatus() {
  var migrations = _getRegisteredMigrations_();
  var applied = getAppliedMigrationIds_();
  var lines = [];
  var appliedCount = 0;
  var pendingCount = 0;
  for (var i = 0; i < migrations.length; i++) {
    var m = migrations[i];
    var marker = applied.has(m.id) ? '✅' : '⏳';
    if (applied.has(m.id)) appliedCount++;
    else pendingCount++;
    lines.push(marker + ' ' + m.id + ' — ' + m.description);
  }
  showAlert(
    'Migration Status',
    'Applied: ' + appliedCount + '   Pending: ' + pendingCount + '\n\n' + lines.join('\n')
  );
}
