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
`header:` section, and an ERB conditional);
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

# Pinned gems

CI installs exactly the versions in `misc/Gemfile.lock`, in Bundler's frozen
mode (`BUNDLE_FROZEN` in `.github/workflows/tests.yml`), so a run that would
change the lock fails instead of resolving newer gems. This fork tracks that
one lock, while upstream ignores every `Gemfile.lock` (unsw-restech/iris#176).

Every gem in the lock is at the version Katana OnDemand 4.2.5-1 runs the
checkouts with, and CI's `ruby-version` is its Ruby. Its Passenger runs
`config.ru` on OnDemand's own Ruby and gems rather than a bundle.
`misc/gemcheck/ondemand.txt` holds the Ruby and gems the PUN loaded on
2026-11-23, and CI's "Gems match Katana OnDemand's" step
(`misc/gemcheck/compare.rb`) fails when CI's Ruby, or any gem the lock
locks, differs from it in version or platform. It names the PUN's other
gems, such as OnDemand's newer erb, without comparing them: CI loads them
from Ruby itself. Two points the lock doesn't
show:

- sqlite3 is the source gem, compiled with mini_portile2, as OnDemand
  installs it. Bundler picks the precompiled gem for CI's platform even
  though the lock lists only `ruby` (CI run 45107464826 installed
  `sqlite3 1.7.3 (x86_64-linux)`), so CI sets `BUNDLE_FORCE_RUBY_PLATFORM`
  to compile it too.
- rackup and webrick are used only by the tests, to serve the app.

## Reading the PUN's gems

Katana's login nodes have no OnDemand install, and `kod`, the OnDemand
node, refuses ssh from them (both seen on 2026-11-23, in #176's session), so the PUN's gems are read through a dev app,
`misc/gemcheck/config.ru`. It creates two paths in the IRIS maintainer's
Katana home and removes them after, so ask for their go-ahead first, naming
both, and for the page visit in step 2:

1. Copy `misc/gemcheck/config.ru` and `misc/gemcheck/report.rb` into
   `~/ondemand/dev/gemcheck/` on Katana.
2. The IRIS maintainer opens
   `https://kod.restech.unsw.edu.au/pun/dev/gemcheck` once. The page shows
   the report, and writes it to `~/gemcheck.txt`.
3. Replace everything below `ondemand.txt`'s comment line with
   `~/gemcheck.txt`, and give the comment line the OnDemand version and
   the date.
4. Remove `~/ondemand/dev/gemcheck/` and `~/gemcheck.txt`.

## Moving the lock

The lock follows OnDemand, so it moves when Katana OnDemand is upgraded:
read the PUN's gems again, then bring the lock and `ruby-version` to them.
Move each gem with `bundle update --conservative <gem>`, with
`BUNDLE_GEMFILE=misc/Gemfile` and the Bundler version the lock's
`BUNDLED WITH` names, until `bundle exec ruby misc/gemcheck/compare.rb`
passes. Commit `ondemand.txt`, the lock and `ruby-version` together, with
the old and new versions in the message, and merge once CI is green on it.
`--conservative` moves only that gem and the gems that pin it exactly:
sinatra brings sinatra-contrib and rack-protection along. In a dry run on
this lock, updating sinatra without the flag also moved rack and tilt.

# Trying a conf by hand

`misc/tests/serve <conf.yml>` starts one instance on a conf file, the way
the browser tests do (`browser/instance.py`), and prints its URL and log
before it stays up. Use it to see what a page shows under some settings,
such as an `apps_dir` that doesn't exist. The browser tests' defaults fill in
what the file leaves out, and a relative `apps_dir` or `data_dir` resolves
from the directory `serve` runs in. Stop it with Ctrl-C or SIGTERM, which also
removes its directory.

`serve` runs in production mode (`RACK_ENV=production`), as the browser tests
do, so an uncaught exception reads a bare "Internal Server Error". Open
OnDemand runs a system app in production mode too, but a sandbox app, under
**Develop**, in development mode, where the error page also names the exception
and its message, so check what a sandbox app shows on the platform itself.
