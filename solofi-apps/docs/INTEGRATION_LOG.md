# SoloFi CFO — Integration Log

Working log of the OKX/X Layer integration work done after the initial TypeScript
rewrite (commit `b40fd00`). Read this before touching `.env`, `src/mcp/`, or
`src/infrastructure/web3.config.ts` — it explains *why* things are shaped the way
they are, not just what the code does. Written so a teammate (or an agent acting
for one) can pick up context without re-deriving it.

Deadline: OKX.AI Genesis Hackathon, **2026-07-17**.

## 1. Architecture decision: MCP adapter added alongside the existing webhook

**What changed:** `src/mcp/server.ts` + a `POST /mcp` route in `src/index.ts`,
exposing the same 4 intents (`createInvoice`, `setPocketRule`, `queryBalance`,
`queryCashflow`) as real MCP (Model Context Protocol) tools — the open standard
Claude itself uses, JSON-RPC 2.0 with `tools/list`/`tools/call`.

**Why:** OKX's own ASP (Agent Service Provider) dev-docs
(`web3.okx.com/onchainos/dev-docs/okxai/howtomcp`) link out to Cloudflare's
"remote MCP server" guide when describing a compliant ASP endpoint — meaning
OKX.AI's A2MCP integration mode expects a real MCP server, not a bespoke chat
webhook. `src/controllers/webhook.controller.ts` + `src/services/AiService.ts`
(Gemini-based intent routing) were the original assumption before this was
confirmed; they're still correct for a different reason (see below), so both
paths now exist:

- **`webhook.controller.ts` + `AiService`** — Gemini does NL → intent routing.
  Kept as the **guaranteed demo path**: works standalone, fully in our control,
  no dependency on OKX's marketplace review landing in time before judging.
- **`src/mcp/server.ts`** — spec-compliant MCP server for real ASP registration.
  OKX's own agent is expected to be the MCP *client* calling these tools with
  already-structured arguments (their agent does the NL understanding on their
  side), so no LLM is used on our side in this path.

