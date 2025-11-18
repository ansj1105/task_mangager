# 마이그레이션 가이드

## 1. Foreign Key 오류 해결

Foreign key 오류가 발생하는 경우, 기본 사용자를 생성해야 합니다.

### 방법 1: SQL 스크립트 실행
```bash
psql -U postgres -d task_check -f database/init_user.sql
```

### 방법 2: 자동 생성 (권장)
서버를 시작하면 자동으로 기본 사용자(user_id=1)가 생성됩니다.

## 2. 시간대별 관리 기능 추가

할일에 시작 시간과 종료 시간을 추가하려면 마이그레이션을 실행하세요:

```bash
psql -U postgres -d task_check -f database/migration_add_task_time.sql
```

이 마이그레이션은 다음을 수행합니다:
- `tasks` 테이블에 `start_time` (TIME 타입) 필드 추가
- `tasks` 테이블에 `end_time` (TIME 타입) 필드 추가
- 관련 인덱스 생성

## 3. 수정 이력 조회

수정 이력은 `transaction_logs` 테이블에 자동으로 저장됩니다.

### API 사용 예시

```bash
# 전체 수정 이력 조회
curl http://localhost:3001/api/history

# 특정 할일의 수정 이력 조회
curl http://localhost:3001/api/history/tasks/1

# 특정 테이블의 수정 이력 조회
curl http://localhost:3001/api/history/table/tasks?limit=50

# 필터링된 수정 이력 조회
curl "http://localhost:3001/api/history?table_name=tasks&operation_type=update&status=committed"
```

## 4. 데이터베이스 초기화

처음부터 시작하려면:

```bash
# 1. 데이터베이스 삭제 및 재생성
psql -U postgres -c "DROP DATABASE IF EXISTS task_check;"
psql -U postgres -c "CREATE DATABASE task_check;"

# 2. 스키마 실행
psql -U postgres -d task_check -f database/schema.sql

# 3. 마이그레이션 실행
psql -U postgres -d task_check -f database/migration_add_task_time.sql

# 4. 기본 사용자 생성
psql -U postgres -d task_check -f database/init_user.sql
```

## 주의사항

- 기존 데이터가 있는 경우 마이그레이션 전에 백업을 권장합니다.
- `start_time`과 `end_time`은 선택 사항입니다. 기존 할일은 이 필드가 NULL일 수 있습니다.

