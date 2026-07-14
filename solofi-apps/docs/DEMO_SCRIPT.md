# SoloFi CFO — Demo Script

## Setup (before demo)

- Deploy agent backend, confirm X Layer testnet RPC reachable
- Fund a demo "client" wallet with test USDC on X Layer testnet
- Create a demo user record with a receiving wallet
- Have the OKX.AI chat interface open and connected to the agent

## Demo Scenario (5 minutes)

### Scenario 1: Creating an Invoice (1 minute)
User: *"Create an invoice for 100 USDC for Client Alpha"*
Expected: agent replies with invoice ID + receiving wallet address; row visible in `invoices` table with `status=PENDING`.

### Scenario 2: Setting Up Pocket Rules (1 minute)
User: *"Set rules: 50% Operations to 0x..., 30% Personal to 0x..., 20% Emergency Fund to 0x..."*
Expected: agent confirms rules saved; rows visible in `pockets` table summing to 100%.

### Scenario 3: Simulating a Payment (2 minutes)
Steps: send 100 test USDC from the "client" wallet to the invoice's receiving wallet on testnet.
Expected: `XLayerMonitor` detects the transfer within seconds, invoice flips to `PAID`, `PocketService.executeSplit` fires, and all three pocket wallets receive their share — visible on-chain and in `transaction_logs`.

### Scenario 4: Querying Finances (1 minute)
User: *"Give me this week's cashflow summary"*
Expected: natural-language summary of total received and per-pocket breakdown, sourced from on-chain balances + `transaction_logs`.

## Talking Points for Judges

- Fully autonomous — no manual step between payment detection and pocket split
- On-chain — every transaction verifiable on the X Layer block explorer
- Natural language — no dashboard required, the entire flow happens in chat
