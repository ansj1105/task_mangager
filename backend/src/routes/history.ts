import express, { Request, Response } from 'express';
import { historyService } from '../services/history.service';

const router = express.Router();

// 전체 수정 이력 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.table_name) {
      filters.table_name = req.query.table_name as string;
    }
    if (req.query.record_id) {
      filters.record_id = parseInt(req.query.record_id as string);
    }
    if (req.query.operation_type) {
      filters.operation_type = req.query.operation_type as string;
    }
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit as string);
    }
    if (req.query.offset) {
      filters.offset = parseInt(req.query.offset as string);
    }

    const history = await historyService.getHistory(filters);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 레코드의 수정 이력 조회
router.get('/:table_name/:record_id', async (req: Request, res: Response) => {
  try {
    const tableName = req.params.table_name;
    const recordId = parseInt(req.params.record_id);

    const history = await historyService.getRecordHistory(tableName, recordId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 테이블의 수정 이력 조회
router.get('/table/:table_name', async (req: Request, res: Response) => {
  try {
    const tableName = req.params.table_name;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const history = await historyService.getTableHistory(tableName, limit);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

