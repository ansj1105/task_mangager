import express, { Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { userService } from '../services/user.service';

const router = express.Router();

// 할일 목록 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.user_id as string) || 1; // 임시로 user_id 1 사용
    const filters: any = {};

    if (req.query.completed !== undefined) {
      filters.completed = req.query.completed === 'true';
    }
    if (req.query.due_date) {
      filters.due_date = req.query.due_date as string;
    }
    if (req.query.priority !== undefined) {
      filters.priority = parseInt(req.query.priority as string);
    }

    const tasks = await taskService.getTasks(userId, filters);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 할일 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.body.user_id) || 1; // 임시로 user_id 1 사용
    // 사용자 존재 확인 및 생성
    await userService.ensureUserExists(userId);
    
    const task = await taskService.createTask({
      ...req.body,
      user_id: userId,
    });
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 할일 수정
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = parseInt(req.body.user_id) || 1;
    const task = await taskService.updateTask(taskId, userId, req.body);
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 할일 삭제
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = parseInt(req.query.user_id as string) || 1;
    await taskService.deleteTask(taskId, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

