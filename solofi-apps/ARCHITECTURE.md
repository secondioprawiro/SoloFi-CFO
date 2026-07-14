# SoloFi CFO — System Architecture

## Overview

SoloFi CFO is a Node.js backend agent that sits behind the OKX.AI chat interface. It uses LLM function calling to translate natural language into structured intents, routed to domain services (`InvoiceService`, `PocketService`, `AdvisorService`). Domain services orchestrate two backing systems: Supabase (Postgres) for persistent state, and X Layer (via an EVM client — Viem/Ethers, TBD) for on-chain monitoring and token transfers.

## Component Diagram

```mermaid
flowchart TB
    User((User)) <--> OKX[OKX.AI Chat Interface]
    OKX <--> Router[intentRouter.js]
    Router --> LLM[(LLM Function Calling)]
    Router --> InvoiceSvc[InvoiceService]
    Router --> PocketSvc[PocketService]
    Router --> AdvisorSvc[AdvisorService]

    InvoiceSvc --> InvoiceRepo[InvoiceRepository]
    PocketSvc --> PocketRepo[PocketRepository]

    InvoiceRepo --> DB[(Supabase Postgres)]
    PocketRepo --> DB

    InvoiceSvc --> Monitor[XLayerMonitor]
    PocketSvc --> Transfer[TokenTransfer]
    AdvisorSvc --> Monitor
    AdvisorSvc --> DB

    Monitor <--> XLayer[(X Layer RPC)]
    Transfer <--> XLayer
```

## Data Flow Diagrams

### Invoice Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as OKX.AI Chat
    participant R as intentRouter
    participant L as LLM
    participant I as InvoiceService
    participant D as Supabase

    U->>C: "Create an invoice for 100 USDC for Client B"
    C->>R: forward message
    R->>L: detect intent (function calling)
    L-->>R: {intent: CREATE_INVOICE, amount: 100, currency: USDC, client: "Client B"}
    R->>I: createInvoice(userId, "Client B", 100, "USDC")
    I->>D: insert invoice (status=PENDING)
    D-->>I: invoice record
    I-->>R: invoice + receiving wallet
    R-->>U: "Invoice #INV-001 created. Send 100 USDC to 0x..."
```

### Payment Detection Flow

```mermaid
sequenceDiagram
    participant M as XLayerMonitor
    participant X as X Layer RPC
    participant I as InvoiceService
    participant D as Supabase
    participant P as PocketService

    M->>X: watch incoming transfers (invoice wallet)
    X-->>M: transfer event detected (100 USDC)
    M->>I: onDetected(invoiceId, txHash, amount)
    I->>D: update invoice (status=PAID, payment_tx_hash)
    I->>P: executeSplit(userId, 100, "USDC")
```

### Pocket Auto-Split Flow

```mermaid
sequenceDiagram
    participant P as PocketService
    participant D as Supabase
    participant T as TokenTransfer
    participant X as X Layer RPC

    P->>D: getPocketRules(userId)
    D-->>P: [{name, wallet, percentage}, ...]
    P->>P: compute split amounts
    P->>T: splitPayment(amount, pocketRules)
    loop each pocket
        T->>X: transferToken(agentWallet, pocketWallet, share)
        X-->>T: tx hash
        T->>D: insert transaction_log (action=SPLIT)
    end
```

### AI Query Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as intentRouter
    participant A as AdvisorService
    participant D as Supabase
    participant X as X Layer RPC

    U->>R: "What's my cashflow this week?"
    R->>A: queryCashflow(userId, "week")
    A->>D: read transaction_logs + invoices (last 7 days)
    A->>X: getBalance(pocket wallets)
    A-->>R: natural-language summary
    R-->>U: "You received 250 USDC across 3 invoices..."
```

## Database Schema

See [`src/infrastructure/database/migrations/001_initial_schema.sql`](./src/infrastructure/database/migrations/001_initial_schema.sql) for the executable definition.

- **`users`** — `id, wallet_address, created_at`
- **`invoices`** — `id, user_id, client_name, amount, currency, status [PENDING/PAID/CANCELLED], payment_tx_hash, created_at, paid_at`
- **`pockets`** — `id, user_id, name, wallet_address, percentage, created_at`
- **`pocket_rules`** — `id, user_id, is_active, created_at, updated_at`
- **`transaction_logs`** — `id, user_id, invoice_id, tx_hash, from_address, to_address, amount, currency, action [RECEIVE/SPLIT], created_at`

## API Contracts

### LLM Function Definitions

Defined in `src/agent/functions/`:

| Function | Params | Returns |
|---|---|---|
| `createInvoice` | `client_name: string, amount: number, currency: string` | invoice id + receiving wallet |
| `setPocketRule` | `rules: {name, wallet_address, percentage}[]` | confirmation of saved rules |
| `queryBalance` | `pocket_name?: string` | balance(s) |
| `queryCashflow` | `period: "week"\|"month"` | natural-language summary |

### Internal Service Interfaces

- `InvoiceService.createInvoice(userId, clientName, amount, currency)`
- `InvoiceService.markAsPaid(invoiceId, txHash)`
- `InvoiceService.getInvoicesByUser(userId)`
- `InvoiceService.getPendingInvoices(userId)`
- `PocketService.setPocketRules(userId, rules)`
- `PocketService.getPocketRules(userId)`
- `PocketService.executeSplit(userId, receivedAmount, currency)`
- `XLayerMonitor.watchForPayment(walletAddress, expectedAmount, onDetected)`
- `XLayerMonitor.getBalance(walletAddress, tokenAddress)`
- `TokenTransfer.splitPayment(amount, pocketRules)`
- `TokenTransfer.transferToken(from, to, amount, tokenAddress)`

## Security Considerations

- **Private key storage:** the agent wallet's private key is read only from `AGENT_WALLET_PRIVATE_KEY` env var / secrets manager — never committed, never logged, never returned in any API response.
- **Supabase RLS:** every table has Row Level Security enabled; policies restrict all reads/writes to rows matching the authenticated `user_id` (service-role key used only server-side for the agent's own writes).
- **Input validation:** all LLM function-call arguments are validated (type, range, percentage sums to 100) before touching the database or chain.

## Deployment Architecture

- Node.js backend deployed as the OKX.AI agent's backend service (hosting target TBD — likely containerized).
- Supabase project (managed Postgres) as the single source of persistent state.
- X Layer RPC endpoint (public or dedicated node) for on-chain reads/writes.
- Environment-specific config via `.env` (see `.env.example`), never checked into git.
