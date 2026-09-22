## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## Why

<!-- The problem this solves. If it is a bug fix, what the wrong behaviour was. -->

## Checklist

- [ ] Tests cover the change, and `pnpm verify` passes locally
- [ ] Anything added under `src/core/` is project-agnostic — no sheet names, no domain data
- [ ] New migrations are idempotent, registered in `ALL_MIGRATIONS`, and have an ascending id
- [ ] New columns carry a header note in `applyHeaderNotes_`
- [ ] Public API changes are documented, and breaking ones are noted in `CHANGELOG.md`
