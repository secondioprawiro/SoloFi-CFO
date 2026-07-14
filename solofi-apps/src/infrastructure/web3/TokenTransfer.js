// TokenTransfer — eksekusi transfer token di X Layer
// TODO: pilih library (viem / ethers.js) dan implementasikan signing/broadcast

export class TokenTransfer {
  constructor(config) {
    this.config = config;
    // TODO: inisialisasi wallet client dari AGENT_WALLET_PRIVATE_KEY
  }

  /**
   * Split a received amount across pocket rules and execute each transfer on-chain.
   * @param {number} amount
   * @param {{name: string, wallet_address: string, percentage: number}[]} pocketRules
   * @returns {Promise<{name: string, wallet_address: string, amount: number, txHash: string}[]>}
   */
  async splitPayment(amount, pocketRules) {
    // TODO: hitung share tiap pocket (amount * percentage / 100)
    // TODO: panggil transferToken untuk tiap pocket, kumpulkan tx hash
    throw new Error('TokenTransfer.splitPayment: not implemented');
  }

  /**
   * @param {string} from
   * @param {string} to
   * @param {number} amount
   * @param {string} tokenAddress
   * @returns {Promise<string>} tx hash
   */
  async transferToken(from, to, amount, tokenAddress) {
    // TODO: build + sign + broadcast ERC-20 transfer transaction
    throw new Error('TokenTransfer.transferToken: not implemented');
  }
}
