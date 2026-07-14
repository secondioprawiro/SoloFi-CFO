// XLayerMonitor — memonitor X Layer untuk deteksi pembayaran & query saldo
// TODO: pilih library (viem / ethers.js) dan implementasikan

export class XLayerMonitor {
  constructor(config) {
    this.config = config;
    // TODO: inisialisasi viem/ethers public client untuk X Layer
  }

  /**
   * Watch for an incoming token transfer to a wallet and invoke onDetected when found.
   * @param {string} walletAddress
   * @param {number} expectedAmount
   * @param {(txHash: string, amount: number) => void} onDetected
   */
  async watchForPayment(walletAddress, expectedAmount, onDetected) {
    // TODO: subscribe ke event Transfer (ERC-20) atau polling block logs di X Layer
    throw new Error('XLayerMonitor.watchForPayment: not implemented');
  }

  /**
   * @param {string} walletAddress
   * @param {string} tokenAddress
   * @returns {Promise<number>}
   */
  async getBalance(walletAddress, tokenAddress) {
    // TODO: baca balanceOf dari kontrak ERC-20 token
    throw new Error('XLayerMonitor.getBalance: not implemented');
  }
}
