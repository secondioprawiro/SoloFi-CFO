# API Spec — SoloFi CFO

## Webhook (inbound from OKX.AI)

`POST /webhook/okx`

```json
{
  "userId": "0xTestWallet",
  "message": "Create an invoice for 100 USDC for Client B"
}
```

Response:

```json
{
  "reply": "Invoice #INV-001 created. Send 100 USDC to 0x..."
}
```

> Payload shape is a best-effort assumption (see [`src/types/okx.types.ts`](../src/types/okx.types.ts)) — OKX.AI's ASP model is actually built around Onchain OS / Agentic Wallet + an A2A/A2MCP marketplace contract, and the exact wire format needs confirming against OKX's dev docs once reachable.

Handled by [`src/controllers/webhook.controller.ts`](../src/controllers/webhook.controller.ts) → [`src/services/AiService.ts`](../src/services/AiService.ts).

## LLM Function Definitions

Defined in [`src/agent/functions/index.ts`](../src/agent/functions/index.ts) as Gemini `FunctionDeclaration`s, passed to `gemini-1.5-flash` alongside the system prompt ([`src/agent/prompts/systemPrompt.ts`](../src/agent/prompts/systemPrompt.ts)).

### `createInvoice`
| param | type | required |
|---|---|---|
| client_name | string | yes |
| amount | number | yes |
| currency | string | yes |

### `setPocketRule`
| param | type | required |
|---|---|---|
| rules | array of `{name, wallet_address, percentage}` | yes |

### `queryBalance`
| param | type | required |
|---|---|---|
| pocket_name | string | no |

### `queryCashflow`
| param | type | required |
|---|---|---|
| period | `"week"` \| `"month"` | yes |

## Internal Service Interfaces

See [`ARCHITECTURE.md`](../ARCHITECTURE.md#internal-service-interfaces) for the full list of domain service methods.
