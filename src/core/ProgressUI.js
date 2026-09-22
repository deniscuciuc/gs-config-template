/**
 * ProgressUI.gs — lightweight progress reporter for long-running tasks.
 *
 * GAS UI is modal-only, so this writes progress to a hidden status sheet
 * (__Progress) and to the Logger. Callers can use:
 *   var p = beginProgress_('Running migrations', total);
 *   p.update(i, 'current step');
 *   p.finish('Done');
 *
 * The status sheet has columns: Job | Step | Total | Percent | Message | UpdatedAtUtc
 */

const PROGRESS_SHEET_NAME = '__Progress';

function _ensureProgressSheet_() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(PROGRESS_SHEET_NAME);
  if (sheet) return sheet;
  sheet = ss.insertSheet(PROGRESS_SHEET_NAME);
  sheet
    .getRange(1, 1, 1, 6)
    .setValues([['Job', 'Step', 'Total', 'Percent', 'Message', 'UpdatedAtUtc']]);
  sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#37474F').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.hideSheet();
  trimSheet_(sheet, 2, 6);
  return sheet;
}

function beginProgress_(label, total) {
  var sheet = _ensureProgressSheet_();
  var safeTotal = Math.max(1, Number(total) || 1);
  var startedAt = new Date();
  var rowIdx = -1;

  function write(step, message) {
    try {
      var pct = Math.round((step / safeTotal) * 100);
      var row = [label, step, safeTotal, pct + '%', message || '', new Date().toISOString()];
      var lastRow = sheet.getLastRow();
      if (rowIdx < 0) {
        sheet.appendRow(row);
        rowIdx = lastRow + 1;
      } else {
        sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
      }
      Logger.log('[progress] ' + label + ' ' + step + '/' + safeTotal + ' ' + (message || ''));
    } catch (e) {
      Logger.log('[progress] ' + label + ' write failed: ' + e);
    }
  }

  write(0, 'started');

  return {
    update: function (step, message) {
      write(step, message);
    },
    finish: function (message) {
      write(safeTotal, (message || 'finished') + ' (' + _formatDuration_(startedAt) + ')');
    },
  };
}

function _formatDuration_(startedAt) {
  var ms = new Date().getTime() - startedAt.getTime();
  var s = Math.round(ms / 1000);
  if (s < 60) return s + 's';
  var m = Math.floor(s / 60);
  return m + 'm ' + (s % 60) + 's';
}
