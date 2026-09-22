# Security Policy

## Reporting a Vulnerability

**Please do not open a public issue for a security vulnerability.**

Report it through GitHub's private vulnerability reporting, which is the preferred channel:

<https://github.com/deniscuciuc/gs-config-template/security/advisories/new>

If you cannot use GitHub, email **denis@deniscuciuc.dev** instead.

Please include a description of the vulnerability and its impact, steps to reproduce or a
proof of concept, the affected file, and any suggested mitigation.

## What to Expect

| Stage | Target |
|---|---|
| Acknowledgement of your report | Within 48 hours |
| Initial assessment and severity triage | Within 5 working days |
| Fix released for a high or critical issue | Within 30 days of triage |
| Fix released for a moderate or low issue | Next scheduled release |

If you have not heard back within 48 hours, please follow up — an unanswered report usually
means it did not arrive.

## Supported Versions

| Version | Supported |
|---|---|
| 0.1.x   | Yes |
| < 0.1.0 | No  |

This repository is a template, not a package. There is nothing to patch in place: a fix
lands on `main` and in the next tagged release, and a project built from the template has to
port it. Only the latest tag receives security fixes.

## The thing to understand before you use this

A container-bound Apps Script runs as the person who authorises it, with the scopes they
grant. The bundle this template produces asks for access to the spreadsheet, and
`biome.jsonc` declares `UrlFetchApp` and `DriveApp` among its available globals because
plugins may legitimately want them. Pasting a bundle into a spreadsheet you own is
therefore closer to running a script on your Google account than to adding a formula.

That is a property of Apps Script, not a flaw in this template, and it is not something a
policy can fix. It does mean the only safe bundle is one you built yourself from sources you
have read. Build it; do not accept one.

## Scope

In scope, roughly in order of what matters here:

- **`src/core/MigrationRunner.js`** — a migration recorded as applied that did not run, or
  the reverse. The `__MigrationsHistory` sheet is the only thing standing between a re-run
  and duplicated or destroyed data, and it records *that* a migration ran, not what it did.
- **`src/core/PluginApi.js`** — the public facade. Anything that lets a plugin reach past
  the documented functions, or write to a sheet it was not given.
- **`scripts/build.js`** — a bundle whose contents do not match the sources it was built
  from. The bundle is what people paste; if it can be made to differ from `src/`, nothing
  downstream would notice.
- **`src/plugins/plugin_auto_translate.js`** — sheet content reaching `LanguageApp`.

Out of scope: everything under `examples/`, which exists to be read and deleted; Google Apps
Script and Google Sheets themselves; and who you grant edit access to your spreadsheet.

## Dependency Advisories

The bundle has no runtime dependencies — it ships no third-party code at all. The only
dependencies are Biome and Jest, both development-time.

Dependabot covers npm and GitHub Actions weekly. CodeQL runs on every push to `main` and
weekly. gitleaks scans the full history on every push and pull request, which matters here
because `.clasp.json` holds Apps Script OAuth credentials and is gitignored rather than
absent — a file people do sometimes commit by accident.

CodeQL analyses the sources because they are `.js`; when they were `.gs` it silently
analysed nothing. If you rename them back with `scripts/convert-ext.js`, you are giving that
up along with lint.
