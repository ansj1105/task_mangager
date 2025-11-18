import express, { Request, Response } from 'express';
import { eventService } from '../services/event.service';
import { userService } from '../services/user.service';

const router = express.Router();

// 일정 목록 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.user_id as string) || 1;
    const filters: any = {};

    if (req.query.start_date && req.query.end_date) {
      filters.start_date = req.query.start_date as string;
      filters.end_date = req.query.end_date as string;
    } else if (req.query.month && req.query.year) {
      filters.month = parseInt(req.query.month as string);
      filters.year = parseInt(req.query.year as string);
    }

    const events = await eventService.getEvents(userId, filters);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 일정 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.body.user_id) || 1;
    // 사용자 존재 확인 및 생성
    await userService.ensureUserExists(userId);
    
    const event = await eventService.createEvent({
      ...req.body,
      user_id: userId,
    });
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 일정 수정
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = parseInt(req.body.user_id) || 1;
    const event = await eventService.updateEvent(eventId, userId, req.body);
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 일정 삭제
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = parseInt(req.query.user_id as string) || 1;
    await eventService.deleteEvent(eventId, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

