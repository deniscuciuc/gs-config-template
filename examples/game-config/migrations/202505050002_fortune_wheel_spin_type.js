const migration_202505050002_fortune_wheel_spin_type = {
  id: '202505050002_fortune_wheel_spin_type',
  description: 'Add SpinType column to FortuneWheelSlots and default existing rows to "Free".',
  up: function () {
    createFortuneWheelSlotsSheet_();
    var added = ensureColumn('FortuneWheelSlots', 'SpinType', 'Free');
    if (added) {
      // Re-apply configuration so the new column gets its dropdown.
      configureFortuneWheelSlotsSheet_();
    }
  },
};
