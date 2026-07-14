// Web3Service — X Layer on-chain monitoring + token transfer execution via viem.
// Replaces the old XLayerMonitor + TokenTransfer split with one cohesive service,
// per the Clean Architecture brief (Controllers / Services / Repositories).

import { parseUnits, formatUnits, type Address, type Log } from 'viem';
import { publicClient, walletClient, agentAccount, TOKEN_ADDRESSES, ERC20_ABI } from '../infrastructure/web3.config.js';

function tokenAddress(currency: string): Address {
  const address = TOKEN_ADDRESSES[currency.toUpperCase()];
  if (!address) {
    throw new Error(`Web3Service: no configured token address for currency "${currency}"`);
  }
  return address;
}

export class Web3Service {
  /** The wallet address SoloFi CFO uses as the shared invoice deposit / agent wallet. */
  getAgentAddress(): Address {
    if (!agentAccount) {
      throw new Error('Web3Service: AGENT_WALLET_PRIVATE_KEY is not configured');
    }
    return agentAccount.address;
  }

  async getBalance(walletAddress: Address, currency: string): Promise<number> {
    const token = tokenAddress(currency);
    const [raw, decimals] = await Promise.all([
      publicClient.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
      publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: 'decimals' }),
    ]);

    return Number(formatUnits(raw as bigint, decimals as number));
  }

  /**
   * Watches ERC-20 `Transfer` events into `walletAddress` and invokes `onDetected`
   * the first time a transfer matching `expectedAmount` arrives. Stops watching
   * after the first match (one invoice = one expected payment for MVP).
   */
  watchForPayment(
    walletAddress: Address,
    expectedAmount: number,
    currency: string,
    onDetected: (txHash: string, amount: number) => void | Promise<void>,
  ): () => void {
    const token = tokenAddress(currency);

    const unwatch = publicClient.watchContractEvent({
      address: token,
      abi: ERC20_ABI,
      eventName: 'Transfer',
      args: { to: walletAddress },
      onLogs: async (logs: Log[]) => {
        const decimals = (await publicClient.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: 'decimals',
        })) as number;

        for (const log of logs as unknown as Array<{ args: { value: bigint }; transactionHash: string }>) {
          const amount = Number(formatUnits(log.args.value, decimals));
          if (amount === expectedAmount) {
            unwatch();
            await onDetected(log.transactionHash, amount);
            return;
          }
        }
      },
    });

    return unwatch;
  }

  async transferToken(to: Address, amount: number, currency: string): Promise<string> {
    if (!walletClient || !agentAccount) {
      throw new Error('Web3Service: cannot send transfers without AGENT_WALLET_PRIVATE_KEY configured');
    }

    const token = tokenAddress(currency);
    const decimals = (await publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'decimals',
    })) as number;

    const hash = await walletClient.writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, parseUnits(amount.toString(), decimals)],
    });

    return hash;
  }

  /**
   * Splits a received amount across pocket rules and executes each transfer on-chain.
   */
  async splitPayment(
    amount: number,
    currency: string,
    pocketRules: { name: string; wallet_address: string; percentage: number }[],
  ): Promise<{ name: string; wallet_address: string; amount: number; txHash: string }[]> {
    const results: { name: string; wallet_address: string; amount: number; txHash: string }[] = [];

    for (const rule of pocketRules) {
      const share = Math.round(((amount * rule.percentage) / 100) * 1e6) / 1e6;
      if (share <= 0) continue;
      const txHash = await this.transferToken(rule.wallet_address as Address, share, currency);
      results.push({ name: rule.name, wallet_address: rule.wallet_address, amount: share, txHash });
    }

    return results;
  }
}
