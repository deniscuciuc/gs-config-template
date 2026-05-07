const migration_202506150001_add_games_integration_sheet = {
  id: '202506150001_add_games_integration_sheet',
  description: 'Add GamesIntegration sheet that links Games.Id to external providers.',
  up: function () {
    createGamesIntegrationSheet_();
  },
};
