# OpenComposer fork — agent instructions

The README's "About this fork" says what the fork is for.

- **Tickets** live on `unsw-restech/iris`, not here: read its `docs/agents/issue-tracker.md` before the first `gh` call. A PR here closes its ticket as `Closes unsw-restech/iris#<n>`.
- **`gh` targets the parent repo in a fork**, OpenOnDemandJP, unless set otherwise. This clone has `gh repo set-default unsw-restech/OpenComposer`; set it again in any new clone.
- **Upstream comes in by release tag only**, one tag per merge, kept only once the browser tests pass on the merge. Never merge upstream `main` or `develop`.
- **Tests**: `misc/tests/run` runs every test, as CI does; `misc/tests/README.md` has the detail.
