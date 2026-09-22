# Sheet schemas

A sheet is defined by a pair of functions, an entry in `EXPECTED_SHEET_SCHEMA`, and a name
in `ALL_SHEET_NAMES`. All three live in `src/project/`.

## The pair

```javascript
function createSettingsSheet_() {
  var sheet = getOrCreateSheet('Settings');
  _writeHeader_(sheet, ['Key', 'Value', 'Type', 'IsActive', 'Notes']);
  configureSettingsSheet_(sheet);
  return sheet;
}

function configureSettingsSheet_(sheet) {
  sheet = sheet || getSheet('Settings');
  if (!sheet) return;
  applyHeaderNotes_(sheet, [ /* one per column */ ]);
  setColumnWidths_(sheet, [320, 360, 120, 100, 360]);
  var rows = Math.max(1, sheet.getMaxRows() - 1);
  applyDropdownList_(sheet, 2, 3, rows, SETTING_TYPES, false, 'Pick one of: …');
  applyCheckboxColumn_(sheet, 2, 4, rows);
  trimSheet_(sheet, Math.max(2, sheet.getLastRow()), 5);
}
```

`create` makes the sheet if it is missing and writes the header. `configure` applies
everything that is presentation or validation, and is safe to re-run against a sheet full of
data — which is what **Repair All Sheets** does to fix drift after someone has reordered
columns or cleared a dropdown.

Both must be idempotent. `sheet = sheet || getSheet(...)` is the defaulting idiom used
throughout, so `configure` can be called on its own.

## Header notes are mandatory

```javascript
applyHeaderNotes_(sheet, [
  'Setting key in dotted lowercase, e.g. feature.signup.enabled. Required, unique.',
  'The value, written as text. Parse it according to Type.',
  'How to parse Value: string, number, boolean or json. Required.',
  'Checkbox. Uncheck to ignore the row without deleting it.',
  'Free-form note explaining what this setting controls.',
]);
```

The list length must match the header row exactly. Notes render as a hover tooltip on the
header cell, which makes them the only documentation the people editing your config will
ever encounter. Say whether the column is required, whether it is unique, what format it
takes, and what other sheet it points at.

## Validation

`EXPECTED_SHEET_SCHEMA` drives **Validate All Sheets** and the health dashboard:

```javascript
Settings: {
  columns: ['Key', 'Value', 'Type', 'IsActive', 'Notes'],
  required: ['Key', 'Type'],
},
```

`columns` is checked positionally against the header row — a renamed or reordered column is
an error. `required` is checked per data row for emptiness. Validation reports; it never
modifies.

## Dropdowns and checkboxes

| Helper | Use |
|---|---|
| `applyDropdownList_(sheet, row, col, n, values, allowInvalid, help)` | Fixed list of values |
| `applyDropdownRange_(sheet, row, col, n, range, allowInvalid, help)` | Values from another sheet's range — a foreign key |
| `applyCheckboxColumn_(sheet, row, col, n)` | Boolean column |
| `clearColumnValidation_(sheet, row, col, n)` | Remove validation, e.g. in a migration that changes a column's type |

`applyDropdownRange_` is how cross-sheet references get enforced in the spreadsheet itself,
so a bad foreign key cannot be typed in the first place. The game-config example uses it to
tie `Tournaments.GameId` to the `Games` sheet; see
[examples/game-config/project/SheetDefinitions.js](../examples/game-config/project/SheetDefinitions.js).

Pass `allowInvalid: false` to reject bad input rather than warn about it.

## Adding a sheet

1. Add the name to `ALL_SHEET_NAMES` in `src/project/Config.js`.
2. Write the `createXxxSheet_` / `configureXxxSheet_` pair in `SheetDefinitions.js`, with a
   header note for every column.
3. Add the entry to `EXPECTED_SHEET_SCHEMA`.
4. Add the create call to the `repairAllSheets()` action list.
5. Write a migration whose `up()` calls `createXxxSheet_()`, and register it.
6. Optionally add it to `SHEET_LAYOUT` for tab position and colour.

Missing step 4 is the common one: the sheet works, and then **Repair All Sheets** silently
skips it forever.

## Tab order and colour

```javascript
const SHEET_LAYOUT = [
  { name: 'Settings', color: '#4a86e8' },
  { name: 'Localization' },
];
```

Listed sheets come first in the given order; unlisted `_`-prefixed sheets follow
alphabetically; anything else is appended in its current order. Applied by **Reorder
Sheets** and at the end of **Repair All Sheets**.
