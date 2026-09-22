/**
 * PluginApi.gs — public template facade exposed to plugin scripts.
 *
 * Plugins SHOULD call only functions documented here. Functions with a trailing
 * underscore are private and may break between versions.
 *
 * Public API (stable):
 *   getSpreadsheet(), getSheet(name), getOrCreateSheet(name)
 *   showAlert(title, message)
 *   beginProgress(label, total)  → { update(i, msg), finish(msg) }
 *   readRows(sheetName)          → array of row objects keyed by header
 *   writeRows(sheetName, rows)   → bulk replace data rows
 *   upsertRowsByKey(sheetName, keyColumn, rows)
 *   ensureColumn(sheetName, columnName, defaultValue)
 *   translateBatch(texts, sourceLang, targetLang)
 */

function beginProgress(label, total) {
  return beginProgress_(label, total);
}

function readRows(sheetName) {
  var sheet = getSheet(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[String(headers[j])] = values[i][j];
    }
    row._row = i + 1;
    out.push(row);
  }
  return out;
}

/**
 * Replace all data rows (keeps header). rows = array of arrays in header order.
 */
function writeRows(sheetName, rows) {
  var sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  var lastCol = sheet.getLastColumn();
  var existingRows = Math.max(0, sheet.getLastRow() - 1);
  if (existingRows > 0) {
    sheet.getRange(2, 1, existingRows, lastCol).clearContent();
  }
  if (rows && rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

/**
 * Upsert rows keyed by a column. rows is an array of plain objects keyed by header.
 * Existing rows with matching key are updated in place; new rows are appended.
 */
function upsertRowsByKey(sheetName, keyColumn, rows) {
  var sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('Sheet has no header row: ' + sheetName);
  var headerVals = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var keyIdx = headerVals.indexOf(keyColumn);
  if (keyIdx < 0) throw new Error('Key column not found: ' + keyColumn);

  var existing = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var keyToRow = {};
  for (var i = 0; i < existing.length; i++) {
    var k = String(existing[i][keyIdx]);
    if (k) keyToRow[k] = i;
  }

  var appended = 0;
  var updated = 0;
  for (var r = 0; r < rows.length; r++) {
    var input = rows[r];
    var key = String(input[keyColumn]);
    var rowArr = headerVals.map(function (h) {
      return Object.prototype.hasOwnProperty.call(input, h) ? input[h] : '';
    });
    if (Object.prototype.hasOwnProperty.call(keyToRow, key)) {
      existing[keyToRow[key]] = rowArr;
      updated++;
    } else {
      existing.push(rowArr);
      appended++;
    }
  }

  if (existing.length > 0) {
    sheet.getRange(2, 1, existing.length, lastCol).setValues(existing);
  }
  return { updated: updated, appended: appended };
}

function ensureColumn(sheetName, columnName, defaultValue) {
  var sheet = getSheet(sheetName);
  if (!sheet) return false;
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return false;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf(columnName) >= 0) return false;
  var newCol = lastCol + 1;
  sheet.insertColumnAfter(lastCol);
  sheet.getRange(1, newCol).setValue(columnName);
  applyHeader_(sheet, newCol);
  var dataRows = sheet.getLastRow() - 1;
  if (dataRows > 0 && defaultValue !== undefined) {
    sheet.getRange(2, newCol, dataRows, 1).setValue(defaultValue);
  }
  return true;
}

/**
 * Batch translate via Google's built-in LanguageApp. Returns array of translations
 * aligned with input texts. Empty inputs produce empty outputs without API calls.
 * Errors per item are swallowed and replaced with '' to avoid aborting batch jobs.
 */
function translateBatch(texts, sourceLang, targetLang) {
  if (!texts || texts.length === 0) return [];
  var out = [];
  for (var i = 0; i < texts.length; i++) {
    var t = texts[i];
    if (!t || String(t).trim() === '') {
      out.push('');
      continue;
    }
    try {
      out.push(LanguageApp.translate(String(t), sourceLang || '', targetLang));
    } catch (e) {
      Logger.log('translateBatch error idx=' + i + ': ' + e);
      out.push('');
    }
  }
  return out;
}
