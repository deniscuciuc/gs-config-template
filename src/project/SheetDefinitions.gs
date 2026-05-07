/**
 * SheetDefinitions.gs — typed schemas for every config sheet.
 *
 * Each sheet has two functions:
 *   createXxxSheet_()    — idempotent: creates the sheet if absent, sets header.
 *   configureXxxSheet_() — header notes, column widths, dropdowns, checkboxes.
 *
 * Seed data lives in MIGRATIONS, never in create*/configure* helpers.
 */

// ─── shared helpers ───────────────────────────────────────────────

function _writeHeader_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeader_(sheet, headers.length);
  freezeHeader_(sheet);
}

// ─── Localization ────────────────────────────────────────────────

function createLocalizationSheet_() {
  var sheet = getOrCreateSheet('Localization');
  _writeHeader_(sheet, ['Key', 'en', 'ru', 'es', 'Notes']);
  configureLocalizationSheet_(sheet);
  return sheet;
}

function configureLocalizationSheet_(sheet) {
  sheet = sheet || getSheet('Localization');
  if (!sheet) return;
  applyHeaderNotes_(sheet, [
    'Localization key, e.g. ui.menu.play. Required, unique.',
    'English source string. Required.',
    'Russian translation. Use the auto-translate plugin to fill missing.',
    'Spanish translation. Use the auto-translate plugin to fill missing.',
    'Free-form note for translators.',
  ]);
  setColumnWidths_(sheet, [320, 360, 360, 360, 240]);
  trimSheet_(sheet, Math.max(2, sheet.getLastRow()), 5);
}

// ─── Games ───────────────────────────────────────────────────────

function createGamesSheet_() {
  var sheet = getOrCreateSheet('Games');
  _writeHeader_(sheet, ['Id', 'Name', 'Genre', 'IsEnabled', 'Notes']);
  configureGamesSheet_(sheet);
  return sheet;
}

function configureGamesSheet_(sheet) {
  sheet = sheet || getSheet('Games');
  if (!sheet) return;
  applyHeaderNotes_(sheet, [
    'Slug game id (lowercase, hyphenated). Required, unique. Referenced by Tournaments and GamesIntegration.',
    'Display name shown to players.',
    'Game genre (Casual, Puzzle, Card, Slots, Other).',
    'Checkbox. Uncheck to disable without deleting.',
    'Free-form notes.',
  ]);
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyDropdownList_(sheet, 2, 3, Math.max(1, dataRows), ['Casual', 'Puzzle', 'Card', 'Slots', 'Arcade', 'Other'], false, 'Pick a genre.');
  applyCheckboxColumn_(sheet, 2, 4, Math.max(1, dataRows));
  setColumnWidths_(sheet, [180, 220, 140, 100, 320]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 5);
}

// ─── GamesIntegration ────────────────────────────────────────────

function createGamesIntegrationSheet_() {
  var sheet = getOrCreateSheet('GamesIntegration');
  _writeHeader_(sheet, ['GameId', 'Provider', 'ProviderRef', 'CallbackUrl', 'IsEnabled']);
  configureGamesIntegrationSheet_(sheet);
  return sheet;
}

function configureGamesIntegrationSheet_(sheet) {
  sheet = sheet || getSheet('GamesIntegration');
  if (!sheet) return;
  var games = getSheet('Games');
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Reference to Games.Id (slug). Required.',
    'Integration provider (Internal, Pragmatic, Evolution, Custom).',
    'Provider-side reference id or external code.',
    'Callback URL for game events.',
    'Checkbox. Uncheck to disable.',
  ]);
  if (games) {
    var gamesLast = Math.max(2, games.getLastRow());
    applyDropdownRange_(sheet, 2, 1, Math.max(1, dataRows), games.getRange(2, 1, gamesLast - 1, 1), false, 'Select a Games.Id.');
  }
  applyDropdownList_(sheet, 2, 2, Math.max(1, dataRows), ['Internal', 'Pragmatic', 'Evolution', 'Custom'], false, 'Provider name.');
  applyCheckboxColumn_(sheet, 2, 5, Math.max(1, dataRows));
  setColumnWidths_(sheet, [180, 140, 240, 320, 100]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 5);
}

// ─── Tournaments ─────────────────────────────────────────────────

function createTournamentsSheet_() {
  var sheet = getOrCreateSheet('Tournaments');
  _writeHeader_(sheet, ['Id', 'Name', 'GameId', 'StartUtc', 'EndUtc', 'EntryFee', 'Priority', 'IsLongTerm', 'IsEnabled']);
  configureTournamentsSheet_(sheet);
  return sheet;
}

