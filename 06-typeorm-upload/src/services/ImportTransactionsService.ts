import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';

import CreateTransactionService from './CreateTransactionService';

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

async function loadCSV(filePath: string): Promise<TransactionCSV[]> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  const lines: TransactionCSV[] = [];

  parseCSV.on('data', line => {
    lines.push({
      title: line[0],
      type: line[1],
      value: parseInt(line[2], 10),
      category: line[3],
    });
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return lines;
}

async function removeCSV(filePath: string): Promise<void> {
  const fileExists = await fs.promises.stat(filePath);

  if (fileExists) {
    await fs.promises.unlink(filePath);
  }
}

interface Request {
  filename: string;
}
class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);
    const transactionsFromCSV = await loadCSV(csvFilePath);

    const createTransaction = new CreateTransactionService();

    const transactions: Transaction[] = [];

    await transactionsFromCSV.reduce(
      async (previousPromise, transactionFromCSV): Promise<Transaction> => {
        const transaction = await previousPromise;

        if (transaction.id !== undefined) {
          transactions.push(transaction);
        }

        return createTransaction.execute(transactionFromCSV);
      },
      Promise.resolve(new Transaction()),
    );

    await removeCSV(csvFilePath);

    return transactions;
  }
}

export default ImportTransactionsService;
