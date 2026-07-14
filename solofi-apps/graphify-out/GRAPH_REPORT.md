# Graph Report - .  (2026-07-14)

## Corpus Check
- Corpus is ~5,467 words - fits in a single context window. You may not need a graph.

## Summary
- 195 nodes · 187 edges · 26 communities (17 shown, 9 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.85)
- Token cost: 66,917 input · 0 output

## Community Hubs (Navigation)
- LLM Function Definitions
- Package Manifest
- Agent Orchestration Layer
- Invoice Service Logic
- Invoice Repository
- Pocket Service Logic
- Advisor Service Logic
- Token Transfer Execution
- DB Tables & Demo Scenarios
- Product Pillars & Personas
- X Layer Payment Monitor
- Architecture & API Docs
- Pocket Repository
- Web3 Config
- Advisor Pillar & Persona
- Supabase Client
- createInvoice Function Spec
- queryBalance Function Spec
- queryCashflow Function Spec
- setPocketRule Function Spec
- Contribution Workflow
- MVP Scope Boundary
- Users Table
- Product Identity

## God Nodes (most connected - your core abstractions)
1. `keywords` - 6 edges
2. `InvoiceRepository` - 6 edges
3. `InvoiceService` - 6 edges
4. `intentRouter.js (Intent Router)` - 6 edges
5. `Scenario 3: Simulating a Payment` - 6 edges
6. `PocketService` - 5 edges
7. `InvoiceService` - 5 edges
8. `PocketService` - 5 edges
9. `XLayerMonitor` - 5 edges
10. `scripts` - 4 edges

## Surprising Connections (you probably didn't know these)
- `XLayerMonitor (README mention)` --semantically_similar_to--> `XLayerMonitor`  [INFERRED] [semantically similar]
  README.MD → ARCHITECTURE.md
- `src/agent/intentRouter.js` --references--> `intentRouter.js (Intent Router)`  [INFERRED]
  docs/api-spec.md → ARCHITECTURE.md
- `TokenTransfer (README mention)` --semantically_similar_to--> `TokenTransfer`  [INFERRED] [semantically similar]
  README.MD → ARCHITECTURE.md
- `createInvoice function spec` --semantically_similar_to--> `createInvoice LLM function`  [INFERRED] [semantically similar]
  docs/api-spec.md → ARCHITECTURE.md
- `setPocketRule function spec` --semantically_similar_to--> `setPocketRule LLM function`  [INFERRED] [semantically similar]
  docs/api-spec.md → ARCHITECTURE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SoloFi CFO Three Product Pillars** — prd_pilar1_smart_invoicing, prd_pilar2_pocket_budgeting, prd_pilar3_ai_advisor_chat [EXTRACTED 1.00]
- **Domain Service Request Routing Flow** — architecture_intentrouter, architecture_invoiceservice, architecture_pocketservice, architecture_advisorservice [EXTRACTED 1.00]
- **LLM Function-Calling API Surface** — architecture_createinvoice_function, architecture_setpocketrule_function, architecture_querybalance_function, architecture_querycashflow_function [EXTRACTED 1.00]

## Communities (26 total, 9 thin omitted)