function configureTournamentsSheet_(sheet) {
  sheet = sheet || getSheet('Tournaments');
  if (!sheet) return;
  var games = getSheet('Games');
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Tournament slug id. Required, unique.',
    'Display name.',
    'Reference to Games.Id (slug).',
    'ISO-8601 UTC start time. Example: 2026-06-01T18:00:00Z',
    'ISO-8601 UTC end time.',
    'Entry fee. Format: <currency>:<amount>, e.g. coins:100.',
    'Display priority. Lower = shown first. Range 1-999.',
    'Checkbox. Long-term tournaments live for weeks/months.',
    'Checkbox. Uncheck to hide without deleting.',
  ]);
  if (games) {
    var gamesLast = Math.max(2, games.getLastRow());
    applyDropdownRange_(sheet, 2, 3, Math.max(1, dataRows), games.getRange(2, 1, gamesLast - 1, 1), false, 'Select a Games.Id.');
  }
  applyCheckboxColumn_(sheet, 2, 8, Math.max(1, dataRows));
  applyCheckboxColumn_(sheet, 2, 9, Math.max(1, dataRows));
  setColumnWidths_(sheet, [220, 240, 160, 200, 200, 140, 90, 110, 100]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 9);
}

// ─── TournamentRewards ───────────────────────────────────────────

function createTournamentRewardsSheet_() {
  var sheet = getOrCreateSheet('TournamentRewards');
  _writeHeader_(sheet, ['TournamentId', 'Position', 'RewardCurrency', 'RewardAmount', 'RewardItemId']);
  configureTournamentRewardsSheet_(sheet);
  return sheet;
}

function configureTournamentRewardsSheet_(sheet) {
  sheet = sheet || getSheet('TournamentRewards');
  if (!sheet) return;
  var tournaments = getSheet('Tournaments');
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Reference to Tournaments.Id.',
    'Final position (1, 2, 3, …). Range 1-9999.',
    'Currency code from the AVAILABLE CURRENCIES section in _Reference.',
    'Reward amount. Range 0-9,999,999.',
    'Optional reward item id (avatar, cosmetic, …).',
  ]);
  if (tournaments) {
    var tLast = Math.max(2, tournaments.getLastRow());
    applyDropdownRange_(sheet, 2, 1, Math.max(1, dataRows), tournaments.getRange(2, 1, tLast - 1, 1), false, 'Select a Tournaments.Id.');
  }
  applyDropdownList_(sheet, 2, 3, Math.max(1, dataRows), ['coins', 'gems', 'tickets', 'xp'], true, 'See _Reference for full list.');
  setColumnWidths_(sheet, [220, 100, 160, 140, 220]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 5);
}

// ─── CyclicQuests ────────────────────────────────────────────────

function createCyclicQuestsSheet_() {
  var sheet = getOrCreateSheet('CyclicQuests');
  _writeHeader_(sheet, ['Id', 'Name', 'Cycle', 'Objective', 'FrontendAction', 'RewardCurrency', 'RewardAmount', 'IsEnabled']);
  configureCyclicQuestsSheet_(sheet);
  return sheet;
}

function configureCyclicQuestsSheet_(sheet) {
  sheet = sheet || getSheet('CyclicQuests');
  if (!sheet) return;
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Quest slug id. Required, unique.',
    'Display name.',
    'Cycle period: Daily, Weekly, Monthly.',
    'Objective in canonical format. See OBJECTIVE FORMAT in _Reference.',
    'Frontend action key the UI invokes when quest is tapped. See CYCLIC QUEST FRONTEND ACTIONS.',
    'Reward currency code.',
    'Reward amount.',
    'Checkbox. Uncheck to disable.',
  ]);
  applyDropdownList_(sheet, 2, 3, Math.max(1, dataRows), ['Daily', 'Weekly', 'Monthly'], false, 'Cycle period.');
  applyDropdownList_(sheet, 2, 6, Math.max(1, dataRows), ['coins', 'gems', 'tickets', 'xp'], true, '');
  applyCheckboxColumn_(sheet, 2, 8, Math.max(1, dataRows));
  setColumnWidths_(sheet, [200, 220, 100, 280, 220, 140, 130, 100]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 8);
}

// ─── Guides ──────────────────────────────────────────────────────

