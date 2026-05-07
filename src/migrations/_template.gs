/**
 * Migration template — copy this file, rename to YYYYMMDDNNNN_description.gs
 *
 * Steps:
 *   1. Pick an id starting with the UTC date (YYYYMMDD) plus a 4-digit sequence.
 *   2. Implement up() — must be idempotent (safe to re-run).
 *      Call only create*, configure*, seed*, upsert*, ensure* helpers.
 *      Do NOT call runMigrations() or other migrations from here.
 *   3. Register the exported const in src/project/Config.gs ALL_MIGRATIONS array.
 */

// const migration_YYYYMMDDNNNN_description = {
//   id: 'YYYYMMDDNNNN_short_description',
//   description: 'Human-readable summary of what this migration does.',
//   up: function () {
//     // All logic here must be idempotent.
//     // e.g. createGamesSheet_();
//     //      ensureRowsByKey_('Games', 'Id', [{ Id: 'slots', Name: 'Slots', Genre: 'Slots', IsEnabled: true }]);
//   },
// };