### Community 0 - "LLM Function Definitions"
Cohesion: 0.09
Nodes (18): createInvoiceFn, TODO: sesuaikan format schema dengan LLM provider yang dipilih (OpenAI tools / O, queryBalanceFn, TODO: sesuaikan format schema dengan LLM provider yang dipilih (OpenAI tools / O, queryCashflowFn, TODO: sesuaikan format schema dengan LLM provider yang dipilih (OpenAI tools / O, TODO: sesuaikan format schema dengan LLM provider yang dipilih (OpenAI tools / O, setPocketRuleFn (+10 more)

### Community 1 - "Package Manifest"
Cohesion: 0.10
Nodes (19): author, dependencies, description, devDependencies, keywords, license, main, name (+11 more)

### Community 2 - "Agent Orchestration Layer"
Cohesion: 0.14
Nodes (19): AdvisorService, LLM Input Validation Policy, intentRouter.js (Intent Router), InvoiceRepository, InvoiceService, LLM Function Calling, OKX.AI Chat Interface, PocketRepository (+11 more)

### Community 3 - "Invoice Service Logic"
Cohesion: 0.14
Nodes (8): InvoiceService, TODO: 1. create invoice via repository (status PENDING), TODO: 2. start XLayerMonitor.watchForPayment for the receiving wallet, TODO: 3. return invoice + receiving wallet address, TODO: inject XLayerMonitor untuk mulai watch pembayaran setelah invoice dibuat, TODO: update invoice status to PAID, then trigger PocketService.executeSplit, TODO: delegate to invoiceRepository.findByUser, TODO: delegate to invoiceRepository.findPendingByUser

### Community 4 - "Invoice Repository"
Cohesion: 0.15
Nodes (6): InvoiceRepository, TODO: select from invoices where id = invoiceId, TODO: select from invoices where user_id = userId, TODO: implement using supabase.client.js, TODO: select from invoices where user_id = userId and status = 'PENDING', TODO: insert into invoices (status=PENDING), return created row

### Community 5 - "Pocket Service Logic"
Cohesion: 0.15
Nodes (8): PocketService, TODO: validate percentages sum to 100, TODO: persist via pocketRepository.saveRules, TODO: inject TokenTransfer untuk eksekusi on-chain split, TODO: delegate to pocketRepository.getRules, TODO: 1. load pocket rules for userId, TODO: 2. call tokenTransfer.splitPayment(receivedAmount, rules), TODO: 3. log each resulting transfer to transaction_logs (action=SPLIT)

### Community 6 - "Advisor Service Logic"
Cohesion: 0.17
Nodes (8): AdvisorService, TODO: 1. load pocket(s) for userId (all or filtered by pocketName), TODO: 2. call xLayerMonitor.getBalance for each pocket wallet, TODO: 3. format natural-language response, TODO: inject XLayerMonitor (on-chain balance) + repositories (transaction_logs,, TODO: 1. read transaction_logs + invoices for the given period, TODO: 2. aggregate income vs. pocket splits, TODO: 3. format natural-language cashflow summary

### Community 7 - "Token Transfer Execution"
Cohesion: 0.20
Nodes (6): TODO: hitung share tiap pocket (amount * percentage / 100), TODO: panggil transferToken untuk tiap pocket, kumpulkan tx hash, TODO: pilih library (viem / ethers.js) dan implementasikan signing/broadcast, TODO: build + sign + broadcast ERC-20 transfer transaction, TODO: inisialisasi wallet client dari AGENT_WALLET_PRIVATE_KEY, TokenTransfer

### Community 8 - "DB Tables & Demo Scenarios"
Cohesion: 0.25
Nodes (9): invoices table, pocket_rules table, pockets table, transaction_logs table, Scenario 1: Creating an Invoice, Scenario 2: Setting Up Pocket Rules, Scenario 3: Simulating a Payment, Scenario 4: Querying Finances (+1 more)

### Community 9 - "Product Pillars & Personas"
Cohesion: 0.22
Nodes (9): Persona: Remote Worker Paid in USDC, Persona: Web3 Freelancer Developer, Pilar 1: Smart Invoicing, Pilar 2: Pocket Budgeting, Success Metrics, Technical Constraints (X Layer only, hackathon deadline), Pilar 1 — Smart Invoicing & Auto-Tracking, Pilar 2 — Autonomous Budgeting (Pockets System) (+1 more)

### Community 10 - "X Layer Payment Monitor"
Cohesion: 0.22
Nodes (5): TODO: subscribe ke event Transfer (ERC-20) atau polling block logs di X Layer, TODO: pilih library (viem / ethers.js) dan implementasikan, TODO: baca balanceOf dari kontrak ERC-20 token, TODO: inisialisasi viem/ethers public client untuk X Layer, XLayerMonitor

### Community 11 - "Architecture & API Docs"
Cohesion: 0.33
Nodes (7): SoloFi CFO System Architecture, src/agent/intentRouter.js, POST /webhook endpoint, src/api/webhook.js, SoloFi CFO Demo Walkthrough, API Reference Section, SoloFi CFO README Overview

### Community 12 - "Pocket Repository"
Cohesion: 0.29
Nodes (4): PocketRepository, TODO: select from pockets where user_id = userId, TODO: implement using supabase.client.js, TODO: replace existing pockets for userId with new rules (transaction)

### Community 13 - "Web3 Config"
Cohesion: 0.50
Nodes (3): TODO: export shared viem/ethers client instance, e.g.:, TODO: pilih library (viem / ethers.js) dan inisialisasi client di sini, X_LAYER_CONFIG

### Community 14 - "Advisor Pillar & Persona"
Cohesion: 0.67
Nodes (3): Persona: Crypto Solopreneur, Pilar 3: AI Advisor Chat, Pilar 3 — AI Financial Advisor Chat

## Knowledge Gaps
- **45 isolated node(s):** `name`, `version`, `description`, `main`, `type` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `intentRouter.js (Intent Router)` connect `Agent Orchestration Layer` to `Architecture & API Docs`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `PocketService` connect `Agent Orchestration Layer` to `DB Tables & Demo Scenarios`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Scenario 3: Simulating a Payment` connect `DB Tables & Demo Scenarios` to `Agent Orchestration Layer`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Scenario 3: Simulating a Payment` (e.g. with `Scenario 2: Setting Up Pocket Rules` and `Scenario 4: Querying Finances`) actually correct?**
  _`Scenario 3: Simulating a Payment` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LLM Function Definitions` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
- **Should `Package Manifest` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._