function createGuidesSheet_() {
  var sheet = getOrCreateSheet('Guides');
  _writeHeader_(sheet, ['Id', 'Title', 'Category', 'IsEnabled']);
  configureGuidesSheet_(sheet);
  return sheet;
}

function configureGuidesSheet_(sheet) {
  sheet = sheet || getSheet('Guides');
  if (!sheet) return;
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Guide slug id. Required.',
    'Localization key for the title (see Localization).',
    'Category for grouping in the help center.',
    'Checkbox. Uncheck to hide.',
  ]);
  applyCheckboxColumn_(sheet, 2, 4, Math.max(1, dataRows));
  setColumnWidths_(sheet, [200, 280, 180, 100]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 4);
}

// ─── GuideSteps ──────────────────────────────────────────────────

function createGuideStepsSheet_() {
  var sheet = getOrCreateSheet('GuideSteps');
  _writeHeader_(sheet, ['GuideId', 'StepOrder', 'Title', 'BodyKey', 'ImageUrl']);
  configureGuideStepsSheet_(sheet);
  return sheet;
}

function configureGuideStepsSheet_(sheet) {
  sheet = sheet || getSheet('GuideSteps');
  if (!sheet) return;
  var guides = getSheet('Guides');
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Reference to Guides.Id.',
    'Display order. 1-999.',
    'Localization key for the step title.',
    'Localization key for the step body.',
    'Optional image URL.',
  ]);
  if (guides) {
    var gLast = Math.max(2, guides.getLastRow());
    applyDropdownRange_(sheet, 2, 1, Math.max(1, dataRows), guides.getRange(2, 1, gLast - 1, 1), false, 'Select a Guides.Id.');
  }
  setColumnWidths_(sheet, [200, 100, 240, 240, 320]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 5);
}

// ─── FortuneWheelConfig ──────────────────────────────────────────

function createFortuneWheelConfigSheet_() {
  var sheet = getOrCreateSheet('FortuneWheelConfig');
  _writeHeader_(sheet, ['Key', 'Value', 'Notes']);
  configureFortuneWheelConfigSheet_(sheet);
  return sheet;
}

function configureFortuneWheelConfigSheet_(sheet) {
  sheet = sheet || getSheet('FortuneWheelConfig');
  if (!sheet) return;
  applyHeaderNotes_(sheet, [
    'Config key (DailyFreeSpins, MaxSpinsPerDay, …).',
    'Config value.',
    'Free-form note.',
  ]);
  setColumnWidths_(sheet, [240, 200, 360]);
  trimSheet_(sheet, Math.max(2, sheet.getLastRow()), 3);
}

// ─── FortuneWheelSlots ───────────────────────────────────────────

function createFortuneWheelSlotsSheet_() {
  var sheet = getOrCreateSheet('FortuneWheelSlots');
  _writeHeader_(sheet, ['SlotIndex', 'RarityTier', 'RewardCurrency', 'RewardAmount', 'Multiplier', 'SpinType', 'Weight']);
  configureFortuneWheelSlotsSheet_(sheet);
  return sheet;
}

function configureFortuneWheelSlotsSheet_(sheet) {
  sheet = sheet || getSheet('FortuneWheelSlots');
  if (!sheet) return;
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Slot position on the wheel, 0-based.',
    'Rarity tier. See FORTUNE WHEEL RARITY TIERS in _Reference.',
    'Reward currency code.',
    'Base reward amount.',
    'Multiplier applied. See FORTUNE WHEEL MULTIPLIERS.',
    'Spin type this slot belongs to (Free, Paid, Premium).',
    'Weighting for random draw. Range 1-10000.',
  ]);
  applyDropdownList_(sheet, 2, 2, Math.max(1, dataRows), ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'], false, 'Rarity tier.');
  applyDropdownList_(sheet, 2, 3, Math.max(1, dataRows), ['coins', 'gems', 'tickets', 'xp'], true, '');
  applyDropdownList_(sheet, 2, 5, Math.max(1, dataRows), ['x1', 'x2', 'x3', 'x5', 'x10'], false, '');
  applyDropdownList_(sheet, 2, 6, Math.max(1, dataRows), ['Free', 'Paid', 'Premium'], false, 'Spin type.');
  setColumnWidths_(sheet, [110, 120, 140, 130, 110, 110, 90]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 7);
}

// ─── Avatars ─────────────────────────────────────────────────────

function createAvatarsSheet_() {
  var sheet = getOrCreateSheet('Avatars');
  _writeHeader_(sheet, ['Id', 'Name', 'ImageUrl', 'PriceCurrency', 'PriceAmount', 'IsEnabled']);
  configureAvatarsSheet_(sheet);
  return sheet;
}

