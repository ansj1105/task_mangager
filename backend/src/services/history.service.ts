import { db } from '../config/database';

export interface HistoryRecord {
  id: number;
  transaction_id: string;
  operation_type: 'insert' | 'update' | 'delete';
  table_name: string;
  record_id: number;
  old_data?: any;
  new_data?: any;
  status: 'committed' | 'rolled_back';
  created_at: string;
}

export class HistoryService {
  async getHistory(
    filters?: {
      table_name?: string;
      record_id?: number;
      operation_type?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<HistoryRecord[]> {
    let query = 'SELECT * FROM transaction_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.table_name) {
      query += ` AND table_name = $${paramIndex}`;
      params.push(filters.table_name);
      paramIndex++;
    }

    if (filters?.record_id) {
      query += ` AND record_id = $${paramIndex}`;
      params.push(filters.record_id);
      paramIndex++;
    }

    if (filters?.operation_type) {
      query += ` AND operation_type = $${paramIndex}`;
      params.push(filters.operation_type);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const result = await db.query(query, params);
    return result.rows.map((row: any) => ({
      ...row,
      old_data: row.old_data ? (typeof row.old_data === 'string' ? JSON.parse(row.old_data) : row.old_data) : null,
      new_data: row.new_data ? (typeof row.new_data === 'string' ? JSON.parse(row.new_data) : row.new_data) : null,
    }));
  }

  async getRecordHistory(tableName: string, recordId: number): Promise<HistoryRecord[]> {
    return this.getHistory({
      table_name: tableName,
      record_id: recordId,
      limit: 50,
    });
  }

  async getTableHistory(tableName: string, limit: number = 100): Promise<HistoryRecord[]> {
    return this.getHistory({
      table_name: tableName,
      limit,
    });
  }
}

export const historyService = new HistoryService();

