/**
 * Auto-translate plugin — fills missing Localization translations via Google's
 * built-in LanguageApp service (no API key required).
 *
 * Reads the Localization sheet, finds rows where `en` is set but a target
 * column (ru, es) is empty, and fills them with translations.
 *
 * Strategy:
 *   - One getValues() then one setValues() — never per-row reads/writes.
 *   - translateBatch() handles per-cell errors gracefully.
 */

const AUTO_TRANSLATE_TARGETS = [
  { column: 'ru', code: 'ru' },
  { column: 'es', code: 'es' },
];

function autoTranslateMissingLocales() {
  var sheet = getSheet('Localization');
  if (!sheet) {
    showAlert('Auto-translate', 'Localization sheet not found.');
    return;
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) {
    showAlert('Auto-translate', 'No data rows to translate.');
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var enIdx = headers.indexOf('en');
  if (enIdx < 0) {
    showAlert('Auto-translate', 'Localization sheet has no "en" column.');
    return;
  }

  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var totalCells = 0;

  var p = beginProgress('Auto-translate', AUTO_TRANSLATE_TARGETS.length);
  for (var t = 0; t < AUTO_TRANSLATE_TARGETS.length; t++) {
    var target = AUTO_TRANSLATE_TARGETS[t];
    var colIdx = headers.indexOf(target.column);
    if (colIdx < 0) {
      p.update(t + 1, target.column + ' (no column, skip)');
      continue;
    }

    // Collect rows that need translation.
    var pending = [];
    for (var i = 0; i < data.length; i++) {
      var en = String(data[i][enIdx] || '').trim();
      var existing = String(data[i][colIdx] || '').trim();
      if (en && !existing) {
        pending.push({ row: i, text: en });
      }
    }
    if (pending.length === 0) {
      p.update(t + 1, target.column + ' (no missing)');
      continue;
    }

    var translations = translateBatch(
      pending.map(function (x) { return x.text; }),
      'en',
      target.code
    );
    for (var j = 0; j < pending.length; j++) {
      data[pending[j].row][colIdx] = translations[j] || '';
      if (translations[j]) totalCells += 1;
    }
    p.update(t + 1, target.column + ' (' + pending.length + ')');
  }

  // Single bulk write back.
  sheet.getRange(2, 1, data.length, lastCol).setValues(data);
  p.finish('Done');
  showAlert('Auto-translate', '✅ Filled ' + totalCells + ' missing cell(s).');
}

PLUGIN_MENU_ITEMS.push({
  label: 'Auto-translate missing locales',
  functionName: 'autoTranslateMissingLocales',
  section: 'Localization',
});
