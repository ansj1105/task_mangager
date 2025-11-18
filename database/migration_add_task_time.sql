-- 할일 시간대별 관리 기능 추가
-- tasks 테이블에 start_time, end_time 필드 추가

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_end_time ON tasks(end_time);

