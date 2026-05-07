/**
 * Minimal Jest mock of the Google Apps Script global services used by the
 * gs-config-template core module. Loaded via `setupFiles` in package.json
 * so each test file gets a fresh, isolated spreadsheet via __resetSpreadsheet().
 */

class FakeRange {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }
  getValues() {
    const out = [];
    for (let r = 0; r < this.numRows; r++) {
      const rowArr = [];
      for (let c = 0; c < this.numCols; c++) {
        rowArr.push(this.sheet._cell(this.row + r, this.col + c));
      }
      out.push(rowArr);
    }
    return out;
  }
  getValue() {
    return this.sheet._cell(this.row, this.col);
  }
  setValues(values) {
    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        this.sheet._set(this.row + r, this.col + c, values[r][c]);
      }
    }
    return this;
  }
  setValue(v) {
    this.sheet._set(this.row, this.col, v);
    return this;
  }
  setBackground() {
    return this;
  }
  setFontColor() {
    return this;
  }
  setFontWeight() {
    return this;
  }
  setFontStyle() {
    return this;
  }
  setFontSize() {
    return this;
  }
  setWrap() {
    return this;
  }
  setVerticalAlignment() {
    return this;
  }
  setHorizontalAlignment() {
    return this;
  }
  setNotes() {
    return this;
  }
  setNumberFormat() {
    return this;
  }
  insertCheckboxes() {
    return this;
  }
  setDataValidation() {
    return this;
  }
  clearDataValidations() {
    return this;
  }
  clearContent() {
    for (let r = 0; r < this.numRows; r++) {
      for (let c = 0; c < this.numCols; c++) {
        this.sheet._set(this.row + r, this.col + c, '');
      }
    }
    return this;
  }
  merge() {
    return this;
  }
}

class FakeSheet {
  constructor(name) {
    this.name = name;
    this.data = []; // rows of arrays
    this.maxRows = 1000;
    this.maxCols = 26;
    this.frozenRows = 0;
    this.hidden = false;
    this.columnWidths = {};
    this.deleteCalls = { rows: [], cols: [] };
  }
  getName() {
    return this.name;
  }
  setName(n) {
    this.name = n;
    return this;
  }
  _cell(r, c) {
    const row = this.data[r - 1];
    if (!row) return '';
    const v = row[c - 1];
    return v === undefined ? '' : v;
  }
  _set(r, c, v) {
    while (this.data.length < r) this.data.push([]);
    const row = this.data[r - 1];
    while (row.length < c) row.push('');
    row[c - 1] = v;
  }
  getLastRow() {
    let last = 0;
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i] || [];
      for (let j = 0; j < row.length; j++) {
        if (row[j] !== '' && row[j] !== null && row[j] !== undefined) {
          last = i + 1;
          break;
        }
      }
    }
    return last;
  }
  getLastColumn() {
    let last = 0;
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i] || [];
      for (let j = row.length - 1; j >= 0; j--) {
        if (row[j] !== '' && row[j] !== null && row[j] !== undefined) {
          if (j + 1 > last) last = j + 1;
          break;
        }
      }
    }
    return last;
  }
  getMaxRows() {
    return this.maxRows;
  }
  getMaxColumns() {
    return this.maxCols;
  }
  getRange(row, col, numRows, numCols) {
    return new FakeRange(this, row, col, numRows || 1, numCols || 1);
  }
  getDataRange() {
    const r = Math.max(1, this.getLastRow());
    const c = Math.max(1, this.getLastColumn());
    return new FakeRange(this, 1, 1, r, c);
  }
  appendRow(row) {
    const r = this.getLastRow() + 1;
    for (let c = 0; c < row.length; c++) this._set(r, c + 1, row[c]);
  }
  deleteRows(start, count) {
    this.deleteCalls.rows.push({ start, count });
    this.maxRows = Math.max(2, this.maxRows - count);
  }
  deleteColumns(start, count) {
    this.deleteCalls.cols.push({ start, count });
    this.maxCols = Math.max(1, this.maxCols - count);
  }
  deleteColumn(col) {
    this.deleteColumns(col, 1);
  }
  insertColumnAfter() {
    this.maxCols += 1;
  }
  setFrozenRows(n) {
    this.frozenRows = n;
  }
  setColumnWidth(c, w) {
    this.columnWidths[c] = w;
  }
  setRowHeight() {}
  hideSheet() {
    this.hidden = true;
  }
  clearContents() {
    this.data = [];
  }
  clearFormats() {}
}

class FakeSpreadsheet {
  constructor() {
    this.sheets = {};
    this.activeSheet = null;
  }
  getSheetByName(name) {
    return this.sheets[name] || null;
  }
  insertSheet(name) {
    if (this.sheets[name]) return this.sheets[name];
    const s = new FakeSheet(name);
    this.sheets[name] = s;
    return s;
  }
  deleteSheet(sheet) {
    if (sheet?.name) delete this.sheets[sheet.name];
  }
  setActiveSheet(s) {
    this.activeSheet = s;
  }
}

let _ss = new FakeSpreadsheet();

function _validationBuilder() {
  return {
    requireValueInList: function () {
      return this;
    },
    requireValueInRange: function () {
      return this;
    },
    setAllowInvalid: function () {
      return this;
    },
    setHelpText: function () {
      return this;
    },
    build: () => ({}),
  };
}

const ButtonSet = { OK: 'OK', OK_CANCEL: 'OK_CANCEL' };
const Button = { OK: 'OK', CANCEL: 'CANCEL' };

const _alerts = [];
const _prompts = [];

const SpreadsheetApp = {
  getActiveSpreadsheet: () => _ss,
  newDataValidation: _validationBuilder,
  getUi: () => ({
    alert: (...args) => {
      _alerts.push(args);
      return Button.OK;
    },
    prompt: (...args) => {
      _prompts.push(args);
      return Button.OK;
    },
    createMenu: (label) => {
      const items = [];
      const menu = {
        addItem: (l, f) => {
          items.push({ l, f });
          return menu;
        },
        addSeparator: () => {
          items.push('---');
          return menu;
        },
        addSubMenu: () => menu,
        addToUi: () => {},
        _items: items,
        _label: label,
      };
      return menu;
    },
    ButtonSet,
    Button,
  }),
  __ui: { _alerts, _prompts },
};

const Session = {
  getActiveUser: () => ({ getEmail: () => 'test@example.com' }),
};

const Logger = { log: () => {} };

const LanguageApp = {
  translate: (text, _src, target) => `[${target}] ${text}`,
};

global.SpreadsheetApp = SpreadsheetApp;
global.Session = Session;
global.Logger = Logger;
global.LanguageApp = LanguageApp;

global.__resetSpreadsheet = () => {
  _ss = new FakeSpreadsheet();
  _alerts.length = 0;
  _prompts.length = 0;
};

global.__getSpreadsheet = () => _ss;
global.__getAlerts = () => _alerts;
