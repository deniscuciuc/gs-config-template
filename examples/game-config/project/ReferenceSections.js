/**
 * ReferenceSections.js — content for the `_Reference` sheet.
 *
 * Plain data. The renderer lives in src/core/ReferenceSheet.js and never changes; this is
 * the half you rewrite for your own domain.
 */

const REFERENCE_SECTIONS = [
  {
    title: 'AVAILABLE CURRENCIES',
    columns: ['Code', 'Description'],
    rows: [
      ['coins', 'Soft currency, awarded everywhere.'],
      ['gems', 'Premium currency, paid or rare drop.'],
      ['tickets', 'Tournament entry tokens.'],
      ['xp', 'Experience points (no spending).'],
    ],
  },
  {
    title: 'GAME EVENT KEYS',
    columns: ['Key', 'Fired when'],
    rows: [
      ['game.start', 'Player begins a game session.'],
      ['game.win', 'Player wins a round.'],
      ['game.lose', 'Player loses a round.'],
      ['game.spin', 'Player spins (slots / fortune wheel).'],
      ['tournament.enter', 'Player joins a tournament.'],
      ['tournament.score', 'Player posts a score in a tournament.'],
    ],
  },
  {
    title: 'OBJECTIVE FORMAT',
    columns: ['Pattern', 'Example'],
    rows: [
      ['<event>:<count>', 'game.win:5  — win 5 games'],
      ['<event>:<count>:<gameId>', 'game.win:3:slots-classic  — win 3 in slots-classic'],
      ['currency.earn:<currency>:<amount>', 'currency.earn:coins:1000'],
      ['tournament.place:<position>', 'tournament.place:3  — finish top 3'],
    ],
  },
  {
    title: 'CYCLIC QUEST FRONTEND ACTIONS',
    columns: ['Key', 'Effect'],
    rows: [
      ['open_game:<gameId>', 'Navigates to the game.'],
      ['open_tournament:<id>', 'Opens the tournament details.'],
      ['open_shop:<section>', 'Opens shop at the named section.'],
      ['open_wheel', 'Opens the fortune wheel.'],
      ['no_action', 'Tap is informational only.'],
    ],
  },
  {
    title: 'REWARD FORMAT',
    columns: ['Pattern', 'Example'],
    rows: [
      ['<currency>:<amount>', 'coins:500'],
      ['item:<itemId>', 'item:avatar_dragon'],
      ['multi:<currency:amt>;<currency:amt>', 'multi:coins:500;gems:5'],
    ],
  },
  {
    title: 'PRICE / COST FORMAT',
    columns: ['Pattern', 'Example'],
    rows: [
      ['<currency>:<amount>', 'gems:50'],
      ['free', 'No cost.'],
      ['ad', 'Watch a rewarded ad.'],
    ],
  },
  {
    title: 'FORTUNE WHEEL RARITY TIERS',
    columns: ['Tier', 'Suggested weight'],
    rows: [
      ['Common', '500-2000'],
      ['Rare', '100-400'],
      ['Epic', '20-80'],
      ['Legendary', '5-15'],
      ['Mythic', '1-3'],
    ],
  },
  {
    title: 'FORTUNE WHEEL MULTIPLIERS',
    columns: ['Multiplier', 'Use'],
    rows: [
      ['x1', 'Default — no boost.'],
      ['x2', 'Daily bonus or rare slot.'],
      ['x3', 'Event days.'],
      ['x5', 'Premium spins only.'],
      ['x10', 'Mythic-tier jackpot.'],
    ],
  },
  {
    title: 'LOCALIZATION CONTEXT VARIABLES',
    columns: ['Variable', 'Description'],
    rows: [
      ['{playerName}', "Replaced with the player's display name."],
      ['{amount}', 'Numeric amount in reward/cost messages.'],
      ['{currency}', 'Currency code in reward/cost messages.'],
      ['{gameName}', 'Display name of the relevant game.'],
      ['{position}', 'Tournament position (1, 2, 3, …).'],
    ],
  },
];
