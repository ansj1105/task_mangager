import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import dotenv from 'dotenv';
import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export interface QueueMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount?: number;
}

export class MessageQueueService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private taskQueue: string;
  private eventQueue: string;
  private retryQueue: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.taskQueue = process.env.MQ_TASK_QUEUE || 'task_queue';
    this.eventQueue = process.env.MQ_EVENT_QUEUE || 'event_queue';
    this.retryQueue = process.env.MQ_RETRY_QUEUE || 'retry_queue';
    this.maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.RETRY_DELAY_MS || '1000');
  }

  async connect(): Promise<void> {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      const conn = await amqp.connect(url);
      this.connection = conn;
      this.channel = await conn.createChannel();

      // 큐 선언
      await this.channel.assertQueue(this.taskQueue, { durable: true });
      await this.channel.assertQueue(this.eventQueue, { durable: true });
      await this.channel.assertQueue(this.retryQueue, { durable: true });

      // DLQ (Dead Letter Queue) 설정
      const dlqExchange = 'dlx';
      await this.channel.assertExchange(dlqExchange, 'direct', { durable: true });
      const dlqName = `${this.taskQueue}_dlq`;
      await this.channel.assertQueue(dlqName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': this.retryQueue,
        },
      });
      await this.channel.bindQueue(dlqName, dlqExchange, dlqName);

      console.log('Message Queue connected');
    } catch (error) {
      console.warn('Message Queue not available (continuing without MQ):', error instanceof Error ? error.message : error);
      // RabbitMQ가 없어도 앱은 계속 실행
      // 연결 실패 시 throw하지 않고 조용히 실패
    }
  }

  isConnected(): boolean {
    return this.channel !== null && this.connection !== null;
  }

  async publish(queueName: string, message: QueueMessage): Promise<void> {
    if (!this.channel) {
      // RabbitMQ가 연결되지 않은 경우 조용히 실패
      console.debug('Message Queue not connected, skipping publish');
      return;
    }

    try {
      // DB에 작업 로그 저장
      await db.query(
        `INSERT INTO mq_jobs (queue_name, message_id, payload, status, retry_count, max_retries)
         VALUES ($1, $2, $3, 'pending', 0, $4)`,
        [queueName, message.id, JSON.stringify(message.payload), this.maxRetries]
      );

      await this.channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      // MQ 오류는 앱 실행을 방해하지 않도록 조용히 처리
      console.debug(`Failed to publish message to ${queueName}:`, error instanceof Error ? error.message : error);
    }
  }

  async consume(
    queueName: string,
    handler: (message: QueueMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      // RabbitMQ가 연결되지 않은 경우 조용히 실패
      console.debug('Message Queue not connected, skipping consume');
      return;
    }

    await this.channel.consume(
      queueName,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        const message: QueueMessage = JSON.parse(msg.content.toString());
        const retryCount = message.retryCount || 0;

        try {
          // 작업 상태 업데이트
          await db.query(
            `UPDATE mq_jobs SET status = 'processing', updated_at = CURRENT_TIMESTAMP
             WHERE message_id = $1`,
            [message.id]
          );

          await handler(message);

          // 작업 완료 처리
          await db.query(
            `UPDATE mq_jobs SET status = 'completed', processed_at = CURRENT_TIMESTAMP
             WHERE message_id = $1`,
            [message.id]
          );

          this.channel!.ack(msg);
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);

          // 재시도 로직
          if (retryCount < this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff

            // 재시도 횟수 증가
            message.retryCount = retryCount + 1;

            // 재시도 큐에 추가 (지연 처리)
            setTimeout(async () => {
              await this.publish(this.retryQueue, message);
            }, delay);

            // DB 업데이트
            await db.query(
              `UPDATE mq_jobs 
               SET status = 'failed', retry_count = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
               WHERE message_id = $3`,
              [retryCount + 1, String(error), message.id]
            );

            this.channel!.ack(msg);
          } else {
            // 최대 재시도 횟수 초과 - DLQ로 이동
            await db.query(
              `UPDATE mq_jobs 
               SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP
               WHERE message_id = $2`,
              [`Max retries exceeded: ${error}`, message.id]
            );

            // DLQ로 전송
            const dlqExchange = 'dlx';
            this.channel!.publish(
              dlqExchange,
              `${queueName}_dlq`,
              Buffer.from(JSON.stringify(message))
            );

            this.channel!.ack(msg);
          }
        }
      },
      { noAck: false }
    );

    console.log(`Consuming messages from ${queueName}`);
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}

export const mqService = new MessageQueueService();

