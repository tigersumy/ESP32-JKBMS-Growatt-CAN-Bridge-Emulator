#!/bin/bash
# Script to run Datouboss Web Dashboard
cd "$(dirname "$0")"

if [ -f "web_dashboard/.env" ]; then
    export $(grep -v '^#' web_dashboard/.env | xargs)
fi

PYTHON_BIN="${PYTHON_BIN:-python3}"
"$PYTHON_BIN" web_dashboard/server.py
