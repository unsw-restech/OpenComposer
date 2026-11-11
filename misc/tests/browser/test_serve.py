"""misc/tests/serve: one instance on a conf file, up until it is stopped.

These drive `serve` as a maintainer runs it, through urllib, not a browser.
"""

import shutil
import signal
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
SERVE = HERE.parent / "serve"


def _run(conf_file):
    """Start serve on `conf_file`; return it with the URL and log it prints."""
    proc = subprocess.Popen([str(SERVE), str(conf_file)], stdout=subprocess.PIPE, text=True)
    lines = iter(proc.stdout.readline, "")
    url = next(line for line in lines if line.startswith("http://")).strip()
    log = Path(next(lines).removeprefix("log: ").strip())
    return proc, url, log


def _status(url):
    try:
        return urllib.request.urlopen(url, timeout=5).status
    except urllib.error.HTTPError as e:
        return e.code


def _stop(proc):
    proc.send_signal(signal.SIGTERM)
    return proc.wait(timeout=15)


def test_serves_the_conf_until_stopped(tmp_path):
    conf = tmp_path / "conf.yml"
    conf.write_text(yaml.safe_dump({"platform_name": "Served"}))
    proc, url, log = _run(conf)
    try:
        page = urllib.request.urlopen(url + "/branding", timeout=5).read().decode()
    finally:
        code = _stop(proc)
    assert "Branding test | Served" in page
    assert code == 0
    assert not log.parent.exists()


def test_a_relative_apps_dir_resolves_from_where_serve_runs(tmp_path, monkeypatch):
    # An app only the relative folder has, so the default apps can't pass.
    shutil.copytree(HERE / "apps" / "branding", tmp_path / "myapps" / "relative-app")
    conf = tmp_path / "conf.yml"
    conf.write_text(yaml.safe_dump({"apps_dir": "myapps"}))
    monkeypatch.chdir(tmp_path)
    proc, url, _ = _run(conf)
    try:
        status = _status(url + "/relative-app")
    finally:
        _stop(proc)
    assert status == 200
