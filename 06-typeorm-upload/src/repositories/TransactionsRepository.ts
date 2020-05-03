import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    let income = 0;
    let outcome = 0;

    const transactions = await this.find();

    transactions.forEach(transaction => {
      // workaround: existe um erro hoje no typeorm issue #873
      const value = transaction.value * 1;

      if (transaction.type === 'income') {
        income += value;
      } else {
        outcome += value;
      }
    });

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
