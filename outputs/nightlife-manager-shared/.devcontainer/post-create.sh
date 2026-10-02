#!/usr/bin/env bash
set -euo pipefail
npm ci
npx --no-install playwright install --with-deps chromium
npm run doctor
