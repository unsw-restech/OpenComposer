# Smoke tests for form.yml processing

```
ruby misc/tests/run_tests.rb
```

`run_tests.rb` first executes `extract_samples.rb`, which extracts every
`form.yml` sample from `docs/application.html` into `samples/` (one
directory per sample, named `<N>_<section id>` where N is the sample's
position in the docs, e.g. `1_number`, `21_set`). The documentation is the
source of truth: `samples/` is
regenerated on every run, so the tests always reflect the current docs. A few
documentation blocks are fragments (an alternative `options:` list, the
`script:`/`submit:` sections, the `header:` section, and an ERB conditional);
`extract_samples.rb` wraps those into complete samples.

Each sample in `samples/` and each app in `sample_apps/` is then run through
the form generators in `lib/form.rb` and checked for:

1. YAML (or ERB + YAML) parses,
2. the `form:` section passes the same validations as `run.rb`,
3. HTML generation raises no exception and is non-empty,
4. every widget key appears as an element id in the generated HTML,
5. the generated JavaScript is syntactically valid (`node --check`;
   skipped if node is not installed).

`*.yml.erb` samples are rendered with `@OC_DIR_NAME == "Slurm"` so that
conditional samples take their branch.

These are smoke tests: they guarantee that every documented sample builds
cleanly, but they do not exercise browser-side behavior (clicking a widget
and observing the Dynamic Form Widget's effect). Test that layer in a real
browser.

# Browser tests

`browser/` holds this fork's browser tests. Each test starts Open Composer
with `rackup` on the forms in `browser/apps/`, using a `conf.yml` it writes to a
temporary directory (the checkout's own `conf.yml.erb` is never read), and
drives the page in headless Chromium through Playwright. CI runs them after
the smoke tests (`.github/workflows/tests.yml`).

To run them locally, install the gems in `misc/Gemfile` so that `rackup` is on
the `PATH`, then:

```
uv venv /tmp/oc-venv
uv pip install --python /tmp/oc-venv -r misc/tests/browser/requirements.txt
/tmp/oc-venv/bin/playwright install chromium-headless-shell
/tmp/oc-venv/bin/pytest misc/tests/browser
```

On a machine without Chromium's system libraries, `playwright install
--with-deps chromium-headless-shell` installs them (it needs `sudo`).
