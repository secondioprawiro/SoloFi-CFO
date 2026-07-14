// Invoice domain types (JSDoc typedefs — swap for TS types if project migrates to TypeScript)

/**
 * @typedef {'PENDING' | 'PAID' | 'CANCELLED'} InvoiceStatus
 *
 * @typedef {object} Invoice
 * @property {string} id
 * @property {string} user_id
 * @property {string} client_name
 * @property {number} amount
 * @property {string} currency
 * @property {InvoiceStatus} status
 * @property {string | null} payment_tx_hash
 * @property {string} created_at
 * @property {string | null} paid_at
 */

export {};
