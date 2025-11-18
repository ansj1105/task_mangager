import { TransactionService } from './transaction.service';
import { mqService, QueueMessage } from './mq.service';
import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id?: number;
  user_id: number;
  title: string;
  description?: string;
  completed?: boolean;
  due_date?: string;
  start_time?: string; // 시간대별 관리: 시작 시간 (HH:mm 형식)
  end_time?: string;   // 시간대별 관리: 종료 시간 (HH:mm 형식)
  priority?: number;
  created_by?: string; // 작성자
  updated_by?: string; // 수정자
}

export class TaskService {
  async createTask(task: Task, transaction?: TransactionService): Promise<Task> {
    const client = transaction ? transaction.getClient()! : await db.getClient();

    try {
      if (!transaction) {
        await db.beginTransaction(client);
      }

      const result = await client.query(
        `INSERT INTO tasks (user_id, title, description, completed, due_date, start_time, end_time, priority, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          task.user_id,
          task.title,
          task.description || null,
          task.completed || false,
          task.due_date || null,
          task.start_time || null,
          task.end_time || null,
          task.priority || 0,
          task.created_by || null,
          task.updated_by || task.created_by || null,
        ]
      );

      const createdTask = result.rows[0];

      // 트랜잭션 로그
      if (transaction) {
        transaction.logOperation({
          type: 'insert',
          table: 'tasks',
          recordId: createdTask.id,
          newData: createdTask,
        });
      }

      // MQ에 메시지 전송 (비동기 처리)
      const message: QueueMessage = {
        id: uuidv4(),
        type: 'task.created',
        payload: createdTask,
        timestamp: Date.now(),
      };
      await mqService.publish(process.env.MQ_TASK_QUEUE || 'task_queue', message);

      if (!transaction) {
        await db.commitTransaction(client);
        client.release();
      }

      return createdTask;
    } catch (error) {
      if (!transaction) {
        await db.rollbackTransaction(client);
        client.release();
      }
      throw error;
    }
  }

  async getTasks(userId: number, filters?: {
    completed?: boolean;
    due_date?: string;
    priority?: number;
  }): Promise<Task[]> {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters?.completed !== undefined) {
      query += ` AND completed = $${paramIndex}`;
      params.push(filters.completed);
      paramIndex++;
    }

    if (filters?.due_date) {
      query += ` AND due_date = $${paramIndex}`;
      params.push(filters.due_date);
      paramIndex++;
    }

    if (filters?.priority !== undefined) {
      query += ` AND priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  async updateTask(
    taskId: number,
    userId: number,
    updates: Partial<Task>,
    transaction?: TransactionService
  ): Promise<Task> {
    const client = transaction ? transaction.getClient()! : await db.getClient();

    try {
      if (!transaction) {
        await db.beginTransaction(client);
      }

      // 기존 데이터 조회
      const oldResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, userId]
      );

      if (oldResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const oldTask = oldResult.rows[0];

      // 업데이트
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'user_id' && key !== 'created_by') {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      // updated_by가 없으면 업데이트한 사람을 설정
      if (!updates.updated_by) {
        updateFields.push(`updated_by = $${paramIndex}`);
        values.push(updates.created_by || null);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return oldTask;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(taskId, userId);

      const result = await client.query(
        `UPDATE tasks SET ${updateFields.join(', ')} 
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING *`,
        values
      );

      const updatedTask = result.rows[0];

      // 트랜잭션 로그
      if (transaction) {
        transaction.logOperation({
          type: 'update',
          table: 'tasks',
          recordId: taskId,
          oldData: oldTask,
          newData: updatedTask,
        });
      }

      // MQ 메시지
      const message: QueueMessage = {
        id: uuidv4(),
        type: 'task.updated',
        payload: updatedTask,
        timestamp: Date.now(),
      };
      await mqService.publish(process.env.MQ_TASK_QUEUE || 'task_queue', message);

      if (!transaction) {
        await db.commitTransaction(client);
        client.release();
      }

      return updatedTask;
    } catch (error) {
      if (!transaction) {
        await db.rollbackTransaction(client);
        client.release();
      }
      throw error;
    }
  }

  async deleteTask(
    taskId: number,
    userId: number,
    transaction?: TransactionService
  ): Promise<void> {
    const client = transaction ? transaction.getClient()! : await db.getClient();

    try {
      if (!transaction) {
        await db.beginTransaction(client);
      }

      // 기존 데이터 조회
      const oldResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, userId]
      );

      if (oldResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const oldTask = oldResult.rows[0];

      await client.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [
        taskId,
        userId,
      ]);

      // 트랜잭션 로그
      if (transaction) {
        transaction.logOperation({
          type: 'delete',
          table: 'tasks',
          recordId: taskId,
          oldData: oldTask,
        });
      }

      // MQ 메시지
      const message: QueueMessage = {
        id: uuidv4(),
        type: 'task.deleted',
        payload: { id: taskId, user_id: userId },
        timestamp: Date.now(),
      };
      await mqService.publish(process.env.MQ_TASK_QUEUE || 'task_queue', message);

      if (!transaction) {
        await db.commitTransaction(client);
        client.release();
      }
    } catch (error) {
      if (!transaction) {
        await db.rollbackTransaction(client);
        client.release();
      }
      throw error;
    }
  }
}

export const taskService = new TaskService();

