-- 작성자 정보 추가 마이그레이션
-- tasks와 events 테이블에 작성자 필드 추가

-- 할일 테이블에 작성자 필드 추가
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- 일정 테이블에 작성자 필드 추가
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_by ON tasks(updated_by);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_updated_by ON events(updated_by);

