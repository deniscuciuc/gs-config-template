# Release process

Releases are tag-driven. Pushing a `v*.*.*` tag lints, tests, builds both bundles, reads the
notes out of `CHANGELOG.md` and creates a GitHub release with the bundles attached.

Nothing is published to npm. `package.json` is `private` and stays that way — this is a
template you copy, not a package you depend on. The release exists so that someone can take
a working `bundle.gs` without cloning the repository and installing a toolchain.

## Versioning

Semantic versioning applied to the template runtime: `src/core/`, `scripts/`, and the plugin
API surface in `PluginApi.js`. The project layer under `src/project/` is a starting point
rather than an interface, and changes to it are not breaking.

Breaking means:

- renaming or removing anything documented in [plugins.md](plugins.md)
- changing the bundle's file order, since adopters do diff bundles
- changing the `__MigrationsHistory` shape, or anything that changes whether an existing
  migration is considered applied

Below 1.0 the API may change between minor versions. Say so in the changelog entry, and say
what porting it takes — adopters copied the code, so every breaking change is manual work
for them.

## Cutting a release

**1. Start from a green `main`.**

```
git switch main && git pull
pnpm verify
```

**2. Update the changelog.** Move everything under `## [Unreleased]` into a new dated
section, and update the link definitions at the bottom of the file:

```markdown
## [0.2.0] - 2026-10-01

[Unreleased]: https://github.com/deniscuciuc/gs-config-template/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/deniscuciuc/gs-config-template/compare/v0.1.0...v0.2.0
```

The release workflow reads that section and **fails if it is missing or empty**. Release
notes are written, never generated.

**3. Bump `version` in `package.json`** to match, and commit both:

```
git commit -am "chore: release v0.2.0"
```

**4. Tag and push.**

```
git tag -a v0.2.0 -m "v0.2.0"
git push origin main --follow-tags
```

**5. Watch it.**

```
gh run watch
```

The workflow re-runs the full `pnpm verify` rather than trusting CI, because a tag can be
pushed at a commit CI never saw.

## Verifying before you tag

```
pnpm verify
head -3 dist/bundle.gs
```

The header reports the build stamp and the file count. The stamp is the tag or short commit
rather than a timestamp, so the same sources produce a byte-identical bundle — which means
you can check a released artefact against a local build of its tag.

## If a release goes wrong

Delete the tag and the release, fix, and tag again:

```
gh release delete v0.2.0 --yes
git push --delete origin v0.2.0
git tag -d v0.2.0
```

This is only safe promptly. Once someone has downloaded a bundle, ship a `v0.2.1` instead —
a tag that changes content after the fact is worse than a superseded one.
