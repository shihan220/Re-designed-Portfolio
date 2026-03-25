# Backend Scope

This branch now includes a minimal local backend for the portfolio.

## What it does

- serves `GET /health` on `http://127.0.0.1:8787/health`
- serves a WebSocket server on `ws://127.0.0.1:8787`
- sends the `init` payload expected by the frontend
- handles `whispersInsert`, `cookiesInsert`, `cataclysmInsert`, and `circuitInsert`
- keeps state in memory for local development

## Run commands

- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run dev:all`

## Main file

- `backend/server.js`
