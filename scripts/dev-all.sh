#!/bin/sh
set -eu

cleanup() {
    if [ "${backend_pid:-}" != "" ]; then
        kill "$backend_pid" 2>/dev/null || true
    fi

    if [ "${frontend_pid:-}" != "" ]; then
        kill "$frontend_pid" 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

npm run dev:backend &
backend_pid=$!

sleep 1

npm run dev:frontend &
frontend_pid=$!

wait "$backend_pid" "$frontend_pid"
