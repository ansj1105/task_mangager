import { TransactionService } from './transaction.service';
import { mqService, QueueMessage } from './mq.service';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';

export interface Event {
  id?: number;
  user_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day?: boolean;
  location?: string;
  color?: string;
  created_by?: string; // 작성자
  updated_by?: string; // 수정자
}

export class EventService {
  async createEvent(
    event: Event,
    transaction?: TransactionService
  ): Promise<Event> {
    const client = transaction ? transaction.getClient()! : await db.getClient();

    try {
      if (!transaction) {
        await db.beginTransaction(client);
      }

      const result = await client.query(
        `INSERT INTO events (user_id, title, description, start_date, end_date, all_day, location, color, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          event.user_id,
          event.title,
          event.description || null,
          event.start_date,
          event.end_date,
          event.all_day || false,
          event.location || null,
          event.color || '#4285F4',
          event.created_by || null,
          event.updated_by || event.created_by || null,
        ]
      );

      const createdEvent = result.rows[0];

      // 트랜잭션 로그
      if (transaction) {
        transaction.logOperation({
          type: 'insert',
          table: 'events',
          recordId: createdEvent.id,
          newData: createdEvent,
        });
      }

      // MQ 메시지
      const message: QueueMessage = {
        id: uuidv4(),
        type: 'event.created',
        payload: createdEvent,
        timestamp: Date.now(),
      };
      await mqService.publish(process.env.MQ_EVENT_QUEUE || 'event_queue', message);

      if (!transaction) {
        await db.commitTransaction(client);
        client.release();
      }

      return createdEvent;
    } catch (error) {
      if (!transaction) {
        await db.rollbackTransaction(client);
        client.release();
      }
      throw error;
    }
  }

  async getEvents(
    userId: number,
    filters?: {
      start_date?: string;
      end_date?: string;
      month?: number;
      year?: number;
    }
  ): Promise<Event[]> {
    let query = 'SELECT * FROM events WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters?.start_date && filters?.end_date) {
      query += ` AND (start_date BETWEEN $${paramIndex} AND $${paramIndex + 1}
               OR end_date BETWEEN $${paramIndex} AND $${paramIndex + 1}
               OR (start_date <= $${paramIndex} AND end_date >= $${paramIndex + 1}))`;
      params.push(filters.start_date, filters.end_date);
      paramIndex += 2;
    } else if (filters?.month !== undefined && filters?.year !== undefined) {
      // 월별 조회
      const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
      const endDate = new Date(filters.year, filters.month, 0)
        .toISOString()
        .split('T')[0];
      query += ` AND (start_date BETWEEN $${paramIndex} AND $${paramIndex + 1}
               OR end_date BETWEEN $${paramIndex} AND $${paramIndex + 1}
               OR (start_date <= $${paramIndex} AND end_date >= $${paramIndex + 1}))`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    query += ' ORDER BY start_date ASC';

    const result = await db.query(query, params);
    return result.rows;
  }

  async updateEvent(
    eventId: number,
    userId: number,
    updates: Partial<Event>,
    transaction?: TransactionService
  ): Promise<Event> {
    const client = transaction ? transaction.getClient()! : await db.getClient();

    try {
      if (!transaction) {
        await db.beginTransaction(client);
      }

      // 기존 데이터 조회
      const oldResult = await client.query(
        'SELECT * FROM events WHERE id = $1 AND user_id = $2',
        [eventId, userId]
      );

      if (oldResult.rows.length === 0) {
        throw new Error('Event not found');
      }

      const oldEvent = oldResult.rows[0];

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
        return oldEvent;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(eventId, userId);

      const result = await client.query(
        `UPDATE events SET ${updateFields.join(', ')} 
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING *`,
        values
      );

      const updatedEvent = result.rows[0];

      // 트랜잭션 로그
      if (transaction) {
        transaction.logOperation({
          type: 'update',
          table: 'events',
          recordId: eventId,
          oldData: oldEvent,
          newData: updatedEvent,
        });
      }

      // MQ 메시지
      const message: QueueMessage = {
        id: uuidv4(),
        type: 'event.updated',
        payload: updatedEvent,
        timestamp: Date.now(),
      };
      await mqService.publish(process.env.MQ_EVENT_QUEUE || 'event_queue', message);

      if (!transaction) {
        await db.commitTransaction(client);
        client.release();
      }

      return updatedEvent;
    } catch (error) {
      if (!transaction) {
        await db.rollbackTransaction(client);
        client.release();
      }
      throw error;
    }
  }

  async deleteEvent(
    eventId: number,
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
        'SELECT * FROM events WHERE id = $1 AND user_id = $2',
        [eventId, userId]
      );

      if (oldResult.rows.length === 0) {
        throw new Error('Event not found');
      }

      const oldEvent = oldResult.rows[0];

      await client.query('DELETE FROM events WHERE id = $1 AND user_id = $2', [
        eventId,
        userId,
      ]);

      // 트랜잭션 로그
      if (transaction) {
        transaction.logOperation({
          type: 'delete',
          table: 'events',
          recordId: eventId,
          oldData: oldEvent,
        });
      }

      // MQ 메시지
      const message: QueueMessage = {
        id: uuidv4(),
        type: 'event.deleted',
        payload: { id: eventId, user_id: userId },
        timestamp: Date.now(),
      };
      await mqService.publish(process.env.MQ_EVENT_QUEUE || 'event_queue', message);

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

export const eventService = new EventService();

