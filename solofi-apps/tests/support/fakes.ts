// In-memory fakes for repositories and Web3Service — used by unit/integration
// tests so no real Supabase project or X Layer RPC is needed to run `npm test`.

import type { Invoice } from '../../src/types/invoice.types.js';
import type { Pocket, PocketRuleInput, TransactionLog } from '../../src/types/pocket.types.js';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export class FakeInvoiceRepository {
  public readonly invoices = new Map<string, Invoice>();

  async create(params: { userId: string; clientName: string; amount: number; currency: string }): Promise<Invoice> {
    const invoice: Invoice = {
      id: nextId('inv'),
      user_id: params.userId,
      client_name: params.clientName,
      amount: params.amount,
      currency: params.currency,
      status: 'PENDING',
      payment_tx_hash: null,
      created_at: new Date().toISOString(),
      paid_at: null,
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async findById(invoiceId: string): Promise<Invoice | null> {
    return this.invoices.get(invoiceId) ?? null;
  }

  async findByUser(userId: string): Promise<Invoice[]> {
    return [...this.invoices.values()].filter((i) => i.user_id === userId);
  }

  async findPendingByUser(userId: string): Promise<Invoice[]> {
    return [...this.invoices.values()].filter((i) => i.user_id === userId && i.status === 'PENDING');
  }

  async findOldestPendingMatch(amount: number, currency: string): Promise<Invoice | null> {
    const matches = [...this.invoices.values()]
      .filter((i) => i.status === 'PENDING' && i.amount === amount && i.currency === currency)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    return matches[0] ?? null;
  }

  async markAsPaid(invoiceId: string, txHash: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`FakeInvoiceRepository: invoice ${invoiceId} not found`);
    const updated: Invoice = { ...invoice, status: 'PAID', payment_tx_hash: txHash, paid_at: new Date().toISOString() };
    this.invoices.set(invoiceId, updated);
    return updated;
  }
}

export class FakePocketRepository {
  public rulesByUser = new Map<string, Pocket[]>();

  async saveRules(userId: string, rules: PocketRuleInput[]): Promise<Pocket[]> {
    const pockets = rules.map((rule) => ({ id: nextId('pkt'), user_id: userId, created_at: new Date().toISOString(), ...rule }));
    this.rulesByUser.set(userId, pockets);
    return pockets;
  }

  async getRules(userId: string): Promise<Pocket[]> {
    return this.rulesByUser.get(userId) ?? [];
  }
}

export class FakeTransactionLogRepository {
  public logs: TransactionLog[] = [];

  async log(entry: {
    userId: string;
    invoiceId?: string | null;
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    currency: string;
    action: 'RECEIVE' | 'SPLIT';
  }): Promise<TransactionLog> {
    const record: TransactionLog = {
      id: nextId('txlog'),
      user_id: entry.userId,
      invoice_id: entry.invoiceId ?? null,
      tx_hash: entry.txHash,
      from_address: entry.fromAddress,
      to_address: entry.toAddress,
      amount: entry.amount,
      currency: entry.currency,
      action: entry.action,
      created_at: new Date().toISOString(),
    };
    this.logs.push(record);
    return record;
  }

  async findByUserSince(userId: string, sinceIso: string): Promise<TransactionLog[]> {
    return this.logs.filter((l) => l.user_id === userId && l.created_at >= sinceIso);
  }
}

type WatchCallback = (txHash: string, amount: number) => void | Promise<void>;

export class FakeWeb3Service {
  public readonly agentAddress = '0xAGENT000000000000000000000000000000000';
  public watchers: { walletAddress: string; expectedAmount: number; currency: string; onDetected: WatchCallback }[] = [];
  public transfers: { to: string; amount: number; currency: string }[] = [];
  public balances = new Map<string, number>();
  private txCounter = 0;

  getAgentAddress(): string {
    return this.agentAddress;
  }

  async getBalance(walletAddress: string): Promise<number> {
    return this.balances.get(walletAddress) ?? 0;
  }

  watchForPayment(walletAddress: string, expectedAmount: number, currency: string, onDetected: WatchCallback): () => void {
    const entry = { walletAddress, expectedAmount, currency, onDetected };
    this.watchers.push(entry);
    return () => {
      this.watchers = this.watchers.filter((w) => w !== entry);
    };
  }

  /** Test helper: simulates X Layer emitting a Transfer event matching a pending watch. */
  async simulateIncomingPayment(walletAddress: string, amount: number, currency: string): Promise<string> {
    const watcher = this.watchers.find(
      (w) => w.walletAddress === walletAddress && w.expectedAmount === amount && w.currency === currency,
    );
    if (!watcher) throw new Error('FakeWeb3Service: no matching watcher registered for this payment');
    this.txCounter += 1;
    const txHash = `0xsimtx${this.txCounter}`;
    await watcher.onDetected(txHash, amount);
    return txHash;
  }

  async transferToken(to: string, amount: number, currency: string): Promise<string> {
    this.txCounter += 1;
    this.transfers.push({ to, amount, currency });
    return `0xsplittx${this.txCounter}`;
  }

  async splitPayment(
    amount: number,
    currency: string,
    pocketRules: { name: string; wallet_address: string; percentage: number }[],
  ): Promise<{ name: string; wallet_address: string; amount: number; txHash: string }[]> {
    const results = [];
    for (const rule of pocketRules) {
      const share = Math.round(((amount * rule.percentage) / 100) * 1e6) / 1e6;
      if (share <= 0) continue;
      const txHash = await this.transferToken(rule.wallet_address, share, currency);
      results.push({ name: rule.name, wallet_address: rule.wallet_address, amount: share, txHash });
    }
    return results;
  }
}
