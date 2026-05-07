/**
 * Validation.gs — dropdowns, checkboxes, data validation builders.
 * Core module. Zero project-specific references.
 */

function applyDropdownList_(sheet, startRow, column, numRows, values, allowInvalid, helpText) {
  if (numRows < 1) return;
  var builder = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(allowInvalid === true);
  if (helpText) builder = builder.setHelpText(helpText);
  sheet.getRange(startRow, column, numRows, 1).setDataValidation(builder.build());
}

function applyDropdownRange_(sheet, startRow, column, numRows, range, allowInvalid, helpText) {
  if (numRows < 1) return;
  var builder = SpreadsheetApp.newDataValidation()
    .requireValueInRange(range, true)
    .setAllowInvalid(allowInvalid === true);
  if (helpText) builder = builder.setHelpText(helpText);
  sheet.getRange(startRow, column, numRows, 1).setDataValidation(builder.build());
}

function applyCheckboxColumn_(sheet, startRow, column, numRows) {
  if (numRows < 1) return;
  sheet.getRange(startRow, column, numRows, 1).insertCheckboxes();
}

function clearColumnValidation_(sheet, startRow, column, numRows) {
  if (numRows < 1) return;
  sheet.getRange(startRow, column, numRows, 1).clearDataValidations();
}
