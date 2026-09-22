# Deploying

Two ways to get the code into Apps Script. Both produce `.gs` files on Google's side; they
differ in whether you manage one file or many.

## Paste a bundle

```
pnpm build
```

Open the spreadsheet, choose **Extensions → Apps Script**, replace the contents of `Code.gs`
with `dist/bundle.gs`, save, and reload the spreadsheet.

Best for a first look and for handing a finished config to someone who does not have the
repository. The whole runtime is one file, so there is nothing to keep in sync.

The bundle is a build artefact, not a source. Editing it in the Apps Script editor works
until the next `pnpm build`, at which point your edit is gone. Change `src/`, rebuild,
re-paste.

## Push with clasp

```
npm i -g @google/clasp
clasp login
clasp clone <script-id>     # or: clasp create --type sheets
pnpm export:gs
clasp push --force
```

`pnpm export:gs` writes one `.gs` file per source file into `dist/gs/`, keeping the
directory structure. Apps Script has no folders, so a file pushed at `core/Core.gs` is
simply *named* `core/Core` in the editor — the convention clasp uses, and it round-trips.

Better for iteration: you get the same file layout on both sides, and diffs in the editor
line up with diffs in the repository.

`clasp push` needs a `.clasp.json` holding the script id. It is gitignored, and should stay
that way — it carries credentials. See [SECURITY.md](../SECURITY.md).

You can also push the sources directly, skipping `export:gs`, since clasp converts local
`.js` to remote `.gs` on push. That pushes `_template.js` and everything under `examples/`
too unless you exclude them with `.claspignore`, which is why `export:gs` exists — it
applies the same exclusions as the bundler.

## Several environments

There is no shared pipeline to inherit here; the recipe is short enough to own.

Keep one `.clasp.json` per environment and swap the active one:

```bash
# .clasp.dev.json, .clasp.staging.json, .clasp.prod.json — all gitignored
cp .clasp.staging.json .clasp.json
pnpm build && pnpm export:gs && clasp push --force
```

In CI, write `.clasp.json` and the credentials from secrets at run time:

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm build && pnpm export:gs
- run: |
    echo "$CLASP_CREDENTIALS" > ~/.clasprc.json
    echo "{\"scriptId\":\"$CLASP_SCRIPT_ID\",\"rootDir\":\"dist/gs\"}" > .clasp.json
    npx @google/clasp push --force
  env:
    CLASP_CREDENTIALS: ${{ secrets.CLASP_CREDENTIALS }}
    CLASP_SCRIPT_ID: ${{ secrets.CLASP_SCRIPT_ID }}
```

`CLASP_CREDENTIALS` is the contents of `~/.clasprc.json` after `clasp login`. It is a
refresh token for the Google account that owns the script, so it deserves the same care as
any other long-lived credential: a dedicated account, and an environment protection rule on
anything that pushes to production.

This repository does not ship that workflow. Pushing to a spreadsheet is a decision about
your data, and a template should not make it for you.

## What does not carry across

Pushing code does not run migrations. After any deploy, open the spreadsheet and choose
**Sheet Config → Run Migrations** — or accept that the schema is whatever the last run left
behind.

Nothing about the spreadsheet's *contents* is in the repository. The sheets, the rows and
the migration history live in the spreadsheet; the repository only knows how to build them.
Copy a spreadsheet to get a copy of its data.
