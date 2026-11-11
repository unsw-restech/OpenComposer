"""Start Open Composer on the test apps and open its pages in headless Chromium.

`serve(conf)` writes `conf` as the instance's `conf.yml` in a temporary
directory, links the app's code beside it and starts it with `rackup`, the
way Open OnDemand starts `config.ru`. The checkout's own `conf.yml.erb` is
never read or written. `conf` needs no `apps_dir`, `scheduler` or `data_dir`:
they default to `apps/`, `pbspro` and the temporary directory.
"""

import os
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[3]
APPS = Path(__file__).resolve().parent / "apps"
APP_FILES = ["config.ru", "run.rb", "lib", "views", "public"]


def _free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _wait_up(url, proc, log, timeout=30):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if proc.poll() is not None:
            raise RuntimeError(f"Open Composer exited:\n{log.read_text()}")
        try:
            urllib.request.urlopen(url, timeout=2)
            return
        except urllib.error.HTTPError:
            return  # It answers, even if with an error page.
        except OSError:
            time.sleep(0.2)
    raise RuntimeError(f"Open Composer did not start in {timeout}s:\n{log.read_text()}")


@pytest.fixture
def serve(tmp_path):
    """Return a function that starts Open Composer with a conf and gives its URL."""
    rackup = shutil.which("rackup")
    if rackup is None:
        pytest.fail("rackup is not on the PATH: install the gems in misc/Gemfile")
    procs = []

    def start(conf):
        instance = tmp_path / f"instance{len(procs)}"
        instance.mkdir()
        for name in APP_FILES:
            (instance / name).symlink_to(ROOT / name)
        instance_conf = {"apps_dir": str(APPS), "scheduler": "pbspro",
                         "data_dir": str(instance / "data"), **conf}
        (instance / "conf.yml").write_text(yaml.safe_dump(instance_conf))
        port = _free_port()
        log = instance / "rackup.log"
        with log.open("w") as out:
            proc = subprocess.Popen(
                [rackup, "-o", "127.0.0.1", "-p", str(port), "config.ru"],
                cwd=instance, stdout=out, stderr=subprocess.STDOUT,
                env={**os.environ, "RACK_ENV": "production"},
            )
        procs.append(proc)
        url = f"http://127.0.0.1:{port}"
        _wait_up(url + "/", proc, log)
        return url

    yield start
    for proc in procs:
        proc.terminate()
        proc.wait(timeout=10)
