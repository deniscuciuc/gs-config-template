const migration_202505060001_add_tournament_priority = {
  id: '202505060001_add_tournament_priority',
  description: 'Add Priority column to Tournaments and default existing rows to 100.',
  up: function () {
    createTournamentsSheet_();
    var added = ensureColumn('Tournaments', 'Priority', 100);
    if (added) {
      configureTournamentsSheet_();
    }
  },
};
