import type { CreditTransaction } from '../types';

export class CreditLedger {
  private balance: number;
  private transactions: CreditTransaction[] = [];

  constructor() {
    const savedBal = localStorage.getItem('nona_credit_balance');
    this.balance = savedBal ? parseInt(savedBal, 10) : 50;

    const savedTx = localStorage.getItem('nona_credit_transactions');
    if (savedTx) {
      try { this.transactions = JSON.parse(savedTx); } catch {}
    } else {
      this.transactions = [
        {
          id: 'tx_init',
          userId: 'user_1',
          type: 'deposit',
          amount: 50,
          balanceAfter: 50,
          reason: 'Créditos de Bienvenida (Plan Free)',
          createdAt: new Date().toISOString(),
        }
      ];
      this.persist();
    }
  }

  getBalance(): number {
    return this.balance;
  }

  getTransactions(): CreditTransaction[] {
    return this.transactions;
  }

  canAfford(cost: number): boolean {
    return this.balance >= cost;
  }

  deductCredits(amount: number, reason: string, jobId?: string): { success: boolean; transaction?: CreditTransaction } {
    if (this.balance < amount) {
      return { success: false };
    }

    this.balance -= amount;
    const tx: CreditTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId: 'user_1',
      type: 'charge',
      amount: -amount,
      balanceAfter: this.balance,
      reason,
      jobId,
      createdAt: new Date().toISOString(),
    };

    this.transactions = [tx, ...this.transactions];
    this.persist();
    return { success: true, transaction: tx };
  }

  refundCredits(amount: number, reason: string, jobId?: string): CreditTransaction {
    this.balance += amount;
    const tx: CreditTransaction = {
      id: 'tx_ref_' + Date.now(),
      userId: 'user_1',
      type: 'refund',
      amount: +amount,
      balanceAfter: this.balance,
      reason,
      jobId,
      createdAt: new Date().toISOString(),
    };

    this.transactions = [tx, ...this.transactions];
    this.persist();
    return tx;
  }

  addCredits(amount: number, reason: string = 'Recarga de Créditos'): CreditTransaction {
    this.balance += amount;
    const tx: CreditTransaction = {
      id: 'tx_dep_' + Date.now(),
      userId: 'user_1',
      type: 'deposit',
      amount: +amount,
      balanceAfter: this.balance,
      reason,
      createdAt: new Date().toISOString(),
    };

    this.transactions = [tx, ...this.transactions];
    this.persist();
    return tx;
  }

  private persist() {
    localStorage.setItem('nona_credit_balance', this.balance.toString());
    localStorage.setItem('nona_credit_transactions', JSON.stringify(this.transactions));
  }
}

export const creditLedger = new CreditLedger();
