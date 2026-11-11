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
drives the page in headless Chromium through Playwright. `test_serve.py`
beside them tests `serve` (below) without a browser.

`misc/tests/run` runs the smoke tests and then the browser tests, as CI does
(`.github/workflows/tests.yml`); arguments go to pytest. It needs Ruby with the
gems in `misc/Gemfile`, from bundler or `gem install --user-install`, and
[uv](https://docs.astral.sh/uv/). It installs Playwright into a venv at
`~/.cache/opencomposer-tests/venv`, and Playwright installs Chromium into
`~/.cache/ms-playwright`. Chromium's system libraries need root: CI installs
them, and elsewhere run
`sudo ~/.cache/opencomposer-tests/venv/bin/playwright install-deps chromium-headless-shell`.

# Trying a conf by hand

`misc/tests/serve <conf.yml>` starts one instance on a conf file, the way
the browser tests do (`browser/instance.py`), and prints its URL and log
before it stays up. Use it to see what a page shows under some settings,
such as an `apps_dir` that doesn't exist. The browser tests' defaults fill in
what the file leaves out, and a relative `apps_dir` or `data_dir` resolves
from the directory `serve` runs in. Stop it with Ctrl-C or SIGTERM, which also
removes its directory.
