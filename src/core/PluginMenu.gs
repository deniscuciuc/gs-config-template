/**
 * PluginMenu.gs — extension point for plugin scripts to attach menu items.
 *
 * Plugins register themselves by pushing a definition to PLUGIN_MENU_ITEMS:
 *   PLUGIN_MENU_ITEMS.push({
 *     label: 'Auto-translate missing locales',
 *     functionName: 'autoTranslateMissingLocales',
 *     section: 'Localization', // optional grouping label
 *   });
 *
 * The template groups items by section into sub-menus.
 */

var PLUGIN_MENU_ITEMS = [];

function registerPluginMenuItems_(menu, ui) {
  if (!PLUGIN_MENU_ITEMS || PLUGIN_MENU_ITEMS.length === 0) return;

  var bySection = {};
  var ungrouped = [];
  for (var i = 0; i < PLUGIN_MENU_ITEMS.length; i++) {
    var item = PLUGIN_MENU_ITEMS[i];
    if (!item || !item.label || !item.functionName) continue;
    if (item.section) {
      if (!bySection[item.section]) bySection[item.section] = [];
      bySection[item.section].push(item);
    } else {
      ungrouped.push(item);
    }
  }

  menu.addSeparator();
  menu.addItem('— Plugins —', '_pluginMenuNoop_');

  Object.keys(bySection)
    .sort()
    .forEach(function (sectionName) {
      var sub = ui.createMenu(sectionName);
      bySection[sectionName].forEach(function (item) {
        sub.addItem(item.label, item.functionName);
      });
      menu.addSubMenu(sub);
    });

  ungrouped.forEach(function (item) {
    menu.addItem(item.label, item.functionName);
  });
}

function _pluginMenuNoop_() {
  // Header item, intentionally no-op.
}
