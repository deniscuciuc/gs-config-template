const migration_202505050001_seed_default_check_in_schedule = {
  id: '202505050001_seed_default_check_in_schedule',
  description: 'Seed the default 7-day Check-In reward schedule.',
  up: function () {
    createCheckInSheet_();
    ensureRowsByKey_('CheckIn', 'Day', [
      {
        Day: 1,
        RewardCurrency: 'coins',
        RewardAmount: 100,
        BonusItemId: '',
        Notes: 'Day 1 — welcome.',
      },
      { Day: 2, RewardCurrency: 'coins', RewardAmount: 200, BonusItemId: '', Notes: '' },
      { Day: 3, RewardCurrency: 'gems', RewardAmount: 5, BonusItemId: '', Notes: '' },
      { Day: 4, RewardCurrency: 'coins', RewardAmount: 400, BonusItemId: '', Notes: '' },
      {
        Day: 5,
        RewardCurrency: 'tickets',
        RewardAmount: 1,
        BonusItemId: '',
        Notes: 'Tournament ticket.',
      },
      { Day: 6, RewardCurrency: 'coins', RewardAmount: 800, BonusItemId: '', Notes: '' },
      {
        Day: 7,
        RewardCurrency: 'gems',
        RewardAmount: 25,
        BonusItemId: 'avatar_starter',
        Notes: 'Bonus avatar on day 7.',
      },
    ]);
  },
};
