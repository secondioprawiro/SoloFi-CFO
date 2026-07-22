# SoloFi CFO — Video Pitch Script

**Target: exactly 90 seconds (hard cap)** — OKX.AI Genesis Hackathon Step 3
requires the X post demo be **no longer than 90 seconds**. This is a
submission-validity rule, not a style preference. Script below is word-counted
to fit ~200–220 words of VO total at a natural pace across the 90s runway.
See `VIDEO_REMOTION_SPEC.md` for the matching scene/frame map and asset list.

Primary demo: real x402 payment flow (`scripts/test-x402-payment.ts`) against the
live `/mcp` endpoint. Not a mock — genuine 402 challenge, signed EIP-3009
authorization, on-chain settlement.

---

## 1. Intro & Use Case (0:00–0:20, ~50 words)

**VO:** "Meet SoloFi CFO — an autonomous finance agent on OKX.AI, listed as
ASP #6130. Freelancers and solopreneurs paid in crypto track invoices and
split income by hand. SoloFi CFO does it for them: generates invoices,
watches X Layer for payments, and auto-splits funds into budget 'pockets' —
no dashboard, just an agent you talk to."

**Visual:** logo + agent name/ID on screen, no footage needed yet.

## 2. Live Demo — real x402 payment (0:20–1:15, ~130 words)

**VO:** "Here's the part that matters most: SoloFi CFO is billed per-call
using OKX's real x402 payment protocol. Watch — an unpaid call to `/mcp`
gets a signed `402 Payment Required` challenge: network, token, amount.
Now we sign a real payment authorization with the agent's wallet — an
actual EIP-3009 `transferWithAuthorization`, not a fake token. Resend the
same call with the signed `X-PAYMENT` header — `200 OK`, invoice created,
settled on X Layer. That's a genuine agent-to-agent payment, end to end."

**Screen recording — run live, don't pre-render if possible:**
```bash
npx tsx scripts/test-x402-payment.ts
```
Record the full run, trim in editing to fit this ~55s window if the live run
runs long — don't try to force the live run itself to exactly 55s.

**Visual:** terminal only, full-screen, readable font. Optional 3–5s cut to
the X Layer block explorer showing the resulting transfer, only if it still
fits inside the 55s window.

## 3. Closing (1:15–1:30, ~20 words)

**VO:** "SoloFi CFO — your autonomous Web3 finance agent. Repo and live
endpoint linked below."

**Visual:** closing slide — project name, team (secondio10, devDedeo, Ezra),
GitHub repo link, live MCP endpoint URL.

---

## Cut from the 3:00 draft (no time budget at 90s)

Tech-stack/architecture walkthrough, roadmap, and the webhook cutaway are
all dropped — the hackathon rule only requires "introduce ASP, explain use
case, demo/walkthrough," not a full pitch deck. If you want that longer
version for another purpose (pitch deck, README embed), keep it as a
separate cut — don't try to fit both into the 90s submission video.

## Recording notes

- Record the x402 script run live — a real 402→sign→200 round trip is the
  single most credible thing in this video; don't fake it with a cut.
- Have `.env` already populated and the Railway deployment warm before
  recording, so the first call doesn't cold-start on camera.
- Word-count the VO against a read-aloud timer before final recording — at
  90s hard cap, going over by even a few seconds risks invalidating the
  submission per the hackathon rules. Trim script wording, not talking
  speed, if it runs long.
- ASP #6130's approval status can flip on any `agent update` call (confirmed
  behavior — even an avatar-only update reset it back to "Listing under
  review"). Check live status right before recording and word the intro
  accordingly ("listed on OKX.AI" only if it's actually live at record time,
  otherwise "registered"/"submitted").
