const migration_202604280001_initial_setup = {
  id: '202604280001_initial_setup',
  description: 'Create initial set of config sheets and the _Reference sheet.',
  up: function () {
    createLocalizationSheet_();
    createGamesSheet_();
    createTournamentsSheet_();
    createTournamentRewardsSheet_();
    createCyclicQuestsSheet_();
    createGuidesSheet_();
    createGuideStepsSheet_();
    createFortuneWheelConfigSheet_();
    createFortuneWheelSlotsSheet_();
    createAvatarsSheet_();
    createCheckInSheet_();
    createAdminPermissionsSheet_();
    createAdminConfigWritePermissionsSheet_();
    createReferenceSheet_();

    ensureRowsByKey_('AdminConfigWritePermissions', 'ConfigKey', [
      { ConfigKey: 'AdminPermissions', MinWriteLevel: 3, Notes: 'Admin access changes — super-admin only.' },
      { ConfigKey: 'AdminConfigWritePermissions', MinWriteLevel: 3, Notes: 'Write-permission rules — super-admin only.' },
      { ConfigKey: 'Tournaments', MinWriteLevel: 2, Notes: 'Operator can edit tournaments.' },
      { ConfigKey: 'Avatars', MinWriteLevel: 2, Notes: 'Operator can manage avatars.' },
      { ConfigKey: '*', MinWriteLevel: 1, Notes: 'Default fallback for all other configs.' },
    ]);
  },
};
