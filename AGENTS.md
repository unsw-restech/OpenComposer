# OpenComposer fork — agent instructions

The README's "About this fork" says what the fork is for.

- **Tickets** live on `unsw-restech/iris`, not here: read its `docs/agents/issue-tracker.md` before the first `gh` call. A ticket with work in both repos is split across pushes, as that doc's "Split a ticket across pushes" says: merging a PR here closes the iris ticket it names after `Closes`, so a fork PR that leaves boxes open says `Part of unsw-restech/iris#<n>`.
- **`gh` targets the parent repo in a fork**, OpenOnDemandJP, unless set otherwise. This clone has `gh repo set-default unsw-restech/OpenComposer`; set it again in any new clone.
- **Upstream comes in by release tag only**, one tag per merge, kept only once the browser tests pass on the merge. Never merge upstream `main` or `develop`.
- **Tests**: `misc/tests/run` runs every test, as CI does; `misc/tests/README.md` has the detail.
- **CI's gems are pinned** in `misc/Gemfile.lock`, to Katana OnDemand's versions. Upgrade one gem per commit, merged once CI is green on it; `misc/tests/README.md`'s "Pinned gems" has the steps.
- **Trying a conf**: `misc/tests/serve <conf.yml>` shows what a page looks like under some settings. Run it as a background task, read its URL from the task's output, and stop the task when done.
