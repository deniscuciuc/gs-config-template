const migration_202605060001_seed_default_long_term_tournaments = {
  id: '202605060001_seed_default_long_term_tournaments',
  description: 'Seed default long-term tournaments and reward ladder.',
  up: function () {
    createTournamentsSheet_();
    createTournamentRewardsSheet_();

    ensureRowsByKey_('Tournaments', 'Id', [
      {
        Id: 'season-classic-2026',
        Name: 'Classic Season 2026',
        GameId: 'slots-classic',
        StartUtc: '2026-01-01T00:00:00Z',
        EndUtc: '2026-12-31T23:59:59Z',
        EntryFee: 'free',
        Priority: 50,
        IsLongTerm: true,
        IsEnabled: true,
      },
      {
        Id: 'season-puzzle-2026',
        Name: 'Puzzle Masters 2026',
        GameId: 'puzzle-master',
        StartUtc: '2026-01-01T00:00:00Z',
        EndUtc: '2026-12-31T23:59:59Z',
        EntryFee: 'tickets:1',
        Priority: 60,
        IsLongTerm: true,
        IsEnabled: true,
      },
    ]);

    var rewardRows = [];
    var ladder = [
      { pos: 1, currency: 'gems', amount: 1000 },
      { pos: 2, currency: 'gems', amount: 500 },
      { pos: 3, currency: 'gems', amount: 250 },
      { pos: 10, currency: 'coins', amount: 5000 },
      { pos: 100, currency: 'coins', amount: 1000 },
    ];
    ['season-classic-2026', 'season-puzzle-2026'].forEach(function (tid) {
      ladder.forEach(function (l) {
        rewardRows.push({
          TournamentId: tid,
          Position: l.pos,
          RewardCurrency: l.currency,
          RewardAmount: l.amount,
          RewardItemId: '',
        });
      });
    });
    // composite key — emulate by joining
    var sheet = getSheet('TournamentRewards');
    if (sheet && sheet.getLastRow() < 2) {
      sheet
        .getRange(2, 1, rewardRows.length, 5)
        .setValues(rewardRows.map(function (r) {
          return [r.TournamentId, r.Position, r.RewardCurrency, r.RewardAmount, r.RewardItemId];
        }));
    }
  },
};
