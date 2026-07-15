# Deployment Guide

Target: **Railway** (not Vercel — see rationale below). This gets you a real
public `https://...` URL, which the ASP registration's `endpoint` field
requires (localhost/private IPs/placeholders are rejected, and it's permanent
once set — see `docs/INTEGRATION_LOG.md` §4).

## Why not Vercel

Vercel runs serverless functions — spun up per-request, torn down right after.
`InvoiceService.createInvoice` calls `Web3Service.watchForPayment`, which opens
a **persistent** on-chain event listener (`publicClient.watchContractEvent`)
that needs to stay alive waiting for a payment. Serverless can't hold that open
between requests — the listener dies the moment the function returns, and
incoming payments never get detected. This isn't a style preference, it breaks
the app's core feature. Railway/Render/Fly.io all run an always-on Node
process instead, which is what this needs.

## Steps (Railway)

1. Push this repo to GitHub if not already there.
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → select this repo.
3. Set the **root directory** to `solofi-apps/` if Railway asks (the repo also contains the separate `solofi-contract/` folder — don't deploy that).
4. Railway auto-detects Node.js. Build/start commands already match `package.json`:
   - Build: `npm run build` (runs `tsc -p tsconfig.json`, outputs to `dist/`)
   - Start: `npm run start` (runs `node dist/index.js`)
5. Set environment variables in Railway's dashboard — copy every key from `.env.example`, filled with real values (see `docs/INTEGRATION_LOG.md` §3 for where each one came from). Do **not** commit `.env` — it's gitignored, values must be re-entered in Railway's UI directly.
   - `PORT` — Railway injects its own `PORT` env var automatically; our code already reads `process.env.PORT` via `src/config/env.ts`, no changes needed.
6. Deploy. Railway gives a URL like `https://solofi-apps-production.up.railway.app`.
7. Verify before using it anywhere:
   ```bash
   curl https://<your-railway-url>/health
   # should return {"status":"ok"}
   curl -X POST https://<your-railway-url>/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   # should return all 4 tools
   ```
8. Use `https://<your-railway-url>/mcp` as the ASP registration's endpoint field (see `docs/INTEGRATION_LOG.md` §4 for where registration is up to).

## Post-deploy: x402 payment credentials

If registering the A2MCP service as paid (not free), `OKX_API_KEY`/`OKX_SECRET_KEY`/`OKX_PASSPHRASE`
also need to be set in Railway's env vars — get these from the OKX Developer
Portal (`web3.okx.com/onchainos/dev-portal`), **not** the same as
`OKX_AI_API_KEY`/`OKX_AI_AGENT_ID`. Without them, `/mcp` still works — it just
serves for free (see the `[x402] payment middleware disabled` warning in logs,
confirms it degraded gracefully rather than crashing).

## Alternative: Render or Fly.io

Same requirements apply (always-on process, not serverless). Both work
identically for this app's needs — use whichever the team already has an
account with. The build/start commands above are the same regardless of host.
