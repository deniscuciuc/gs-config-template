/**
 * Config.gs — project-specific configuration.
 *
 * Lists the sheets the template manages and the migrations it applies.
 * Migrations are run in the order they appear in ALL_MIGRATIONS.
 */

const ALL_SHEET_NAMES = [
  'Localization',
  'Games',
  'GamesIntegration',
  'Tournaments',
  'TournamentRewards',
  'CyclicQuests',
  'Guides',
  'GuideSteps',
  'FortuneWheelConfig',
  'FortuneWheelSlots',
  'Avatars',
  'CheckIn',
  'AdminPermissions',
  'AdminConfigWritePermissions',
  '_Reference',
];

const ALL_MIGRATIONS = [
  migration_202604280001_initial_setup,
  migration_202506150001_add_games_integration_sheet,
  migration_202506160001_use_slug_game_ids,
  migration_202506170001_remove_games_slug_column,
  migration_202505050001_seed_default_check_in_schedule,
  migration_202505050002_fortune_wheel_spin_type,
  migration_202506180001_add_tournament_priority,
  migration_202605060001_seed_default_long_term_tournaments,
];

/**
 * Expected per-sheet schema. Used by validateAllSheets() and repairAllSheets().
 * Each entry: { columns: string[], required: string[] }
 */
const EXPECTED_SHEET_SCHEMA = {
  Localization: {
    columns: ['Key', 'en', 'ru', 'es', 'Notes'],
    required: ['Key', 'en'],
  },
  Games: {
    columns: ['Id', 'Name', 'Genre', 'IsEnabled', 'Notes'],
    required: ['Id', 'Name'],
  },
  GamesIntegration: {
    columns: ['GameId', 'Provider', 'ProviderRef', 'CallbackUrl', 'IsEnabled'],
    required: ['GameId', 'Provider'],
  },
  Tournaments: {
    columns: ['Id', 'Name', 'GameId', 'StartUtc', 'EndUtc', 'EntryFee', 'Priority', 'IsLongTerm', 'IsEnabled'],
    required: ['Id', 'Name', 'GameId'],
  },
  TournamentRewards: {
    columns: ['TournamentId', 'Position', 'RewardCurrency', 'RewardAmount', 'RewardItemId'],
    required: ['TournamentId', 'Position'],
  },
  CyclicQuests: {
    columns: ['Id', 'Name', 'Cycle', 'Objective', 'FrontendAction', 'RewardCurrency', 'RewardAmount', 'IsEnabled'],
    required: ['Id', 'Name', 'Cycle'],
  },
  Guides: {
    columns: ['Id', 'Title', 'Category', 'IsEnabled'],
    required: ['Id', 'Title'],
  },
  GuideSteps: {
    columns: ['GuideId', 'StepOrder', 'Title', 'BodyKey', 'ImageUrl'],
    required: ['GuideId', 'StepOrder'],
  },
  FortuneWheelConfig: {
    columns: ['Key', 'Value', 'Notes'],
    required: ['Key', 'Value'],
  },
  FortuneWheelSlots: {
    columns: ['SlotIndex', 'RarityTier', 'RewardCurrency', 'RewardAmount', 'Multiplier', 'SpinType', 'Weight'],
    required: ['SlotIndex', 'RarityTier'],
  },
  Avatars: {
    columns: ['Id', 'Name', 'ImageUrl', 'PriceCurrency', 'PriceAmount', 'IsEnabled'],
    required: ['Id', 'Name'],
  },
  CheckIn: {
    columns: ['Day', 'RewardCurrency', 'RewardAmount', 'BonusItemId', 'Notes'],
    required: ['Day', 'RewardCurrency', 'RewardAmount'],
  },
  AdminPermissions: {
    columns: ['UserId', 'Name', 'Level', 'ConfigWriteLevel', 'Notes', 'IsActive'],
    required: ['UserId', 'Name', 'Level'],
  },
  AdminConfigWritePermissions: {
    columns: ['ConfigKey', 'MinWriteLevel', 'Notes'],
    required: ['ConfigKey', 'MinWriteLevel'],
  },
};

// ─── Validation entry points ───────────────────────────────────────────

