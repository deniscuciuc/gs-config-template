const migration_202505040001_remove_games_slug_column = {
  id: '202505040001_remove_games_slug_column',
  description: 'Remove redundant Games.Slug column (Id is now the slug).',
  up: function () {
    var sheet = getSheet('Games');
    if (!sheet) return;
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) return;
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var slugIdx = headers.indexOf('Slug');
    if (slugIdx < 0) return; // already removed — idempotent
    sheet.deleteColumn(slugIdx + 1);
    // Re-apply schema/configuration to keep header notes/widths consistent.
    createGamesSheet_();
  },
};