function configureAvatarsSheet_(sheet) {
  sheet = sheet || getSheet('Avatars');
  if (!sheet) return;
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Avatar slug id. Required, unique.',
    'Display name.',
    'Image URL.',
    'Price currency. See PRICE / COST FORMAT in _Reference.',
    'Price amount.',
    'Checkbox. Uncheck to disable.',
  ]);
  applyDropdownList_(sheet, 2, 4, Math.max(1, dataRows), ['coins', 'gems', 'tickets'], true, '');
  applyCheckboxColumn_(sheet, 2, 6, Math.max(1, dataRows));
  setColumnWidths_(sheet, [200, 200, 360, 140, 130, 100]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 6);
}

// ─── CheckIn ─────────────────────────────────────────────────────

function createCheckInSheet_() {
  var sheet = getOrCreateSheet('CheckIn');
  _writeHeader_(sheet, ['Day', 'RewardCurrency', 'RewardAmount', 'BonusItemId', 'Notes']);
  configureCheckInSheet_(sheet);
  return sheet;
}

function configureCheckInSheet_(sheet) {
  sheet = sheet || getSheet('CheckIn');
  if (!sheet) return;
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Day number in the check-in cycle (1, 2, 3, …).',
    'Reward currency.',
    'Reward amount.',
    'Optional bonus item id.',
    'Free-form note.',
  ]);
  applyDropdownList_(sheet, 2, 2, Math.max(1, dataRows), ['coins', 'gems', 'tickets', 'xp'], true, '');
  setColumnWidths_(sheet, [80, 160, 140, 220, 300]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 5);
}

// ─── AdminPermissions ────────────────────────────────────────────

function createAdminPermissionsSheet_() {
  var sheet = getOrCreateSheet('AdminPermissions');
  _writeHeader_(sheet, ['UserId', 'Name', 'Level', 'ConfigWriteLevel', 'Notes', 'IsActive']);
  configureAdminPermissionsSheet_(sheet);
  return sheet;
}

function configureAdminPermissionsSheet_(sheet) {
  sheet = sheet || getSheet('AdminPermissions');
  if (!sheet) return;
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Stable user id (e.g. Telegram numeric id, account uuid). Required, unique.',
    'Human-readable admin name.',
    'Permission level. 1 = read-only, 2 = operator, 3 = super-admin.',
    'Minimum admin level required for this admin to apply config writes. Default 3.',
    'Free-form notes.',
    'Checkbox. Uncheck to disable without deleting.',
  ]);
  applyDropdownList_(sheet, 2, 3, Math.max(1, dataRows), ['1', '2', '3'], false, 'L1=read, L2=operator, L3=super-admin.');
  applyDropdownList_(sheet, 2, 4, Math.max(1, dataRows), ['1', '2', '3'], false, '1 = any admin, 3 = super-admin only.');
  applyCheckboxColumn_(sheet, 2, 6, Math.max(1, dataRows));
  setColumnWidths_(sheet, [180, 200, 80, 140, 320, 90]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 6);
}

// ─── AdminConfigWritePermissions ─────────────────────────────────

function createAdminConfigWritePermissionsSheet_() {
  var sheet = getOrCreateSheet('AdminConfigWritePermissions');
  _writeHeader_(sheet, ['ConfigKey', 'MinWriteLevel', 'Notes']);
  configureAdminConfigWritePermissionsSheet_(sheet);
  return sheet;
}

function configureAdminConfigWritePermissionsSheet_(sheet) {
  sheet = sheet || getSheet('AdminConfigWritePermissions');
  if (!sheet) return;
  var dataRows = Math.max(0, sheet.getLastRow() - 1);
  applyHeaderNotes_(sheet, [
    'Config key or wildcard (Tournaments, Avatars, admin_config.*, *). Exact match wins over wildcard.',
    'Minimum admin level (1-3) required to apply changes.',
    'Free-form description.',
  ]);
  applyDropdownList_(sheet, 2, 2, Math.max(1, dataRows), ['1', '2', '3'], false, '1 = any admin, 3 = super-admin only.');
  setColumnWidths_(sheet, [260, 140, 360]);
  trimSheet_(sheet, Math.max(2, dataRows + 1), 3);
}

// ─── Idempotent seed/upsert helpers used by migrations ───────────

function ensureRowsByKey_(sheetName, keyColumn, rows) {
  return upsertRowsByKey(sheetName, keyColumn, rows);
}
