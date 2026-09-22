/**
 * Example plugin — generate N tournaments for the next month.
 *
 * Demonstrates use of: readRows, upsertRowsByKey, beginProgress, showAlert.
 * For permanent data changes prefer authoring a migration; this plugin is a
 * one-off utility, suitable for ad-hoc admin work.
 */

function exampleGenerateTournaments() {
  var games = readRows('Games').filter(function (g) {
    return g.IsEnabled;
  });
  if (games.length === 0) {
    showAlert('Generate tournaments', 'No enabled games found in the Games sheet.');
    return;
  }

  var p = beginProgress('Generate tournaments', games.length);
  var now = new Date();
  var startMonth = now.getUTCMonth() + 1; // 0-based → 1-based
  var startYear = now.getUTCFullYear();
  if (startMonth > 11) {
    startMonth = 0;
    startYear += 1;
  }

  var rows = [];
  for (var i = 0; i < games.length; i++) {
    var g = games[i];
    p.update(i, g.Id);
    var start = new Date(Date.UTC(startYear, startMonth, 1, 0, 0, 0));
    var end = new Date(Date.UTC(startYear, startMonth + 1, 0, 23, 59, 59));
    rows.push({
      Id: 'auto-' + g.Id + '-' + startYear + '-' + (startMonth + 1),
      Name: g.Name + ' Monthly',
      GameId: g.Id,
      StartUtc: start.toISOString(),
      EndUtc: end.toISOString(),
      EntryFee: 'free',
      Priority: 200,
      IsLongTerm: false,
      IsEnabled: true,
    });
  }
  var result = upsertRowsByKey('Tournaments', 'Id', rows);
  p.finish('Done');
  showAlert(
    'Generate tournaments',
    '✅ Upserted ' +
      (result.appended + result.updated) +
      ' tournament(s)' +
      ' (' +
      result.appended +
      ' new, ' +
      result.updated +
      ' updated).'
  );
}

PLUGIN_MENU_ITEMS.push({
  label: 'Generate monthly tournaments',
  functionName: 'exampleGenerateTournaments',
  section: 'Examples',
});
