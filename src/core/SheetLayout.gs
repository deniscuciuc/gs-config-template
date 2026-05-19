/**
 * SheetLayout.gs — sheet ordering and tab-colour utilities.
 *
 * applySheetLayout_(layout) is the single public entry point.
 * Call it from repairAllSheets() and the "Reorder Sheets" menu action.
 *
 * Layout ordering rules (in priority order):
 *   1. Sheets explicitly listed in `layout`, in the given order.
 *   2. Unlisted sheets whose names start with '_', sorted alphabetically.
 *   3. Any remaining unlisted sheets, in their current spreadsheet order.
 *
 * Tab colours are applied when an entry carries a `color` field (hex string).
 *
 * @param {Array<{name: string, color?: string}>} layout
 *   Ordered list of sheet descriptors. Sheets absent from the spreadsheet
 *   are silently skipped.
 */
function applySheetLayout_(layout) {
  var ss = getSpreadsheet();
  var allSheets = ss.getSheets();

  // Index existing sheets by name for O(1) lookup.
  var byName = {};
  allSheets.forEach(function (s) {
    byName[s.getName()] = s;
  });

  var ordered = [];
  var placed = {};

  // 1. Explicitly listed sheets (only those that already exist).
  layout.forEach(function (entry) {
    var s = byName[entry.name];
    if (s && !placed[entry.name]) {
      ordered.push({ sheet: s, color: entry.color || null });
      placed[entry.name] = true;
    }
  });

  // 2. Unlisted _* sheets, sorted alphabetically.
  allSheets
    .filter(function (s) {
      return s.getName().startsWith('_') && !placed[s.getName()];
    })
    .sort(function (a, b) {
      return a.getName().localeCompare(b.getName());
    })
    .forEach(function (s) {
      ordered.push({ sheet: s, color: null });
      placed[s.getName()] = true;
    });

  // 3. Any remaining unlisted non-_ sheets, in their current order.
  allSheets.forEach(function (s) {
    if (!placed[s.getName()]) {
      ordered.push({ sheet: s, color: null });
    }
  });

  // Move each sheet to its target position (1-based) and apply colour.
  ordered.forEach(function (entry, index) {
    ss.setActiveSheet(entry.sheet);
    ss.moveActiveSheet(index + 1);
    if (entry.color) {
      entry.sheet.setTabColor(entry.color);
    }
  });
}
