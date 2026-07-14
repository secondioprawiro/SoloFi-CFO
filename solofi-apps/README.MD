# SoloFi CFO 🤖💰

Autonomous Web3 Finance Agent (OKX.AI skill) for Freelancers & Solopreneurs

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-hackathon--MVP-orange.svg)
![Platform](https://img.shields.io/badge/platform-OKX.AI-black.svg)
![Chain](https://img.shields.io/badge/chain-X%20Layer-purple.svg)

Built for the **OKX.AI Genesis Hackathon**.

---

Ringkasan
- SoloFi CFO berjalan sepenuhnya sebagai skill/agent di **OKX.AI** — pengguna berinteraksi lewat Chat UI (browser atau Web3 Wallet di mobile OKX) tanpa membuka situs eksternal.
- Interaksi adalah chat tekstual; semua visualisasi data diubah menjadi ringkasan teks yang mudah dibaca.
- Fitur utama: pembuatan invoice, aturan alokasi (pockets), monitoring on-chain, dan laporan cashflow natural-language.

Skill & Files penting
- Caveman skill description: [solofi-apps/skill.md](solofi-apps/skill.md)
- Setup helper: [solofi-apps/RTK_CAVEMAN_SETUP.md](solofi-apps/RTK_CAVEMAN_SETUP.md)

Quick features
- Set Pocket Rule (natural language) — otomatis split saat payment terkonfirmasi.
- Create Invoice — hasilkan instruksi payment + monitor on-chain.
- Proactive Notifications — backend mengirim notifikasi chat saat pembayaran terkonfirmasi dan split selesai.

Quick Start (dev)
```bash
git clone <repo-url>
cd solofi-apps
cp .env.example .env
# Install dependencies (if package sources are GitHub, prefer manual clone/link — see RTK_CAVEMAN_SETUP.md)
npm install
npm run dev
```

Using RTK / Caveman helpers
- If you want to run caveman or rtk helpers locally without global installs, use `npx`:
  - `npx caveman <args>`
  - `npx rtk caveman`
- For reproducible local dev, see [solofi-apps/RTK_CAVEMAN_SETUP.md](solofi-apps/RTK_CAVEMAN_SETUP.md) for `git clone` + `npm link` instructions.

Architecture & references
- Main agent code: [src/index.js](src/index.js#L1)
- Agent functions and intent handlers: [src/agent/functions](src/agent/functions/)
- Domain services: [src/domain/invoice/InvoiceService.js](src/domain/invoice/InvoiceService.js#L1), [src/domain/pocket/PocketService.js](src/domain/pocket/PocketService.js#L1)
- On-chain listener & executor: [src/infrastructure/web3/XLayerMonitor.js](src/infrastructure/web3/XLayerMonitor.js#L1), [src/infrastructure/web3/TokenTransfer.js](src/infrastructure/web3/TokenTransfer.js#L1)

Design notes
- The skill prioritizes safety: on-chain transfers require explicit authorization or verified invoice-payment events. Store keys in a KMS/vault and require user consent for auto-execution.

Next steps
- Confirm which repo artifacts to remove (I suggest removing `graphify-out/` if it's build output). I will not delete files until you confirm.

License: MIT