This was a deliberate call given the 2-day runway to the deadline: a full
rewrite betting everything on the untested MCP path was judged too risky (see
reasoning transcript — asked "what would an OKX judge want to see" and answered
with "working demo beats a paper-perfect protocol implementation that can't be
shown live"). Both paths call the exact same domain services underneath
(`InvoiceService`, `PocketService`, `AdvisorService`), so there's no logic
duplication, just two entry points.

**Known gap:** OKX's docs never published how a caller's identity (wallet/session)
is carried on an MCP `tools/call` request — no auth-context example was
reachable anywhere in their public docs. Every MCP tool in `src/mcp/server.ts`
takes an explicit `user_wallet` string argument as the best-guess contract,
mirroring the same wallet → user mapping `webhook.controller.ts` already uses via
`UserRepository.findOrCreateByWallet`. This is isolated to one file
(`src/mcp/server.ts`) so it's a small change once OKX's real auth-context shape
is confirmed (e.g. if it turns out to be a Bearer token / OAuth flow instead —
the MCP TypeScript SDK supports that natively, see references below).

## 2. Real bugs found and fixed by actually running the server

Typecheck and unit tests (mocked repositories) don't catch integration bugs.
Booting the server against real `.env` values surfaced two:

1. **Crash on malformed `AGENT_WALLET_PRIVATE_KEY`.** `web3.config.ts` only
   guarded against the key being *unset* (falsy check), not *invalid* —
   viem's `privateKeyToAccount` throws synchronously on a bad hex string,
   which crashed the whole process at boot instead of degrading to read-only
   mode. Fixed: `loadAgentAccount()` now wraps the call in try/catch and logs a
   warning, matching the "boot in read-only mode without a funded wallet"
   comment that was already there for the unset case.

2. **Supabase errors rendered as `"[object Object]"`.** Every repository did
   `if (error) throw error;` where `error` is Supabase's `PostgrestError` — a
   plain object, not an `Error` instance. Anything downstream that does
   `String(err)` (the MCP SDK's tool-error formatting does exactly this) loses
   all detail. Fixed via `src/infrastructure/supabaseError.ts` —
   `assertNoSupabaseError(error, context)` wraps into a real `Error` with the
   original message + details preserved. Applied across all 4 repositories
   (`InvoiceRepository`, `PocketRepository`, `TransactionLogRepository`,
   `UserRepository`).

Both were only found by booting the real server and hitting `/mcp` with actual
tool calls — not by typecheck or the mocked unit test suite. Worth remembering
next time something looks "done": run it for real before believing it.

3. **`gemini-1.5-flash` retired — 404 on `generateContent`.** Discovered only
   after a real deploy to Railway: `AiService.ts` hardcoded `MODEL_NAME =
   'gemini-1.5-flash'`, which returned `404 This model ... is no longer
   available to new users` in production (the legacy `@google/generative-ai`
   SDK itself is also fully deprecated upstream — EOL 2025-11-30 — though the
   package still works for REST calls against models it can reach). Root-caused
   by querying this exact API key's live model list
   (`GET /v1beta/models`) and testing `generateContent` directly against
   candidates via curl rather than guessing from docs. First swapped to
   `gemini-2.5-flash` (still listed in `ListModels` for this key) — that also
   404'd with the same "no longer available to new users" message, proving
   `ListModels` is stale/lies for this account tier. Settled on the alias
   `gemini-flash-latest` (currently resolves to `gemini-3.5-flash` under the
   hood) specifically so this can't rot again before the deadline — verified
   both plain `generateContent` and function-calling (`tools`) work correctly
   against it via direct curl before deploying. Fixed in `src/services/AiService.ts`.

## 3. `.env` — what's filled and where each value came from

Do **not** put secret values in this file or in git. This section documents
*provenance* only — check `.env` itself (gitignored) for actual values.

| Variable | Status | Source |
|---|---|---|
| `GEMINI_API_KEY` | ✅ filled | Google AI Studio (real key, provided directly) |
| `SUPABASE_URL` | ✅ filled | Supabase dashboard → Connect → **Server** tab → Project URL (note: initially left as the literal placeholder `your-project.supabase.co` — caused a `ENOTFOUND` error until corrected) |
| `SUPABASE_PUBLISHABLE_KEY` | ✅ filled | Supabase dashboard, same Connect → Server tab. Not currently consumed by any backend code (server-only client uses the secret key) — kept for a future client-side use |
| `SUPABASE_SECRET_KEY` | ✅ filled | Supabase dashboard, same tab. **Note:** Supabase migrated off the old `anon`/`service_role` key names to `sb_publishable_...`/`sb_secret_...` — our code/`.env.example` were updated to match (see `src/config/env.ts`, `src/infrastructure/supabase.client.ts`). If you see old `SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` naming anywhere, it's stale. |
| `AGENT_WALLET_PRIVATE_KEY` | ✅ filled | Freshly generated via `viem/accounts` `generatePrivateKey()`, written directly into `.env` by a throwaway script (never printed to any file/log except once directly to the human operator on request). Address: see `.env` or ask — it's public, safe to share: wallet controls test funds only. |
| `X_LAYER_RPC_URL` | ✅ filled | `https://testrpc.xlayer.tech` — found via X Layer's testnet faucet UI auto-filling Rabby wallet's network config; confirmed live via `eth_chainId` JSON-RPC call |
| `X_LAYER_CHAIN_ID` | ✅ filled | `1952` — **not** the deprecated chain `195` that ChainList/OKLink still list as "(Sunset)". Confirmed via Rabby showing "X Layer Testnet(1952)" after a real faucet claim, then cross-checked via `chainlist.org/chain/1952` and a live `eth_chainId` RPC call (`0x7a0` = 1952). |
| `USDC_ADDRESS` | ✅ filled | `0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d` (testnet `USDC_TEST`) — read directly off the X Layer testnet block explorer (`oklink.com/xlayer-test`) token-balance table after claiming from the faucet |
| `USDT_ADDRESS` | ✅ filled | `0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c` (testnet `USDT₮0`) — same explorer lookup. Symbol matches "USD₮0" seen in OKX's own x402 payment example in their A2MCP docs, cross-confirming this is the intended token. |
| `OKX_AI_API_KEY` | ❌ placeholder | Requires ASP registration — see §4, in progress |
| `OKX_AI_AGENT_ID` | ❌ placeholder | Same as above |
| `SUPABASE_URL` schema | ✅ migrated | `src/database/migrations/001_initial_schema.sql` run successfully via Supabase SQL Editor (dashboard) — creates `users`, `invoices`, `pockets`, `pocket_rules`, `transaction_logs`, all RLS-enabled |

**X Layer wallet funding (testnet):** the generated `AGENT_WALLET_PRIVATE_KEY` wallet
(`0x9e008a07507dA48a99EfDbc7d7eE2a237d797Da3`) was funded via X Layer's testnet
faucet (`web3.okx.com/xlayer/faucet`) — claimed 0.2 OKB (gas) + 10 USDC_TEST +
10 USDT₮0. Verified end-to-end: `Web3Service.getBalance` correctly reads `10`
for both tokens directly off-chain (not just off the explorer), confirming
`USDC_ADDRESS`/`USDT_ADDRESS` in `.env` are correct and the RPC config works.

**Note on RLS:** the migration's RLS policies use `auth.uid() = user_id`, tied to
Supabase Auth. Our backend never calls Supabase Auth — identity is wallet-based
only, resolved via `UserRepository.findOrCreateByWallet` — and writes through
the *secret* key, which bypasses RLS entirely. So these policies are currently
inert for our own backend; they'd only matter if something else connects using
the *publishable* key with an actual Supabase Auth session later.

## 4. OKX ASP registration — in progress

**Important distinction discovered while doing this — two separate wallets exist now:**

| | X Layer wallet (`AGENT_WALLET_PRIVATE_KEY`) | Agentic Wallet |
|---|---|---|
| Address | `0x9e008a07507dA48a99EfDbc7d7eE2a237d797Da3` | `0xe21aa6c2990e5d996ddacea74643782d0f564e0a` (EVM), `EDLb8ouYw3QibVNjkwV4JAs5CkkumDLnK7jFsSwX2o3v` (Solana) |
| Created by | Us, locally, `viem/accounts generatePrivateKey()` | OKX's Onchain OS, on email login |
| Key custody | In our `.env`, fully self-controlled | Inside OKX's TEE (secure enclave) — not exportable by us, not even by the CLI |
| Purpose | **Our backend's actual operating wallet** — `Web3Service` reads this from `.env`, uses it to receive invoice payments and execute pocket-split transfers on X Layer | **Identity within the OKX.AI agent marketplace** — owns the ASP registration, holds agent reputation, is the account the `onchainos` CLI operates as |

Both are needed, they don't compete. When ASP pricing/`payTo` is configured
during registration, expect that to point at the X Layer wallet (the one that
actually receives money); the Agentic Wallet is the account that *owns* the
registration.

**Real registration mechanics (corrected from initial guess):** the OKX dev-docs
step "Install Onchain OS" does **not** mean a separate CLI binary download step
in the user-facing tutorial — it's just `npx skills add okx/onchainos-skills
--yes -g`, which installs *skill markdown files* (agent instructions) under
`~/.agents/skills/okx-*`, symlinked into Claude Code's skill directory. The
actual `onchainos` CLI binary is a separate Rust binary that isn't published to
npm and has no documented one-line installer — it had to be fetched directly
from GitHub Releases:

```powershell
gh release download v4.2.4 --repo okx/onchainos-skills `
  --pattern "onchainos-x86_64-pc-windows-msvc.exe" --pattern "checksums.txt" `
  --dir "$env:USERPROFILE\.local\bin"
# verify SHA256 against checksums.txt before running — see conversation for the exact hash used
Copy-Item onchainos-x86_64-pc-windows-msvc.exe onchainos.exe
```

(`installer-checksums.txt` in that same release is for `install.sh`/`install.ps1`
wrapper scripts that are hosted elsewhere, not bundled as release assets —
irrelevant once you have the binary directly; use `checksums.txt` instead.)

**Progress so far:**
1. ✅ Skills installed (`okx-ai`, `okx-agentic-wallet`, `okx-agent-payments-protocol`, etc.)
2. ✅ `onchainos` binary installed + verified + `onchainos preflight --skill-version 4.2.4` passing (`integrity: "ok"`, version current)
3. ✅ Logged into Agentic Wallet via email OTP (`wallet login <email>` → `wallet verify <code>`) — new account created, EVM address `0xe21aa6c2990e5d996ddacea74643782d0f564e0a`
4. ✅ Consented to marketplace terms (`agent pre-check --role asp` → consent gate → accepted)
5. ✅ Identity fields confirmed: Name "SoloFi CFO", description "Autonomous finance agent for X Layer", avatar uploaded (`agent upload`) → CDN URL `https://static.okx.com/cdn/web3/wallet/marketplace/headimages/agent/avatar/a8e1dcd7-c1e9-4974-99c2-15c3714d5367.png` (note: an earlier upload's CDN URL, `.../cde50759-....png`, went stale between sessions and got rejected by `agent create` with `profilePicture is not a valid uploaded avatar` — re-uploaded fresh via `agent upload` immediately before create in the same command sequence to avoid the gap)
6. ✅ Teammate deployed the backend to Railway — endpoint `https://solofi-cfo3-production.up.railway.app/mcp` (domain changed twice mid-deploy: `solofi-cfo` → `solofi-cfo2-production` → `solofi-cfo3-production`; always re-verify the live domain before using it anywhere)
7. ✅ Service card finalized: name "Invoice & Cashflow Agent", 2-part description (capability + required inputs), type `A2MCP`, fee `0.2` (USDT implied), endpoint as above. `validate-listing` QA passed clean (`pass:true`, no findings) — note the CLI's actual `--service` JSON keys are camelCase (`serviceName`/`serviceDescription`/`serviceType`), not the lowercase shown in the skill reference's own error-message example; use `agent create --help` / `agent validate-listing --help` as the source of truth if this drifts again.
8. ✅ `agent create --role asp ...` succeeded — **Agent ID `#6130`**, on-chain tx `0x0365dd1aba1000f33611bf97f6096b9d80c6801d3b859662f6b9501825aded1f` (X Layer, chainIndex 196)
9. ✅ `agent activate --agent-id 6130` — required bootstrapping the OKX A2A communication runtime first (`okx-a2a` CLI wasn't installed: `npm i -g @okxweb3/a2a-node`, then `okx-a2a doctor --fix --json` until `ready:true`). Submitted for review (`submitApproval: {success:true, approvalStatus:2}`).
10. ✅ Confirmed independently via `agent get-my-agents` — `#6130` shows `approvalLabel: "Listing under review"`, `statusLabel: "not listed"` (expected; flips once OKX approves, usually within 24h)

Given the 24h review window and the 2026-07-17 deadline, this needed to finish
same-day — it did. The demo doesn't strictly depend on approval landing in time
(the Gemini/webhook path works standalone), but the ASP badge itself does.

**Skipped for now (optional, not blocking):** Policy Setting (spending
limits/whitelist) and Wallet Export — both web-portal-only actions the CLI
can't do; Wallet Export in particular permanently unbinds the wallet from the
email and would be actively counterproductive to do now.

## 5. x402 payment integration (paid A2MCP calls)

Decision: go paid rather than free — small testnet fee (default `$0.20` via
`X402_PRICE`) since it's fake test money either way, and it demonstrates real
payment-flow integration for judges rather than just a free passthrough.

**Real SDK, not hand-rolled:** `@okxweb3/x402-express` + `@okxweb3/x402-core` +
`@okxweb3/x402-evm` (all published on npm — verified with `npm view` before
installing, don't trust doc-summary version numbers blindly). API surface was
confirmed directly from the installed packages' `.d.ts` files, not just the doc
paraphrase, since WebFetch summaries of code examples are lossy.

**New code:**
- `src/infrastructure/x402.config.ts` — sets up `OKXFacilitatorClient`,
  registers `ExactEvmScheme` for network `eip155:1952` (testnet) /
  `eip155:196` (mainnet, auto-picked from `X_LAYER_CHAIN_ID`), and resolves
  `payToAddress` (falls back to the agent wallet's own address — same wallet
  used for invoices/splits, so no separate payout address needed).
- `src/index.ts` — mounts `paymentMiddlewareFromConfig` in front of `/mcp`
  **only when** `x402Enabled` (i.e. `OKX_API_KEY`/`OKX_SECRET_KEY`/`OKX_PASSPHRASE`
  are all set). Otherwise logs a warning and `/mcp` serves free — same
  graceful-degradation pattern as the `AGENT_WALLET_PRIVATE_KEY` fix in §2;
  verified this actually works by booting with the credentials unset and
  confirming `/mcp` still returned the full tool list.

**New, separate credential set — do not confuse with ASP identity creds:**

| Var | What it's for | Where to get it |
|---|---|---|
| `OKX_API_KEY` / `OKX_SECRET_KEY` / `OKX_PASSPHRASE` | Facilitator signing (HMAC-SHA256 per OKX REST API spec) for verifying/settling x402 payments | OKX Developer Portal — `web3.okx.com/onchainos/dev-portal` |
| `OKX_AI_API_KEY` / `OKX_AI_AGENT_ID` | ASP marketplace identity (§4) | Issued after ASP registration completes |

These are two unrelated systems that happen to both start with `OKX_`.

**Status: `OKX_API_KEY`/`OKX_SECRET_KEY`/`OKX_PASSPHRASE` obtained and verified live.**
Created via OKX Developer Portal (`web3.okx.com/onchainos/dev-portal` → connect
wallet → verify address → link email/phone → Create API key). Set in Railway's
Variables tab (not committed — see `.env` locally, gitignored). After redeploy,
confirmed x402 is actively enforcing by hitting `/mcp` with no payment header:

```
HTTP/1.1 402 Payment Required
payment-required: <base64 JSON>
```

Decoded challenge confirms every field matches the registered service exactly:
`network: "eip155:1952"` (X Layer testnet), `asset: 0x9e29b3aada...` (USDT₮0),
`amount: "200000"` (= 0.2 USDT at 6 decimals — matches the `0.2` fee set during
ASP registration §4), `payTo: 0x9e008a07507d...797Da3` (the X Layer agent wallet).

`OKX_AI_API_KEY`/`OKX_AI_AGENT_ID` — `OKX_AI_AGENT_ID` is now known (`6130`,
from §4 step 8) and filled. `OKX_AI_API_KEY` is still unresolved — it's
consumed only by `OkxNotifier.ts`'s optional proactive-notify feature, which is
independently gated behind `OKX_AI_CALLBACK_URL` (also unset, marked TODO in
that file — the real outbound endpoint/auth contract for OKX.AI proactive
messages was never confirmed in OKX's reachable docs). Not blocking: the
feature already no-ops via the callback-URL gate regardless. Leave as
placeholder; revisit only if OKX's marketplace dashboard surfaces this key
post-approval and there's spare time.

`X402_PRICE` (default `$0.20`) and `X402_PAY_TO_ADDRESS` (optional override,
defaults to the agent wallet address) are also new — added to `.env.example`.

## 6. Deployment — see `docs/DEPLOYMENT.md`

Full guide written there (Railway, not Vercel — rationale + steps + `/mcp`
verification commands). Short version: this needs an always-on Node process
(not serverless) because `Web3Service.watchForPayment` holds a persistent
on-chain event listener open — Vercel-style serverless would kill that
listener between requests and payment detection would silently never fire.

**Deployed.** Live at `https://solofi-cfo3-production.up.railway.app`
(domain changed twice during setup: `solofi-cfo` → `solofi-cfo2-production` →
`solofi-cfo3-production` — always re-verify the current domain in Railway's
dashboard before testing/registering against it). Both `/health` and `/mcp`
confirmed working; `/webhook/okx` confirmed working end-to-end (real invoice
created via Gemini → function call → Supabase write). See §2 item 3 for the
model-retirement bug this surfaced and its fix.

## 7. Verifying the current state

```bash
npm run typecheck   # tsc --noEmit, should be clean
npm test            # 17 unit + integration tests against in-memory fakes (tests/support/fakes.ts), no real Supabase/X Layer needed
npm run dev          # boots the real server against .env — tsx watch src/index.ts
```

With the real server running (`npm run dev`), smoke-test the MCP path directly:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Should return all 4 tools with their JSON-schema `inputSchema`. A `tools/call`
against `queryBalance`/`queryCashflow`/`setPocketRule` should hit the real
Supabase project; `createInvoice` additionally needs a valid
`AGENT_WALLET_PRIVATE_KEY` (already configured) to register the payment watcher.

## 8. Reference links used during this work

- OKX ASP overview: `https://web3.okx.com/onchainos/dev-docs/okxai/asp`
- OKX A2MCP guide (endpoint compliance, curl self-check, x402 challenge shape): `https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp`
- OKX A2A guide: `https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a`
- OKX ASP registration steps: `https://web3.okx.com/onchainos/dev-docs/okxai/registerasp`
- OKX Payment SDK overview: `https://web3.okx.com/onchainos/dev-docs/payments/sdk-overview`
- OKX Payment "service seller" SDK: `https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk`
- X Layer testnet faucet: `https://web3.okx.com/xlayer/faucet`
- X Layer testnet block explorer: `https://www.oklink.com/xlayer-test`
- X Layer mainnet block explorer: `https://www.oklink.com/xlayer`
- Cloudflare "remote MCP server" guide (linked from OKX's own A2MCP docs — confirms the MCP-server contract): `https://developers.cloudflare.com/agents/guides/remote-mcp-server`
- Model Context Protocol TypeScript SDK (`@modelcontextprotocol/sdk`, v1.29.0 — used stable v1 API, not the newer split-package v2-alpha (`@modelcontextprotocol/server`/`node`/`express`), which is too fresh for a hackathon deadline): `https://github.com/modelcontextprotocol/typescript-sdk`
- Supabase new API key system (`sb_publishable_...`/`sb_secret_...` replacing `anon`/`service_role`): `https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys`
- OKX x402 Node.js SDK integration: `https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk`, `https://web3.okx.com/onchainos/dev-docs/payments/sdk-overview`
- `okx/onchainos-skills` GitHub repo (source of the `onchainos` CLI binary + skill files): `https://github.com/okx/onchainos-skills`
- OKX Developer Portal (facilitator API key + ASP dev docs): `https://web3.okx.com/onchainos/dev-portal`
- Railway (recommended deploy target): `https://railway.app`

### Tools used to gather the above

- **Context7 MCP** (`resolve-library-id` + `query-docs`) — for viem basics, Supabase new-key-system docs, and MCP TypeScript SDK API (had to explicitly steer past the newer v2-alpha docs that kept surfacing by version-pinning to `/modelcontextprotocol/typescript-sdk/v1.29.0`)
- **WebFetch** — for all OKX/X Layer dev-docs pages above. Note: `web3.okx.com` was initially unreachable due to a TLS cert mismatch caused by an ISP-level DNS interception (Telkomsel) — resolved once the user enabled Cloudflare One Client DNS. `okx.ai` (the marketing/tutorial domain, as opposed to `web3.okx.com`'s real dev-docs) returned HTTP 403 and was not used.
- **`npm view`** — to confirm the real published/stable version of `@modelcontextprotocol/sdk` (1.29.0) before installing, since Context7 kept surfacing the unreleased v2-alpha API by default
- Direct JSON-RPC `curl` calls to `testrpc.xlayer.tech` and to the running server's `/mcp`/`/health` endpoints — to verify configuration against the live chain rather than trusting docs alone
