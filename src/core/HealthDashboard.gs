/**
 * HealthDashboard.gs — renders a one-page summary of config health.
 *
 * Shows: migration counts, sheet presence vs ALL_SHEET_NAMES, row counts,
 * and last validation result. Uses a hidden __Health sheet that is
 * regenerated on every call.
 */

const HEALTH_SHEET_NAME = '__Health';

function showHealthDashboard() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(HEALTH_SHEET_NAME);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(HEALTH_SHEET_NAME);

  var rows = [];
  rows.push(['Quality Game Core — Config Health', '', '', '']);
  rows.push(['Generated', new Date().toISOString(), '', '']);
  rows.push(['', '', '', '']);

  // Migrations
  var registered = (typeof ALL_MIGRATIONS !== 'undefined' && Array.isArray(ALL_MIGRATIONS))
    ? ALL_MIGRATIONS
    : [];
  var applied = getAppliedMigrationIds_();
  var pending = registered.filter(function (m) { return !applied.has(m.id); });
  rows.push(['Migrations', '', '', '']);
  rows.push(['  Registered', registered.length, '', '']);
  rows.push(['  Applied', applied.size, '', '']);
  rows.push(['  Pending', pending.length, pending.length === 0 ? '✅' : '⏳', '']);
  rows.push(['', '', '', '']);

  // Sheet presence
  rows.push(['Sheets', 'Present', 'Rows', 'Status']);
  var expected = (typeof ALL_SHEET_NAMES !== 'undefined' && Array.isArray(ALL_SHEET_NAMES))
    ? ALL_SHEET_NAMES
    : [];
  for (var i = 0; i < expected.length; i++) {
    var name = expected[i];
    var s = ss.getSheetByName(name);
    rows.push([
      '  ' + name,
      s ? '✅' : '❌',
      s ? Math.max(0, s.getLastRow() - 1) : 0,
      s ? 'OK' : 'MISSING',
    ]);
  }
  rows.push(['', '', '', '']);

  // Validation summary
  var validationErrors = [];
  try {
    if (typeof collectValidationErrors_ === 'function') {
      validationErrors = collectValidationErrors_();
    }
  } catch (e) {
    validationErrors = ['validation failed: ' + (e && e.message ? e.message : e)];
  }
  rows.push(['Validation', validationErrors.length === 0 ? '✅ pass' : '❌ ' + validationErrors.length + ' error(s)', '', '']);
  for (var k = 0; k < Math.min(validationErrors.length, 50); k++) {
    rows.push(['  ' + validationErrors[k], '', '', '']);
  }
  if (validationErrors.length > 50) {
    rows.push(['  …and ' + (validationErrors.length - 50) + ' more', '', '', '']);
  }

  sheet.getRange(1, 1, rows.length, 4).setValues(rows);
  sheet
    .getRange(1, 1, 1, 4)
    .merge()
    .setFontWeight('bold')
    .setFontSize(14)
    .setBackground(SECTION_BG)
    .setFontColor(SECTION_FG)
    .setHorizontalAlignment('center');
  sheet.setColumnWidth(1, 320);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 200);
  sheet.setFrozenRows(2);
  trimSheet_(sheet, rows.length, 4);
  ss.setActiveSheet(sheet);
}
