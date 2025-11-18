import { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';

export interface TransactionOperation {
  type: 'insert' | 'update' | 'delete';
  table: string;
  recordId: number;
  oldData?: any;
  newData?: any;
}

export class TransactionService {
  private transactionId: string;
  private client: PoolClient | null = null;
  private operations: TransactionOperation[] = [];

  constructor() {
    this.transactionId = uuidv4();
  }

  async start(): Promise<PoolClient> {
    if (!this.client) {
      this.client = await db.getClient();
      await db.beginTransaction(this.client);
    }
    return this.client;
  }

  logOperation(operation: TransactionOperation): void {
    this.operations.push(operation);
  }

  async logToDatabase(operation: TransactionOperation): Promise<void> {
    if (!this.client) return;

    await this.client.query(
      `INSERT INTO transaction_logs (transaction_id, operation_type, table_name, record_id, old_data, new_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'committed')`,
      [
        this.transactionId,
        operation.type,
        operation.table,
        operation.recordId,
        operation.oldData ? JSON.stringify(operation.oldData) : null,
        operation.newData ? JSON.stringify(operation.newData) : null,
      ]
    );
  }

  async commit(): Promise<void> {
    if (!this.client) {
      throw new Error('No active transaction');
    }

    try {
      // 로그 기록
      for (const operation of this.operations) {
        await this.logToDatabase(operation);
      }

      await db.commitTransaction(this.client);
      this.client.release();
      this.client = null;
      this.operations = [];
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      // 롤백 로그 기록
      for (const operation of this.operations) {
        await this.client.query(
          `INSERT INTO transaction_logs (transaction_id, operation_type, table_name, record_id, old_data, new_data, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'rolled_back')`,
          [
            this.transactionId,
            operation.type,
            operation.table,
            operation.recordId,
            operation.oldData ? JSON.stringify(operation.oldData) : null,
            operation.newData ? JSON.stringify(operation.newData) : null,
          ]
        );
      }

      await db.rollbackTransaction(this.client);
      this.client.release();
      this.client = null;
      this.operations = [];
    } catch (error) {
      console.error('Rollback error:', error);
      if (this.client) {
        this.client.release();
        this.client = null;
      }
      throw error;
    }
  }

  getClient(): PoolClient | null {
    return this.client;
  }

  getTransactionId(): string {
    return this.transactionId;
  }
}

