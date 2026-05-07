/**
 * Core.gs — spreadsheet access helpers.
 * Framework-internal core module. Contains zero project-specific references.
 */

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function getOrCreateSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function renameSheetIfExists_(oldName, newName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(oldName);
  if (!sheet) return false;
  if (ss.getSheetByName(newName)) return false;
  sheet.setName(newName);
  return true;
}

function deleteSheetIfExists_(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) return false;
  ss.deleteSheet(sheet);
  return true;
}

function getActiveUserEmail_() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}
