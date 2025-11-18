import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks';
import eventRoutes from './routes/events';
import historyRoutes from './routes/history';
import { mqService } from './services/mq.service';
import { userService } from './services/user.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MQ 초기화 및 메시지 핸들러 설정
async function initializeMQ() {
  try {
    await mqService.connect();

    // Task 큐 핸들러
    await mqService.consume(
      process.env.MQ_TASK_QUEUE || 'task_queue',
      async (message) => {
        console.log('Processing task message:', message);
        // 여기에 실제 비동기 작업 로직 추가
        // 예: 알림 발송, 통계 업데이트 등
      }
    );

    // Event 큐 핸들러
    await mqService.consume(
      process.env.MQ_EVENT_QUEUE || 'event_queue',
      async (message) => {
        console.log('Processing event message:', message);
        // 여기에 실제 비동기 작업 로직 추가
      }
    );

    // Retry 큐 핸들러
    await mqService.consume(
      process.env.MQ_RETRY_QUEUE || 'retry_queue',
      async (message) => {
        console.log('Retrying message:', message);
        // 재시도 로직
        const originalQueue = message.payload.originalQueue || process.env.MQ_TASK_QUEUE || 'task_queue';
        await mqService.publish(originalQueue, message);
      }
    );

    if (mqService.isConnected()) {
      console.log('Message Queue initialized');
    } else {
      console.log('Running without Message Queue (optional feature)');
    }
  } catch (error) {
    // MQ 초기화 실패해도 앱은 계속 실행
    console.log('Running without Message Queue (optional feature)');
  }
}

// 서버 시작
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // 기본 사용자 생성 (개발용)
  await userService.createDefaultUser();
  await initializeMQ();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mqService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mqService.close();
  process.exit(0);
});

