/**
 * Menu.gs — registers the spreadsheet custom menu.
 * Calls registerPluginMenuItems_() to attach plugin-contributed items.
 */

function onOpen() {
  buildMainMenu_();
}

function onInstall() {
  onOpen();
}

function buildMainMenu_() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui
    .createMenu('⚙️ Sheet Config')
    .addItem('Run Migrations', 'runMigrations')
    .addItem('Migration Status', 'showMigrationStatus')
    .addSeparator()
    .addItem('Validate All Sheets', 'validateAllSheets')
    .addItem('Repair All Sheets', 'repairAllSheets')
    .addItem('Health Dashboard', 'showHealthDashboard')
    .addSeparator()
    .addItem('Generate Sheet ID', 'generateSheetItemId')
    .addSeparator()
    .addItem('Remove All Sheets', 'removeAllConfigSheets')
    .addItem('Reset to Defaults', 'resetAllToDefaults');

  // Plugin extension point — plugins may attach a sub-menu here.
  try {
    if (typeof registerPluginMenuItems_ === 'function') {
      registerPluginMenuItems_(menu, ui);
    }
  } catch (e) {
    Logger.log('Plugin menu registration failed: ' + e);
  }

  menu.addToUi();
}
