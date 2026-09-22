# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions apply to the template runtime under `src/core/`, to `scripts/`, and to the plugin
API. A project built from this template carries its own version; taking a newer template
version means porting the changes by hand, so entries say what that takes.

## [Unreleased]

## [0.1.0] - 2026-09-22

First public release.

A Google Apps Script template for projects that keep configuration in a Google Sheet: an
EF Core-style migration runner over a hidden `__MigrationsHistory` sheet, typed sheet
schemas with a documenting note on every column, a plugin extension point, a health
dashboard, and a build that concatenates it all into one file you paste into Apps Script.

### Added

- MIT licence, contribution guide, code of conduct and security policy.
- CI on GitHub Actions: lint and format, tests on Node 20.12, 22 and 24 plus a Windows leg,
  both bundles built and uploaded as artifacts.
- CodeQL analysis, gitleaks secret scanning over full history, and Dependabot for npm and
  GitHub Actions.
- Tag-driven releases that attach `dist/bundle.gs` and `dist/bundle.game-config.gs`, with
  notes read from this file.
- A documentation set under `docs/`, including
  [adapting-the-template.md](docs/adapting-the-template.md) — the checklist for turning this
  into your own project.
- `examples/game-config/`, a build overlay carrying a full game-configuration domain:
  fourteen sheets, eight migrations and a worked plugin.
- `scripts/export-gs.js`, which writes one `.gs` file per source file for people who would
  rather work file-by-file in the Apps Script editor than paste a bundle.
- `scripts/convert-ext.js`, which renames sources between `.gs` and `.js` — for bringing an
  existing Apps Script project into this tooling, or for leaving it.
- Overlay support in the bundler, so one core can build several projects.
- `PROJECT_NAME` and `MENU_TITLE` in the project layer: the two strings an adopter renames.

### Changed

- **Sources are now `.js` rather than `.gs`.** No tool in the pipeline could read `.gs`:
  Biome skipped all 25 runtime files silently despite the config listing them, and CodeQL
  would have done the same. The bundle is still `.gs`, and clasp maps local `.js` to remote
  `.gs` on push, so the Apps Script side is unchanged. To go back, see
  `scripts/convert-ext.js` — and know that lint and analysis go with it.
- `src/project/` is now a two-sheet skeleton instead of a complete game-configuration
  domain. The domain moved intact to `examples/game-config/`.
- The build stamp is the tag or commit rather than a timestamp, so the same sources produce
  a byte-identical bundle and a released bundle can be checked against its tag.
- The `ci` script is now `verify`. `pnpm ci` is a reserved pnpm command and never ran it.

### Fixed

- `src/project/SheetDefinitions` did not parse. Its doc comment contained
  `create*/configure*`, and the `*/` closed the comment block early, leaving the rest of the
  line as a syntax error — so any bundle containing it failed to load in Apps Script.
  `scripts/build.js` now parses the bundle before writing it.
- `scripts/build.js` omitted `SheetLayout` from `CORE_ORDER`, so it fell through the extras
  branch and loaded after `Menu` — contradicting the order documented in the same file. An
  unlisted core file is now a build failure rather than a silent append.
- `src/core/HealthDashboard` hardcoded a private product name into the layer the README
  describes as project-agnostic. It now reads `PROJECT_NAME` from the project layer.
- The README documented a GitLab pipeline deleted three commits earlier, linked to a file in
  a private sibling repository, named an internal shared pipeline, and printed a project
  tree with the wrong root directory and a missing file.
- The example migrations were registered in an order their ids did not reflect, with the
  initial setup dated eleven months after the migrations that followed it.

### Known limitations

Test coverage is not reported for `src/`. The harness loads sources with indirect `eval` to
mirror the Apps Script global namespace, and neither Jest coverage provider can see through
that — the number would be zero regardless of how many tests exist. `pnpm test:coverage`
reports on `scripts/`, where it means something.

`examples/game-config/` is a real domain rather than a stub, which is the point: forty
working columns document `applyHeaderNotes_` better than a paragraph can. It is also not
yours, and [docs/adapting-the-template.md](docs/adapting-the-template.md) assumes you will
delete it.

This is below 1.0 and stays there until someone other than the author has built a project
from it.

[Unreleased]: https://github.com/deniscuciuc/gs-config-template/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/deniscuciuc/gs-config-template/releases/tag/v0.1.0
