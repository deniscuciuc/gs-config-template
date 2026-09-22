const { loadGsFiles } = require('./__mocks__/loader');

const CORE_FILES = [
  'core/Core.js',
  'core/Utilities.js',
  'core/Validation.js',
  'core/ProgressUI.js',
  'core/MigrationRunner.js',
];

describe('MigrationRunner', () => {
  beforeAll(() => {
    loadGsFiles(CORE_FILES);
  });

  beforeEach(() => {
    global.__resetSpreadsheet();
    global.ALL_MIGRATIONS = [];
  });

  function makeMigration(id, body) {
    return { id, description: `${id} desc`, up: body || (() => {}) };
  }

  test('runs all pending migrations in order on empty history', () => {
    const order = [];
    global.ALL_MIGRATIONS = [
      makeMigration('001_a', () => order.push('a')),
      makeMigration('002_b', () => order.push('b')),
      makeMigration('003_c', () => order.push('c')),
    ];
    runMigrations();
    expect(order).toEqual(['a', 'b', 'c']);
    const ids = Array.from(getAppliedMigrationIds_());
    expect(ids).toEqual(['001_a', '002_b', '003_c']);
  });

  test('skips already-applied migrations', () => {
    const order = [];
    global.ALL_MIGRATIONS = [
      makeMigration('001_a', () => order.push('a')),
      makeMigration('002_b', () => order.push('b')),
    ];
    runMigrations();
    expect(order).toEqual(['a', 'b']);
    runMigrations(); // second run — should not re-execute
    expect(order).toEqual(['a', 'b']);
  });

  test('stops on first failure and does not record failed migration', () => {
    global.ALL_MIGRATIONS = [
      makeMigration('001_a', () => {}),
      makeMigration('002_boom', () => {
        throw new Error('boom');
      }),
      makeMigration('003_never', () => {
        throw new Error('should not run');
      }),
    ];
    runMigrations();
    const ids = Array.from(getAppliedMigrationIds_());
    expect(ids).toEqual(['001_a']);
  });

  test('showMigrationStatus does not throw and returns nothing', () => {
    global.ALL_MIGRATIONS = [makeMigration('001_a', () => {})];
    expect(() => showMigrationStatus()).not.toThrow();
    runMigrations();
    expect(() => showMigrationStatus()).not.toThrow();
  });

  test('recordMigration_ appends a row of the right shape', () => {
    recordMigration_('m1', 'desc one');
    const sheet = __getSpreadsheet().getSheetByName('__MigrationsHistory');
    const lastRow = sheet.getLastRow();
    expect(lastRow).toBe(2);
    const row = sheet.getRange(2, 1, 1, 4).getValues()[0];
    expect(row[0]).toBe('m1');
    expect(row[1]).toBe('desc one');
    expect(typeof row[2]).toBe('string');
    expect(row[3]).toBe('test@example.com');
  });

  test('getAppliedMigrationIds_ returns Set from sheet data', () => {
    recordMigration_('a', 'A');
    recordMigration_('b', 'B');
    const ids = getAppliedMigrationIds_();
    expect(ids instanceof Set).toBe(true);
    expect(Array.from(ids).sort()).toEqual(['a', 'b']);
  });
});
