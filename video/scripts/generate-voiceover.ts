import fs from "node:fs";
import path from "node:path";

const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();

if (!apiKey || !voiceId) {
  throw new Error("Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID (check video/.env)");
}

const script = [
  "Meet SoloFi CFO — an autonomous finance agent on OKX.AI, listed as ASP number 6130.",
  "Freelancers and solopreneurs paid in crypto track invoices and split income by hand.",
  "SoloFi CFO does it for them: generates invoices, watches X Layer for payments, and auto-splits funds into budget pockets — no dashboard, just an agent you talk to.",
  "Here's the part that matters most: SoloFi CFO is billed per-call using OKX's real x402 payment protocol.",
  "Watch — an unpaid call to slash m c p gets a signed 402 Payment Required challenge: network, token, amount.",
  "Now we sign a real payment authorization with the agent's wallet — an actual EIP-3009 transfer with authorization, not a fake token.",
  "Resend the same call with the signed X-PAYMENT header — 200 OK, invoice created, settled on X Layer.",
  "That's a genuine agent-to-agent payment, end to end.",
  "SoloFi CFO — your autonomous Web3 finance agent. Repo and live endpoint linked below.",
].join(" ");

const outDir = path.join(process.cwd(), "public");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "voiceover.mp3");

console.log(`Requesting TTS for ${script.split(" ").length} words...`);

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: script,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
    }),
  },
);

if (!response.ok) {
  const body = await response.text();
  throw new Error(`ElevenLabs API error ${response.status}: ${body}`);
}

const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync(outPath, buffer);

console.log(`Saved ${(buffer.length / 1024).toFixed(0)} KB to ${outPath}`);
