const { loadGsFiles } = require('./__mocks__/loader');

const FILES = ['core/Core.js', 'core/Utilities.js'];

describe('Utilities', () => {
  beforeAll(() => {
    loadGsFiles(FILES);
  });

  beforeEach(() => {
    global.__resetSpreadsheet();
  });

  test('trimSheet_ deletes excess rows and columns', () => {
    const sheet = getOrCreateSheet('S');
    sheet.maxRows = 100;
    sheet.maxCols = 20;
    sheet._set(1, 1, 'h');
    sheet._set(2, 1, 'v');
    trimSheet_(sheet, 2, 1);
    expect(sheet.deleteCalls.rows.length).toBeGreaterThan(0);
    expect(sheet.deleteCalls.cols.length).toBeGreaterThan(0);
  });

  test('trimSheet_ keeps min 2 rows when usedRows = 1', () => {
    const sheet = getOrCreateSheet('S');
    sheet.maxRows = 50;
    sheet.maxCols = 5;
    trimSheet_(sheet, 1, 5);
    // Should request deletion to leave 2 rows, not 1.
    const totalRowsRemoved = sheet.deleteCalls.rows.reduce((acc, c) => acc + c.count, 0);
    expect(50 - totalRowsRemoved).toBe(2);
  });

  test('trimSheet_ never throws on null sheet', () => {
    expect(() => trimSheet_(null, 2, 2)).not.toThrow();
  });

  test('hasDataInColumn_ returns false for empty, true with data', () => {
    const sheet = getOrCreateSheet('S');
    sheet._set(1, 1, 'header');
    expect(hasDataInColumn_(sheet, 1, 2)).toBe(false);
    sheet._set(2, 1, 'value');
    expect(hasDataInColumn_(sheet, 1, 2)).toBe(true);
  });

  test('rowsEqual_ handles undefined, empty string, and type coercion', () => {
    expect(rowsEqual_(['a', 1], ['a', '1'])).toBe(true);
    expect(rowsEqual_(['a', undefined], ['a', ''])).toBe(true);
    expect(rowsEqual_(['a', null], ['a', ''])).toBe(true);
    expect(rowsEqual_(['a'], ['a', 'b'])).toBe(false);
    expect(rowsEqual_(null, ['a'])).toBe(false);
  });

  test('applyStripes_ alternates ROW_EVEN and ROW_ODD via setBackground calls', () => {
    const sheet = getOrCreateSheet('S');
    const calls = [];
    const origGetRange = sheet.getRange.bind(sheet);
    sheet.getRange = (...args) => {
      const r = origGetRange(...args);
      const origSetBg = r.setBackground.bind(r);
      r.setBackground = (color) => {
        calls.push(color);
        return origSetBg(color);
      };
      return r;
    };
    applyStripes_(sheet, 2, 4, 3);
    expect(calls).toEqual([ROW_EVEN, ROW_ODD, ROW_EVEN, ROW_ODD]);
  });
});
