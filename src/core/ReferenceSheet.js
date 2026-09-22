/**
 * ReferenceSheet.js — renders the data-driven `_Reference` sheet.
 *
 * Core module. Zero project-specific references: one generic renderSection_() loop walks
 * whatever REFERENCE_SECTIONS the project layer defines. Adding a section to the sheet
 * means appending one object to that array — there is no per-section formatting code.
 *
 * REFERENCE_SECTIONS is expected to be an array of:
 *   { title: string, columns: string[], rows: Array<Array<string>> }
 */

function createReferenceSheet_() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('_Reference');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('_Reference');
  configureReferenceSheet_(sheet);
  return sheet;
}

function configureReferenceSheet_(sheet) {
  sheet = sheet || getSheet('_Reference');
  if (!sheet) return;
  // Clear contents to make this idempotent.
  sheet.clearContents();
  sheet.clearFormats();

  var row = 1;
  var maxCols = 2;
  for (var i = 0; i < REFERENCE_SECTIONS.length; i++) {
    row = renderSection_(sheet, row, REFERENCE_SECTIONS[i]);
    row += 1; // blank line between sections
  }
  sheet.setColumnWidth(1, 320);
  sheet.setColumnWidth(2, 520);
  sheet.setFrozenRows(0);
  trimSheet_(sheet, row, maxCols);
}

function renderSection_(sheet, startRow, section) {
  // Title row (merged).
  sheet
    .getRange(startRow, 1, 1, 2)
    .merge()
    .setValue(section.title)
    .setFontWeight('bold')
    .setFontColor(SECTION_FG)
    .setBackground(SECTION_BG)
    .setHorizontalAlignment('center');
  startRow += 1;

  // Column header.
  sheet
    .getRange(startRow, 1, 1, section.columns.length)
    .setValues([section.columns])
    .setFontWeight('bold')
    .setBackground(HEADER_BG)
    .setFontColor(HEADER_FG);
  startRow += 1;

  // Data rows.
  if (section.rows.length > 0) {
    sheet
      .getRange(startRow, 1, section.rows.length, section.columns.length)
      .setValues(section.rows);
    for (var i = 0; i < section.rows.length; i++) {
      var bg = i % 2 === 0 ? ROW_EVEN : ROW_ODD;
      sheet
        .getRange(startRow + i, 1, 1, section.columns.length)
        .setBackground(bg)
        .setWrap(true);
    }
    startRow += section.rows.length;
  }
  return startRow;
}
