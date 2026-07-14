# Product Requirements Document — SoloFi CFO

Version: 1.1 | Status: Draft | Date: 2026-07-14

## 1. Executive Summary

SoloFi CFO is an autonomous Web3 finance agent built for the OKX.AI platform. It acts as an automatic Chief Financial Officer for freelancers, remote workers, and solopreneurs paid in crypto: generating invoices, detecting on-chain payments, auto-allocating funds into budget "pockets," and answering financial questions in natural language — all running on X Layer.

SoloFi CFO ships with **no frontend**. The entire product is a backend API that receives webhooks from the OKX.AI Agent Service Provider (ASP) platform, resolves user intent via LLM function calling, executes on-chain operations on X Layer, and replies in the JSON format OKX.AI's chat interface expects.

## 2. Problem Statement & Market Opportunity

Web3-native income earners (freelance devs, remote workers paid in stablecoins, crypto solopreneurs) lack basic financial tooling that fiat freelancers take for granted (e.g. invoicing + bookkeeping + budgeting apps). Today they track payments manually across wallets and spreadsheets, with no automated budgeting or reporting. As stablecoin payroll and freelance-in-crypto adoption grows, there is a clear gap for an autonomous, chat-native "financial operating layer" for individuals — positioned as an AI agent on OKX.AI rather than a standalone app.

## 3. Goals & Non-Goals

### Goals (MVP will build)
- Natural-language invoice creation and on-chain payment detection on X Layer
- Rule-based automatic fund splitting into user-defined "pockets"
- Natural-language financial query/reporting (balances, cashflow)
- Full audit trail of every on-chain action in `transaction_logs`

### Non-Goals (out of scope for MVP)
- Multi-chain support (X Layer only for MVP)
- Fiat on/off ramp
- Tax reporting / compliance filing
- Multi-user / team accounts (single user per agent instance)
- Custom smart contracts for pocket logic (MVP uses direct wallet-to-wallet transfers orchestrated off-chain)

## 4. User Personas

### Persona 1: Web3 Freelancer Developer
Builds smart contracts / dApps for clients, invoiced in USDC/USDT. Wants to stop manually tracking who paid what and when.

### Persona 2: Remote Worker Paid in USDC
Full-time remote employee paid a fixed monthly salary in stablecoin. Wants automatic budgeting so savings/spending happens without manual transfers.

### Persona 3: Crypto Solopreneur
Runs a one-person crypto-native business (content, consulting, small SaaS) with irregular income. Wants a quick natural-language view of financial health without opening a spreadsheet.

## 5. User Stories

| # | Story | Priority |
|---|---|---|
| 1 | As a freelancer, I want to create an invoice via chat so I don't need a separate invoicing tool | P0 |
| 2 | As a freelancer, I want the agent to detect when a client pays my invoice on-chain so I don't have to check manually | P0 |
| 3 | As a solopreneur, I want to define percentage-based pocket rules via chat so my income auto-allocates | P0 |
| 4 | As a remote worker, I want incoming payments to automatically split into pockets the moment they land | P0 |
| 5 | As a user, I want to ask "how much is in my operations pocket?" and get an instant answer | P0 |
| 6 | As a user, I want a natural-language weekly/monthly cashflow summary | P0 |
| 7 | As a user, I want every split transaction logged so I can audit where my money went | P1 |
| 8 | As a freelancer, I want to see the status of all my pending invoices | P1 |
| 9 | As a user, I want to update my pocket rules at any time | P1 |
| 10 | As a user, I want to mark an invoice as cancelled if a client backs out | P2 |
| 11 | As a user, I want to see historical cashflow trends beyond the current period | P2 |

## 6. Functional Requirements

### Pilar 1: Smart Invoicing
- Create invoice (client name, amount, currency) via LLM function call
- Persist invoice as `PENDING` with a designated receiving wallet
- Monitor X Layer for a matching incoming transfer
- On match, mark invoice `PAID`, store `payment_tx_hash`, trigger Pilar 2

### Pilar 2: Pocket Budgeting
- Accept a set of pocket rules (name, wallet address, percentage) that must sum to 100%
- On payment detection, compute per-pocket split amounts
- Execute on-chain transfers to each pocket wallet
- Log every transfer in `transaction_logs` with action `SPLIT`

### Pilar 3: AI Advisor Chat
- Answer balance queries per-pocket or aggregate, reading on-chain balances
- Answer cashflow summary queries (week/month) reading `transaction_logs` + `invoices`
- Respond in the same language the user asked in (Indonesian or English)

## 7. Non-Functional Requirements

- **Performance:** on-chain payment detection latency target < 30s after confirmation on X Layer
- **Security:** agent wallet private key never hardcoded or logged; stored via environment variable / secrets manager only; Supabase RLS enforced on every table
- **Reliability:** target 99% uptime for the demo/judging period; on-chain monitor must auto-reconnect on RPC failure

## 8. Technical Constraints

- Hackathon deadline: **17 July 2026**
- Must integrate with the OKX.AI Agent Service Provider (ASP) platform — receives OKX.AI webhooks, returns responses in OKX.AI's exact expected JSON format. Reference: `okx.ai` ASP tutorial.
- Must run on **X Layer** (OKX's EVM-compatible L2)
- No frontend / no hosted UI — the product's only surface is the webhook API consumed by OKX.AI
- **Tech stack (decided):**

  | Layer | Choice |
  |---|---|
  | Runtime / Language | Node.js + TypeScript |
  | HTTP Framework | Express.js |
  | LLM | Google Gemini API (`@google/generative-ai`, `gemini-1.5-flash`, Tool Use / Function Calling) |
  | Database | Supabase (PostgreSQL) |
  | Web3 | `viem` (X Layer RPC connections, event watching, transaction execution) |

- **Code organization:** strict Clean Architecture / separation of concerns — Controllers (parse OKX.AI webhook payloads), Services (`AiService` for Gemini prompts/tool use, `Web3Service` for on-chain monitoring and routing), Repositories (Supabase persistence).

## 9. Success Metrics

- End-to-end demo: invoice creation → payment detection → auto-split → cashflow query, all in under 5 minutes live
- Zero manual intervention required between payment detection and pocket split
- All transactions visible and verifiable on X Layer block explorer

## 10. Out of Scope (Future Features)

- Multi-chain support (Ethereum, other L2s)
- Tax reporting and jurisdiction-aware compliance
- Fiat on/off ramp integration
- Team/multi-user accounts with permissions
- Custom on-chain pocket smart contracts (see `solofi-contract`, decided separately)