function collectValidationErrors_() {
  var ss = getSpreadsheet();
  var errors = [];
  Object.keys(EXPECTED_SHEET_SCHEMA).forEach(function (name) {
    var schema = EXPECTED_SHEET_SCHEMA[name];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      errors.push(name + ': sheet missing');
      return;
    }
    var lastCol = sheet.getLastColumn();
    if (lastCol < schema.columns.length) {
      errors.push(name + ': expected ' + schema.columns.length + ' columns, found ' + lastCol);
    }
    var headers = sheet.getRange(1, 1, 1, Math.max(lastCol, schema.columns.length)).getValues()[0];
    for (var i = 0; i < schema.columns.length; i++) {
      if (String(headers[i] || '').trim() !== schema.columns[i]) {
        errors.push(name + ' col ' + (i + 1) + ': expected "' + schema.columns[i] + '", found "' + headers[i] + '"');
      }
    }
    // Required field check
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var data = sheet.getRange(2, 1, lastRow - 1, schema.columns.length).getValues();
      for (var r = 0; r < data.length; r++) {
        for (var c = 0; c < schema.required.length; c++) {
          var colIdx = schema.columns.indexOf(schema.required[c]);
          if (colIdx < 0) continue;
          var v = data[r][colIdx];
          if (v === '' || v === null || v === undefined) {
            errors.push(name + ' row ' + (r + 2) + ': "' + schema.required[c] + '" required');
          }
        }
      }
    }
  });
  return errors;
}

function validateAllSheets() {
  var errors = collectValidationErrors_();
  if (errors.length === 0) {
    showAlert('Validation', '✅ All sheets passed validation.');
    return;
  }
  var preview = errors.slice(0, 50).join('\n');
  var more = errors.length > 50 ? '\n…and ' + (errors.length - 50) + ' more' : '';
  showAlert('Validation — ' + errors.length + ' error(s)', preview + more);
}

/**
 * Re-runs createXxxSheet_/configureXxxSheet_ for every sheet to repair drift
 * (header order, dropdowns, column widths). Does not delete user data — uses
 * idempotent create helpers from SheetDefinitions.gs.
 */
function repairAllSheets() {
  var actions = [
    { name: 'Localization', fn: createLocalizationSheet_ },
    { name: 'Games', fn: createGamesSheet_ },
    { name: 'GamesIntegration', fn: createGamesIntegrationSheet_ },
    { name: 'Tournaments', fn: createTournamentsSheet_ },
    { name: 'TournamentRewards', fn: createTournamentRewardsSheet_ },
    { name: 'CyclicQuests', fn: createCyclicQuestsSheet_ },
    { name: 'Guides', fn: createGuidesSheet_ },
    { name: 'GuideSteps', fn: createGuideStepsSheet_ },
    { name: 'FortuneWheelConfig', fn: createFortuneWheelConfigSheet_ },
    { name: 'FortuneWheelSlots', fn: createFortuneWheelSlotsSheet_ },
    { name: 'Avatars', fn: createAvatarsSheet_ },
    { name: 'CheckIn', fn: createCheckInSheet_ },
    { name: 'AdminPermissions', fn: createAdminPermissionsSheet_ },
    { name: 'AdminConfigWritePermissions', fn: createAdminConfigWritePermissionsSheet_ },
    { name: '_Reference', fn: createReferenceSheet_ },
  ];
  var p = beginProgress_('Repairing sheets', actions.length);
  for (var i = 0; i < actions.length; i++) {
    p.update(i, actions[i].name);
    try {
      actions[i].fn();
    } catch (e) {
      p.finish('Failed at ' + actions[i].name);
      showAlert('Repair failed', actions[i].name + ': ' + e);
      return;
    }
  }
  p.finish('Done');
  showAlert('Repair', '✅ Repaired ' + actions.length + ' sheet(s).');
}

function removeAllConfigSheets() {
  if (!showConfirm_('Remove All Sheets', 'Delete every config sheet AND clear migration history?')) {
    return;
  }
  var ss = getSpreadsheet();
  var blank = ss.getSheetByName('Sheet1') || ss.insertSheet('Sheet1');
  ss.setActiveSheet(blank);
  ALL_SHEET_NAMES.forEach(function (n) { deleteSheetIfExists_(n); });
  deleteSheetIfExists_(MIGRATIONS_SHEET_NAME);
  deleteSheetIfExists_(PROGRESS_SHEET_NAME);
  deleteSheetIfExists_(HEALTH_SHEET_NAME);
  showAlert('Remove All', '✅ All config sheets removed.');
}

function resetAllToDefaults() {
  if (!showConfirm_('Reset to Defaults', 'This will DELETE all config data and re-apply every migration from scratch. Continue?')) {
    return;
  }
  var ss = getSpreadsheet();
  var blank = ss.getSheetByName('Sheet1') || ss.insertSheet('Sheet1');
  ss.setActiveSheet(blank);
  ALL_SHEET_NAMES.forEach(function (n) { deleteSheetIfExists_(n); });
  deleteSheetIfExists_(MIGRATIONS_SHEET_NAME);
  runMigrations();
}
