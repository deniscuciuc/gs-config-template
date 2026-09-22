/**
 * Utilities.gs — formatting, header styling, sheet trimming.
 * Core module. Zero project-specific references.
 */

const HEADER_BG = '#4A86C8';
const HEADER_FG = '#FFFFFF';
const ROW_EVEN = '#FFFFFF';
const ROW_ODD = '#F3F6FA';
const SECTION_BG = '#2C5F8A';
const SECTION_FG = '#FFFFFF';

function applyHeader_(sheet, cols) {
  if (cols < 1) return;
  sheet
    .getRange(1, 1, 1, cols)
    .setFontWeight('bold')
    .setBackground(HEADER_BG)
    .setFontColor(HEADER_FG);
}

function applyHeaderNotes_(sheet, notes) {
  if (!notes || notes.length === 0) return;
  sheet.getRange(1, 1, 1, notes.length).setNotes([notes]);
}

function freezeHeader_(sheet) {
  sheet.setFrozenRows(1);
}

function applyStripes_(sheet, startRow, numRows, numCols) {
  if (numRows < 1 || numCols < 1) return;
  for (var i = 0; i < numRows; i++) {
    var bg = i % 2 === 0 ? ROW_EVEN : ROW_ODD;
    sheet.getRange(startRow + i, 1, 1, numCols).setBackground(bg);
  }
}

/**
 * Trim sheet to used dimensions while keeping at least 2 rows and the given column count.
 * Never throws — silently no-ops on bad input.
 */
function trimSheet_(sheet, usedRows, usedCols) {
  if (!sheet) return;
  var safeRows = Math.max(2, Number(usedRows) || 2);
  var safeCols = Math.max(1, Number(usedCols) || 1);
  try {
    var maxRows = sheet.getMaxRows();
    var maxCols = sheet.getMaxColumns();
    if (maxRows > safeRows) {
      sheet.deleteRows(safeRows + 1, maxRows - safeRows);
    }
    if (maxCols > safeCols) {
      sheet.deleteColumns(safeCols + 1, maxCols - safeCols);
    }
  } catch (e) {
    // ignore — trimming is best effort
  }
}

function hasDataInColumn_(sheet, column, startRow) {
  if (!sheet) return false;
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return false;
  var values = sheet.getRange(startRow, column, lastRow - startRow + 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] !== '' && values[i][0] !== null && values[i][0] !== undefined) {
      return true;
    }
  }
  return false;
}

function showAlert(title, message) {
  try {
    SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.log('[' + title + '] ' + message);
  }
}

function showConfirm_(title, message) {
  try {
    var ui = SpreadsheetApp.getUi();
    var resp = ui.alert(title, message, ui.ButtonSet.OK_CANCEL);
    return resp === ui.Button.OK;
  } catch (e) {
    return false;
  }
}

function rowsEqual_(rowA, rowB) {
  if (!rowA || !rowB) return false;
  if (rowA.length !== rowB.length) return false;
  for (var i = 0; i < rowA.length; i++) {
    var a = rowA[i] === undefined || rowA[i] === null ? '' : String(rowA[i]);
    var b = rowB[i] === undefined || rowB[i] === null ? '' : String(rowB[i]);
    if (a !== b) return false;
  }
  return true;
}

function setColumnWidths_(sheet, widths) {
  for (var i = 0; i < widths.length; i++) {
    if (widths[i] > 0) {
      sheet.setColumnWidth(i + 1, widths[i]);
    }
  }
}

function generateSheetItemId() {
  var ts = new Date().getTime().toString(36);
  var rand = Math.floor(Math.random() * 1e6).toString(36);
  var id = 'id_' + ts + '_' + rand;
  try {
    var ui = SpreadsheetApp.getUi();
    ui.prompt('Generated ID', id, ui.ButtonSet.OK);
  } catch (e) {
    Logger.log('Generated id: ' + id);
  }
  return id;
}
