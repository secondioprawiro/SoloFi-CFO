# SoloFi CFO 🤖💰
> Autonomous Web3 Finance Agent for Freelancers & Solopreneurs

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-hackathon--MVP-orange.svg)
![Platform](https://img.shields.io/badge/platform-OKX.AI-black.svg)
![Chain](https://img.shields.io/badge/chain-X%20Layer-purple.svg)

Built for the **OKX.AI Genesis Hackathon** (deadline: 17 July 2026).

---

## 🎯 Problem Statement

Web3-native income earners — freelance developers, remote workers paid in stablecoins, crypto solopreneurs — lack the basic financial tooling that fiat freelancers take for granted. They track invoices and payments manually across wallets and spreadsheets, split incoming funds into savings/operations by hand, and have no natural-language way to check their financial health.

## 💡 Solution

SoloFi CFO is a **backend-only AI agent** that plugs into the **OKX.AI** platform as an Agent Service Provider (ASP). It has no UI of its own — users talk to it entirely through the OKX.AI chat interface. Behind the scenes, it:

- generates Web3 invoices and watches the chain for payment,
- automatically routes incoming funds into user-defined "pockets" (wallets) by percentage,
- and answers financial questions in natural language.

All state changes are driven by webhooks from OKX.AI in, and webhooks/chat responses back out — there is no page to open, no dashboard to host.

## ✨ Features (MVP)

| Pilar | What it does |
|---|---|
| **1. Smart Invoicing & Auto-Tracking** | User asks in chat ("Create a 100 USDC invoice for Client B"), agent creates the invoice and a receiving wallet, then monitors X Layer until the matching transfer lands. |
| **2. Autonomous Budgeting — Pockets System** | User defines percentage-based allocation rules via chat (e.g. 70% Operational, 30% Savings). The moment a payment is detected, the agent splits and transfers funds on-chain automatically — no manual step. |
| **3. AI Financial Advisor Chat** | User asks natural-language questions ("How much is in my operations pocket?", "Cashflow summary this week?") and gets an instant, human-readable answer sourced from on-chain balances + Supabase. |

See [skill.md](skill.md) for the full intent list, function-calling schema, and messaging conventions, and [PRD.md](PRD.md) for user stories and requirements.

## 🏗️ Architecture

SoloFi CFO has **no frontend**. It is a single Node.js/TypeScript backend that receives webhooks from OKX.AI, resolves user intent through LLM function calling, executes the resulting business logic, and replies in the JSON format OKX.AI expects.

```mermaid
flowchart TB
    User((User)) <--> OKX[OKX.AI Chat / ASP Webhook]
    OKX <--> Ctrl[Webhook Controller]
    Ctrl --> AiSvc[AiService — Gemini Function Calling]
    AiSvc --> InvoiceSvc[InvoiceService]
    AiSvc --> PocketSvc[PocketService]
    AiSvc --> AdvisorSvc[AdvisorService]

    InvoiceSvc --> Repo[(Repositories)]
    PocketSvc --> Repo
    AdvisorSvc --> Repo
    Repo --> DB[(Supabase / Postgres)]

    InvoiceSvc --> Web3Svc[Web3Service — viem]
    PocketSvc --> Web3Svc
    AdvisorSvc --> Web3Svc
    Web3Svc <--> XLayer[(X Layer RPC)]

    PocketSvc -.proactive notification.-> OKX
```

Layers follow Clean Architecture / separation of concerns:

- **Controllers** — parse and validate incoming OKX.AI webhook payloads.
- **Services** — `AiService` (Gemini prompts + tool use), `Web3Service` (viem: listen for USDC transfers, execute routing).
- **Repositories** — Supabase (Postgres) persistence for users, pocket rules, invoices, transaction logs.

Full component diagrams and sequence flows for each pilar live in [ARCHITECTURE.md](ARCHITECTURE.md).

## 🚀 Quick Start

```bash
git clone <repo-url>
cd solofi-apps
cp .env.example .env
npm install
npm run dev
```

There is no page to visit — once running, the service listens on `POST /webhook/okx` for OKX.AI webhook calls. Trigger it by activating the skill on OKX.AI, or locally with:

```bash
curl -X POST localhost:3000/webhook/okx \
  -H "Content-Type: application/json" \
  -d '{"userId": "0xTestWallet", "message": "Create a 100 USDC invoice for Client B"}'
```

### Using RTK / Caveman helpers

- Run without installing globally: `npx caveman <args>` / `npx rtk caveman`
- For reproducible local dev (including `git clone` + `npm link` instructions), see [RTK_CAVEMAN_SETUP.md](RTK_CAVEMAN_SETUP.md).

## 🔧 Tech Stack

| Layer | Choice |
|---|---|
| Runtime / Language | Node.js + TypeScript |
| HTTP Framework | Express.js |
| AI / LLM | Google Gemini API (`@google/generative-ai`, `gemini-1.5-flash`, Tool Use / Function Calling) |
| Database | Supabase (PostgreSQL) |
| Web3 | `viem` (X Layer RPC, event watching, transaction execution) |
| Blockchain | X Layer (OKX's EVM-compatible L2) |
| Platform | OKX.AI Agent Service Provider (ASP) |

## 📡 API Reference

- **Inbound:** `POST /webhook/okx` receives the OKX.AI ASP payload (`userId`, `message`) and returns `{ reply }` in the JSON shape OKX.AI expects. See [src/controllers/webhook.controller.ts](src/controllers/webhook.controller.ts#L1) and [src/types/okx.types.ts](src/types/okx.types.ts#L1) (payload shape is a best-effort assumption — see the note in that file).
- **Outbound:** [`OkxNotifier`](src/services/OkxNotifier.ts#L1) calls back to OKX.AI to push proactive chat messages (e.g. payment-confirmed notifications) — see Pilar 4 in [skill.md](skill.md).
- **LLM function-calling schema:** `createInvoice`, `setPocketRule`, `queryBalance`, `queryCashflow` — defined in [src/agent/functions/index.ts](src/agent/functions/index.ts#L1) and dispatched in [src/services/AiService.ts](src/services/AiService.ts#L1).

## 🌐 X Layer Integration

[`Web3Service`](src/services/Web3Service.ts#L1) watches X Layer for incoming USDC transfers to the agent's deposit wallet, marks the matching invoice `PAID`, and executes the pocket split as one or more on-chain ERC-20 transfers — all verifiable on the X Layer block explorer.

## 💬 Demo (example chat)

```
User:  Bagi 70% ke 0xABC... dan 30% ke 0xXYZ...
Agent: Got it — pocket rules saved: 70% → Operational (0xABC...), 30% → Savings (0xXYZ...).

User:  Buat invoice 100 USDC untuk Client B.
Agent: Invoice #INV-001 created. Ask Client B to send 100 USDC to 0xDEF...

[on-chain: 100 USDC lands in 0xDEF...]

Agent: 💥 Payment confirmed — 100 USDC from Client B received and split:
       70 USDC → Operational, 30 USDC → Savings.
```

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the full judged demo walkthrough.

## 🔒 Design Notes

- On-chain transfers require a verified invoice-payment event or explicit user authorization — never triggered blind.
- Private keys are never hardcoded or logged; read from environment variables / a secrets manager only.
- Every on-chain action is recorded in `transaction_logs` for a full audit trail.

## 🤝 Team

_placeholder — add team member names here before submission_

## 📄 License

MIT
