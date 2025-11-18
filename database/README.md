# 데이터베이스 스키마

## 테이블 구조

### users
사용자 정보를 저장합니다.

### tasks
할일 목록을 저장합니다. 사용자별로 관리되며 완료 여부, 우선순위 등을 포함합니다.
- **시간대별 관리**: `start_time`, `end_time` 필드로 할일의 시작/종료 시간을 관리할 수 있습니다.

### events
일정 정보를 저장합니다. 시작일시, 종료일시, 전체일 여부 등을 포함합니다.

### task_events
할일과 일정을 연결하는 테이블입니다. 할일이 일정으로 변환될 때 사용됩니다.

### mq_jobs
메시지 큐 작업 로그를 저장합니다. 재처리를 위한 정보를 포함합니다.

### transaction_logs
트랜잭션 로그를 저장합니다. 롤백 추적 및 수정 이력 조회를 위한 정보를 포함합니다.

## 마이그레이션

### 시간대별 관리 기능 추가
```bash
psql -U postgres -d task_check -f database/migration_add_task_time.sql
```

### 기본 사용자 생성
```bash
psql -U postgres -d task_check -f database/init_user.sql
```

## 사용법

1. PostgreSQL 데이터베이스 생성:
```sql
CREATE DATABASE task_check;
```

2. 스키마 실행:
```bash
psql -U your_username -d task_check -f database/schema.sql
```

3. 마이그레이션 실행 (시간대별 관리 기능):
```bash
psql -U your_username -d task_check -f database/migration_add_task_time.sql
```

4. 기본 사용자 생성:
```bash
psql -U your_username -d task_check -f database/init_user.sql
```

## API 엔드포인트

### 수정 이력 조회
- `GET /api/history` - 전체 수정 이력 조회
- `GET /api/history/:table_name/:record_id` - 특정 레코드의 수정 이력
- `GET /api/history/table/:table_name` - 특정 테이블의 수정 이력

### 필터 옵션
- `table_name`: 테이블명 (tasks, events 등)
- `record_id`: 레코드 ID
- `operation_type`: 작업 유형 (insert, update, delete)
- `status`: 상태 (committed, rolled_back)
- `limit`: 조회 개수 제한
- `offset`: 페이지네이션 오프셋
