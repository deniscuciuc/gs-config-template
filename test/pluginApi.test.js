/**
 * PluginApi is the facade docs/plugins.md promises is stable, and the only surface plugins
 * are allowed to call. Nothing tested it.
 */
const { loadGsFiles } = require('./__mocks__/loader');

const FILES = ['core/Core.js', 'core/Utilities.js', 'core/ProgressUI.js', 'core/PluginApi.js'];

function seed(name, rows) {
  const sheet = getOrCreateSheet(name);
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  return sheet;
}

describe('PluginApi', () => {
  beforeAll(() => {
    loadGsFiles(FILES);
  });

  beforeEach(() => {
    global.__resetSpreadsheet();
  });

  describe('readRows', () => {
    test('returns one header-keyed object per data row', () => {
      seed('S', [
        ['Key', 'Value'],
        ['a', '1'],
        ['b', '2'],
      ]);
      const rows = readRows('S');
      expect(rows).toHaveLength(2);
      expect(rows[0].Key).toBe('a');
      expect(rows[1].Value).toBe('2');
    });

    test('exposes the 1-based sheet row as _row, so callers can write back', () => {
      seed('S', [['Key'], ['a'], ['b']]);
      expect(readRows('S').map((r) => r._row)).toEqual([2, 3]);
    });

    test('returns an empty array for a missing sheet rather than throwing', () => {
      expect(readRows('Nope')).toEqual([]);
    });

    test('returns an empty array for a header-only sheet', () => {
      seed('S', [['Key', 'Value']]);
      expect(readRows('S')).toEqual([]);
    });
  });

  describe('writeRows', () => {
    test('replaces data rows and leaves the header alone', () => {
      seed('S', [
        ['Key', 'Value'],
        ['old', '1'],
      ]);
      writeRows('S', [
        ['new', '2'],
        ['also', '3'],
      ]);
      const rows = readRows('S');
      expect(rows.map((r) => r.Key)).toEqual(['new', 'also']);
    });

    test('throws on a missing sheet, because a silent no-op would lose data', () => {
      expect(() => writeRows('Nope', [['a']])).toThrow(/Sheet not found/);
    });
  });

  describe('upsertRowsByKey', () => {
    test('updates a matching row in place and appends a new one', () => {
      seed('S', [
        ['Key', 'Value'],
        ['a', '1'],
      ]);
      const result = upsertRowsByKey('S', 'Key', [
        { Key: 'a', Value: '99' },
        { Key: 'b', Value: '2' },
      ]);
      expect(result).toEqual({ updated: 1, appended: 1 });
      const rows = readRows('S');
      expect(rows).toHaveLength(2);
      expect(rows.find((r) => r.Key === 'a').Value).toBe('99');
    });

    test('is idempotent — the migration contract depends on this', () => {
      seed('S', [
        ['Key', 'Value'],
        ['a', '1'],
      ]);
      const rows = [{ Key: 'b', Value: '2' }];
      upsertRowsByKey('S', 'Key', rows);
      upsertRowsByKey('S', 'Key', rows);
      upsertRowsByKey('S', 'Key', rows);
      expect(readRows('S')).toHaveLength(2);
    });

    test('fills columns the input omits rather than shifting them', () => {
      seed('S', [['Key', 'Value', 'Notes']]);
      upsertRowsByKey('S', 'Key', [{ Key: 'a', Notes: 'n' }]);
      const row = readRows('S')[0];
      expect(row.Value).toBe('');
      expect(row.Notes).toBe('n');
    });

    test('throws when the key column is not in the header', () => {
      seed('S', [['Key', 'Value']]);
      expect(() => upsertRowsByKey('S', 'Missing', [{ Missing: 'x' }])).toThrow(
        /Key column not found/
      );
    });

    test('throws on a missing sheet', () => {
      expect(() => upsertRowsByKey('Nope', 'Key', [])).toThrow(/Sheet not found/);
    });
  });

  describe('ensureColumn', () => {
    test('adds a column that is absent and reports that it did', () => {
      seed('S', [['Key', 'Value']]);
      expect(ensureColumn('S', 'Extra')).toBe(true);
      expect(getSheet('S').getRange(1, 3, 1, 1).getValue()).toBe('Extra');
    });

    test('is a no-op when the column already exists', () => {
      seed('S', [['Key', 'Value']]);
      expect(ensureColumn('S', 'Value')).toBe(false);
    });

    test('returns false for a missing sheet rather than throwing', () => {
      expect(ensureColumn('Nope', 'X')).toBe(false);
    });
  });

  describe('translateBatch', () => {
    test('translates non-empty entries and passes empty ones straight through', () => {
      const out = translateBatch(['hello', '', '  '], 'en', 'ru');
      expect(out).toHaveLength(3);
      expect(out[1]).toBe('');
      expect(out[2]).toBe('');
    });

    test('returns an empty array for empty input, making no calls', () => {
      expect(translateBatch([], 'en', 'ru')).toEqual([]);
      expect(translateBatch(null, 'en', 'ru')).toEqual([]);
    });

    test('a failure on one entry does not abort the batch', () => {
      const original = global.LanguageApp.translate;
      global.LanguageApp.translate = (text) => {
        if (text === 'boom') throw new Error('service failure');
        return `${text}-translated`;
      };
      try {
        const out = translateBatch(['ok', 'boom', 'fine'], 'en', 'ru');
        expect(out[0]).toBe('ok-translated');
        expect(out[1]).toBe('');
        expect(out[2]).toBe('fine-translated');
      } finally {
        global.LanguageApp.translate = original;
      }
    });
  });
});
