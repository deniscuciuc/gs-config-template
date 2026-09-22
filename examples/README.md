# Examples

An example is a build overlay: a directory with the same shape as `src/project/` that
replaces the project and migration layers while reusing the same `src/core/`.

| Example | What it shows | Build |
|---|---|---|
| [game-config](game-config) | A complete game-configuration domain — fourteen sheets, cross-sheet range validation, eight migrations including two that rewrite existing data, and a plugin that bulk-generates rows | `pnpm build:example` |

```
node scripts/build.js --overlay examples/<name> --out dist/bundle.<name>.gs
```

These exist to be read and then deleted. They are not a dependency of anything in `src/`,
and `docs/adapting-the-template.md` assumes you remove the directory once you have stopped
referring to it.
