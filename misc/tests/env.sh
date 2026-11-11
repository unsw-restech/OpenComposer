# Sourced by misc/tests/run and misc/tests/serve: puts rackup on the PATH
# and sets $venv to the tests' Python venv, made or updated here.
# misc/tests/README.md says what it needs.
# shellcheck shell=bash

PATH="$PATH:$(ruby -e 'print Gem.user_dir')/bin"  # rackup from a --user-install

venv="${XDG_CACHE_HOME:-$HOME/.cache}/opencomposer-tests/venv"
uv venv -q --allow-existing "$venv"
uv pip install -q --python "$venv" -r "$(dirname "${BASH_SOURCE[0]}")/browser/requirements.txt"
