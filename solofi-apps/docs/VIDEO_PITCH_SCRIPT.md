# SoloFi CFO — Video Pitch Script

Target: 2:30–3:00, for OKX.AI Genesis Hackathon submission.
Primary demo: real x402 payment flow (`scripts/test-x402-payment.ts`) against the
live `/mcp` endpoint. Not a mock — genuine 402 challenge, signed EIP-3009
authorization, on-chain settlement.

---

## 1. Hook & Problem (0:00–0:30)

**VO:** "Freelancers and solopreneurs getting paid in crypto still run their
finances by hand — tracking invoices across wallets, manually splitting
income into savings and operations, no natural way to ask 'how much do I
have left this month?' There's no CFO for a one-person Web3 business."

**Visual:** Talking head or simple text-on-screen with the pain point. No
footage needed yet.

## 2. Solution (0:30–1:00)

**VO:** "Meet SoloFi CFO — an autonomous finance agent registered on OKX.AI's
agent marketplace as ASP #6130. It generates invoices, watches X Layer for
incoming payments, auto-splits funds into budget 'pockets' by percentage,
and answers financial questions in plain language. No dashboard, no UI —
it's a backend agent other agents and users talk to directly."

**Visual:** README architecture diagram (Mermaid), OKX.AI marketplace card
for #6130 (name + description).

## 3. Live Demo — real x402 payment (1:00–2:15)

**VO:** "Here's the part that matters most: SoloFi CFO is billed per-call
using OKX's x402 payment protocol — real HTTP 402, not a mock. Watch."

**Screen recording — run live, don't pre-render if possible:**
```bash
npx tsx scripts/test-x402-payment.ts
```
Narrate over the output as it streams:
1. "First, an unpaid call to `/mcp` — the agent responds `402 Payment
   Required` with a signed challenge: which network, which token, how much."
2. "Our script signs a real payment authorization with the agent's wallet —
   this is an actual EIP-3009 `transferWithAuthorization`, not a fake token."
3. "Resend the same call with the signed `X-PAYMENT` header — `200 OK`,
   invoice created, on X Layer."

**Visual:** terminal only, full-screen, readable font. Cut to the X Layer
block explorer showing the resulting invoice/wallet if time allows (5–10s).

**Cutaway (10s, optional):** the free-form chat path — one line into
`/webhook/okx`, one reply back — captioned "also works in plain English,
for humans."

## 4. Tech Stack & Architecture (2:15–2:45)

**VO:** "Built on Node.js and TypeScript, Express, Supabase for persistence,
viem for X Layer. Two entry points over the same business logic: a real
Model Context Protocol server for OKX's agent-to-agent calls, and a chat
webhook for humans. The hard part was the payment layer — signing real
EIP-3009 authorizations client-side against OKX's x402 SDK, matching the
exact signer shape their scheme expects."

**Visual:** the architecture Mermaid diagram from README, held on screen.

## 5. Roadmap & Closing (2:45–3:00)

**VO:** "Next: multi-chain pocket splits, richer cashflow forecasting, and
OKX.AI proactive notifications once callback auth is finalized. Thanks —
repo and live endpoint are linked below."

**Visual:** closing slide — project name, team (secondio10, devDedeo, Ezra),
GitHub repo link, live MCP endpoint URL.

---

## Recording notes

- Record the x402 script run live — a real 402→sign→200 round trip is the
  single most credible thing in this video; don't fake it with a cut.
- Have `.env` already populated and the Railway deployment warm before
  recording, so the first call doesn't cold-start on camera.
- ASP #6130 may still show "Listing under review" at recording time — don't
  claim it's publicly listed; say "registered" / "submitted," not "live on
  the marketplace."
