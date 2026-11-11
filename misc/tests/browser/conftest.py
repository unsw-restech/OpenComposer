"""Start Open Composer on the test apps and open its pages in headless Chromium.

`serve(conf)` starts an instance on `conf` in a temporary directory through
`instance.start`, which says what `conf` may leave out, and gives its URL.
"""

import pytest

import instance


@pytest.fixture
def serve(tmp_path):
    """Return a function that starts Open Composer with a conf and gives its URL."""
    procs = []

    def start(conf):
        workdir = tmp_path / f"instance{len(procs)}"
        workdir.mkdir()
        try:
            url, proc, _ = instance.start(conf, workdir)
        except RuntimeError as e:
            pytest.fail(str(e))
        procs.append(proc)
        return url

    yield start
    for proc in procs:
        instance.stop(proc)
