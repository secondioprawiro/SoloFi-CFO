\*\*SoloFi CFO — OKX.AI Skill (Caveman)

Overview

- Nama skill: SoloFi CFO
- Platform target: OKX.AI (Marketplace + Chat UI + Web3 Wallet mobile)
- Tujuan: Menyediakan agen chat yang menjalankan tindakan keuangan otomatis (create invoice, set allocation rules, split on-chain transfers) tanpa perlu pengguna membuka situs eksternal.

Activation (Marketplace)

- Trigger: user memilih "Start Chat" atau "Activate" di OKX.AI Marketplace.
- Greeting: "Halo! Saya SoloFi CFO, asisten keuangan Web3 Anda..."

Primary Intents & Examples

- set_pocket_rule
  - Example: "Bagi 70% ke 0xABC... dan 30% ke 0xXYZ..."
- create_invoice
  - Example: "Buat invoice 100 USDC untuk proyek Landing Page Klien B."
- query_cashflow
  - Example: "Berapa total pendapatan saya bulan ini?"
- notify_payment_status
  - Example: backend men-trigger: "Pembayaran 100 USDC telah diterima dan dibagi sesuai aturan."

Function Calling (Google Gemini Tool Use) — mapping ke backend

- setPocketRule({ownerWallet, allocations: [{percent, targetWallet}]}) -> persist ke DB
- createInvoice({amount, currency, description, client}) -> create invoice record
- recordOnChainTransfer({txHash, amount, currency, invoiceId}) -> reconcile
- queryCashflow({period}) -> read DB -> return summary

Implementation Notes (Backend responsibilities)

- On-chain monitoring & transfer execution (X Layer, via `viem`). File referensi: [src/services/Web3Service.ts](src/services/Web3Service.ts#L1)
- Function handlers: Gemini tool declarations di [src/agent/functions/index.ts](src/agent/functions/index.ts#L1), di-dispatch ke domain service di [src/services/AiService.ts](src/services/AiService.ts#L1)
- Invoice and pocket services: [src/services/InvoiceService.ts](src/services/InvoiceService.ts#L1), [src/services/PocketService.ts](src/services/PocketService.ts#L1)
- Webhook entrypoint: [src/controllers/webhook.controller.ts](src/controllers/webhook.controller.ts#L1)

On-chain Execution

- Setelah deteksi transfer masuk, backend menjalankan smart contract atau transfer script untuk memecah dana sesuai aturan.
- Pastikan idempotency: gunakan invoiceId atau event unique key untuk menghindari duplikat.

UX & Messaging

- Semua visualisasi ditransformasikan menjadi teks ringkas.
- Pesan proaktif dikirim ke chat OKX.AI via webhook: "Boom! Pembayaran 100 USDC dari Klien B telah terkonfirmasi..."
- Gunakan short, action-oriented confirmations after each action.

Security & Permissions

- Agen membutuhkan signature/consent untuk melakukan on-chain transfers.
- Simpan private keys tidak langsung di app; gunakan vault / KMS.
- Pastikan user explicitly authorizes agent when activating auto-split functionality.

Testing & Validation

- Unit test handlers for `setPocketRule`, `createInvoice`, `queryCashflow`.
- Integration test: simulate on-chain transfer event, assert funds split logic.

Deployment Notes

- Package as Caveman skill with metadata expected by Caveman (use caveman scaffolding if available).
- For local dev, use `npx rtk caveman` or `npx caveman` as helper scripts (see RTK_CAVEMAN_SETUP.md).

Appendix — Sample System Prompt (concise)
"You are SoloFi CFO, a Web3 finance assistant inside OKX.AI chat. Prioritize concise, user-friendly financial summaries, confirm every on-chain action, and only execute transfers after explicit authorization or verified invoice payment events. Map user intents to backend functions: setPocketRule, createInvoice, queryCashflow."
