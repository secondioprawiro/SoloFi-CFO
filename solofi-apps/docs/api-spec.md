# API Spec — SoloFi CFO

## Webhook (inbound from OKX.AI)

`POST /webhook` (route TBD once HTTP framework is chosen)

```json
{
  "userId": "uuid",
  "message": "Create an invoice for 100 USDC for Client B"
}
```

Handled by [`src/api/webhook.js`](../src/api/webhook.js) → [`src/agent/intentRouter.js`](../src/agent/intentRouter.js).

## LLM Function Definitions

Defined in `src/agent/functions/`. Each is a JSON-schema function-calling definition passed to the LLM alongside the system prompt.

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
