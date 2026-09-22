/**
 * Migration template — copy this file, rename to YYYYMMDDNNNN_description.js
 *
 * Steps:
 *   1. Pick an id starting with the UTC date (YYYYMMDD) plus a 4-digit sequence.
 *      Keep ids ascending: the bundle loads migration files in filename order, so an id
 *      that sorts out of sequence makes the bundle harder to read than it needs to be.
 *   2. Implement up() — must be idempotent (safe to re-run).
 *      Call only create*, configure*, seed*, upsert*, ensure* helpers.
 *      Do NOT call runMigrations() or other migrations from here.
 *   3. Register the exported const in ALL_MIGRATIONS in src/project/Config.js.
 *      That array is the execution order; the filename only sets bundle order.
 *
 * This file is commented out on purpose so it stays inert, and scripts/build.js excludes
 * it from every bundle by name.
 */

// const migration_YYYYMMDDNNNN_description = {
//   id: 'YYYYMMDDNNNN_short_description',
//   description: 'Human-readable summary of what this migration does.',
//   up: function () {
//     // All logic here must be idempotent.
//     // e.g. createSettingsSheet_();
//     //      upsertRowsByKey('Settings', 'Key', [
//     //        { Key: 'feature.signup.enabled', Value: 'TRUE', Type: 'boolean', IsActive: true },
//     //      ]);
//   },
// };
