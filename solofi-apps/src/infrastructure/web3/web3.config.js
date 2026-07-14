// Web3 config — X Layer network parameters
// TODO: pilih library (viem / ethers.js) dan inisialisasi client di sini

export const X_LAYER_CONFIG = {
  rpcUrl: process.env.X_LAYER_RPC_URL,
  chainId: Number(process.env.X_LAYER_CHAIN_ID ?? 196),
  tokens: {
    USDC: process.env.USDC_ADDRESS,
    USDT: process.env.USDT_ADDRESS,
  },
};

// TODO: export shared viem/ethers client instance, e.g.:
// export const publicClient = createPublicClient({ chain: xLayer, transport: http(X_LAYER_CONFIG.rpcUrl) });
