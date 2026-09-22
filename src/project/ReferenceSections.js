/**
 * ReferenceSections.js — content for the `_Reference` sheet.
 *
 * Plain data. The renderer lives in src/core/ReferenceSheet.js and never changes; this is
 * the half you rewrite for your own domain. Each section is one object, and adding one is
 * the whole job — there is no per-section formatting code to copy.
 *
 * The `_Reference` sheet is where the people editing config look things up without asking
 * you. Document the formats and enumerations that are not obvious from a column header.
 */

const REFERENCE_SECTIONS = [
  {
    title: 'SETTING TYPES',
    columns: ['Type', 'How Value is parsed'],
    rows: [
      ['string', 'Used as-is.'],
      ['number', 'Parsed as a decimal number. Use a dot for the decimal separator.'],
      ['boolean', 'TRUE or FALSE, case-insensitive.'],
      ['json', 'Parsed as JSON. Invalid JSON is a validation error.'],
    ],
  },
  {
    title: 'SETTING KEY CONVENTION',
    columns: ['Pattern', 'Example'],
    rows: [
      ['<area>.<thing>.<property>', 'feature.signup.enabled'],
      ['<area>.<thing>.<property>', 'limits.upload.maxBytes'],
    ],
  },
  {
    title: 'LOCALE COLUMNS',
    columns: ['Column', 'Meaning'],
    rows: [
      ['en', 'Source language. Everything else is translated from this column.'],
      ['ru', 'Added as an example of a target locale — add or remove columns as needed.'],
    ],
  },
];
