const migration_202601010001_initial_setup = {
  id: '202601010001_initial_setup',
  description: 'Create the Settings, Localization and _Reference sheets.',
  up: function () {
    createSettingsSheet_();
    createLocalizationSheet_();
    createReferenceSheet_();
  },
};
