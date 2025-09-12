# GeoIntel (Phase 1)

This repository contains an end-to-end Phase 1 implementation for GeoIntel — a security geospatial & OSINT platform.

## Contents
- `frontend/` — React frontend (upload UI, dashboard, map, results)
- `backend/` — Node/Express API skeleton with a mock processor
- `worker/` — Python worker stub that shows calls to model endpoints

## Quick start (developer)
1. Deploy backend to Render / any Node host:
   - Set `NODE_VERSION` to `22.x`
   - Start `backend` (node server.js)
2. Deploy frontend to Render / Vercel:
   - Set env var `VITE_API_BASE` or `REACT_APP_API_BASE` to backend base (e.g. https://your-backend/api)
   - Build & publish frontend `dist/` folder

## Important: Legal & Ethical
This system processes biometric data (faces). Obtain legal approval before processing in production. See `TERMS.md` and `PRIVACY.md`.

## Next steps (recommended)
- Replace mock processor with real worker that calls models (Hugging Face / on-prem).
- Add persistent DB (Postgres) and object storage (S3).
- Add authentication, access controls and audit logs.
