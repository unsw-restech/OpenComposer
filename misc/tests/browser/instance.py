"""Start Open Composer on a conf, the way Open OnDemand starts `config.ru`.

`start(conf, workdir)` writes `conf` as the instance's `conf.yml` in
`workdir`, links the app's code beside it and starts it with `rackup`. The
checkout's own `conf.yml.erb` is never read or written. `conf` needs no
`apps_dir`, `scheduler` or `data_dir`: they default to the browser tests'
`apps/`, `pbspro` and `workdir/data`.

Run as a script, through `misc/tests/serve <conf.yml>`, it starts one
instance on that file's settings, prints its URL and log, and keeps it up
until interrupted, removing its directory on the way out.
"""

import os
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

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


def start(conf, workdir):
    """Start an instance in `workdir` on `conf`; return its URL, process and log."""
    rackup = shutil.which("rackup")
    if rackup is None:
        raise RuntimeError("rackup is not on the PATH: install the gems in misc/Gemfile")
    workdir = Path(workdir)
    for name in APP_FILES:
        (workdir / name).symlink_to(ROOT / name)
    instance_conf = {"apps_dir": str(APPS), "scheduler": "pbspro",
                     "data_dir": str(workdir / "data"), **conf}
    (workdir / "conf.yml").write_text(yaml.safe_dump(instance_conf))
    port = _free_port()
    log = workdir / "rackup.log"
    with log.open("w") as out:
        proc = subprocess.Popen(
            [rackup, "-o", "127.0.0.1", "-p", str(port), "config.ru"],
            cwd=workdir, stdout=out, stderr=subprocess.STDOUT,
            env={**os.environ, "RACK_ENV": "production"},
        )
    url = f"http://127.0.0.1:{port}"
    try:
        _wait_up(url + "/", proc, log)
    except BaseException:  # an interrupt mid-start too: never leave rackup up
        stop(proc)
        raise
    return url, proc, log


def stop(proc):
    """Stop an instance's rackup, killing it if it ignores SIGTERM for 10 s."""
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()


def main(argv):
    if len(argv) != 2:
        sys.exit("usage: misc/tests/serve <conf.yml>")
    conf = yaml.safe_load(Path(argv[1]).read_text()) or {}
    if not isinstance(conf, dict):
        sys.exit(f"{argv[1]}: a conf is a mapping of settings")
    # The instance runs in its own directory, so paths in the file are
    # resolved against the directory serve was run from.
    for key in ("apps_dir", "data_dir"):
        if key in conf:
            conf[key] = str(Path(conf[key]).expanduser().resolve())
    for sig in (signal.SIGTERM, signal.SIGHUP):
        signal.signal(sig, lambda *_: sys.exit(0))
    workdir = Path(tempfile.mkdtemp(prefix="opencomposer-serve-"))
    proc = None
    try:
        url, proc, log = start(conf, workdir)
        print(f"{url}\nlog: {log}", flush=True)
        code = proc.wait()
        # rackup stopped on its own: show why before its folder goes.
        sys.stderr.write(f"Open Composer exited with {code}:\n{log.read_text()}")
        sys.exit(code or 1)
    except KeyboardInterrupt:
        pass
    finally:
        if proc is not None and proc.poll() is None:
            stop(proc)
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    main(sys.argv)
