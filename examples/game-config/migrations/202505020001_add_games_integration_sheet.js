const migration_202505020001_add_games_integration_sheet = {
  id: '202505020001_add_games_integration_sheet',
  description: 'Add GamesIntegration sheet that links Games.Id to external providers.',
  up: function () {
    createGamesIntegrationSheet_();
  },
};
