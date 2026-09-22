const migration_202505030001_use_slug_game_ids = {
  id: '202505030001_use_slug_game_ids',
  description: 'Migrate Games.Id values to slug form (lowercase, hyphenated).',
  up: function () {
    var sheet = getSheet('Games');
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;

    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idIdx = headers.indexOf('Id');
    if (idIdx < 0) return;

    var col = sheet.getRange(2, idIdx + 1, lastRow - 1, 1).getValues();
    var changed = false;
    for (var i = 0; i < col.length; i++) {
      var v = String(col[i][0] || '').trim();
      if (!v) continue;
      var slug = v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (slug && slug !== v) {
        col[i][0] = slug;
        changed = true;
      }
    }
    if (changed) {
      sheet.getRange(2, idIdx + 1, col.length, 1).setValues(col);
    }
  },
};
