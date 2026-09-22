/**
 * applySheetLayout_ decides tab order and colour. Its three ordering rules are documented
 * in src/core/SheetLayout.js and in docs/sheet-schemas.md, so they are worth pinning down.
 */
const { loadGsFiles } = require('./__mocks__/loader');

const FILES = ['core/Core.js', 'core/SheetLayout.js'];

function names() {
  return global.SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .map((s) => s.getName());
}

describe('applySheetLayout_', () => {
  beforeAll(() => {
    loadGsFiles(FILES);
  });

  beforeEach(() => {
    global.__resetSpreadsheet();
  });

  test('listed sheets come first, in the order given', () => {
    ['C', 'A', 'B'].forEach(getOrCreateSheet);
    applySheetLayout_([{ name: 'A' }, { name: 'B' }, { name: 'C' }]);
    expect(names()).toEqual(['A', 'B', 'C']);
  });

  test('unlisted underscore sheets follow, sorted alphabetically', () => {
    ['_Zed', 'Data', '_Alpha'].forEach(getOrCreateSheet);
    applySheetLayout_([{ name: 'Data' }]);
    expect(names()).toEqual(['Data', '_Alpha', '_Zed']);
  });

  test('remaining sheets are appended in their existing order', () => {
    ['Keep', 'First', 'Second'].forEach(getOrCreateSheet);
    applySheetLayout_([{ name: 'Keep' }]);
    expect(names()).toEqual(['Keep', 'First', 'Second']);
  });

  test('all three rules compose', () => {
    ['Other', '_Ref', 'Second', 'First', '_Hidden'].forEach(getOrCreateSheet);
    applySheetLayout_([{ name: 'First' }, { name: 'Second' }]);
    expect(names()).toEqual(['First', 'Second', '_Hidden', '_Ref', 'Other']);
  });

  test('a colour is applied only where the entry carries one', () => {
    ['A', 'B'].forEach(getOrCreateSheet);
    applySheetLayout_([{ name: 'A', color: '#4a86e8' }, { name: 'B' }]);
    expect(getSheet('A').tabColor).toBe('#4a86e8');
    expect(getSheet('B').tabColor).toBeUndefined();
  });

  test('a sheet named in the layout but absent is skipped, not created', () => {
    getOrCreateSheet('A');
    applySheetLayout_([{ name: 'Ghost' }, { name: 'A' }]);
    expect(names()).toEqual(['A']);
  });

  test('a duplicate entry does not place the sheet twice', () => {
    ['A', 'B'].forEach(getOrCreateSheet);
    applySheetLayout_([{ name: 'A' }, { name: 'A' }, { name: 'B' }]);
    expect(names()).toEqual(['A', 'B']);
  });

  test('an empty layout leaves non-underscore sheets in place', () => {
    ['A', '_Ref', 'B'].forEach(getOrCreateSheet);
    applySheetLayout_([]);
    expect(names()).toEqual(['_Ref', 'A', 'B']);
  });
});
