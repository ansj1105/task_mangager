# 실행 가이드

## 필수 요구사항

- Node.js 18.x 이상
- PostgreSQL 12.x 이상
- RabbitMQ (선택사항 - 메시지 큐 기능을 사용하려면 필요)

## 1단계: 의존성 설치

### 루트 디렉토리
```bash
npm install
```

### 백엔드
```bash
cd backend
npm install
```

### 프론트엔드
```bash
cd frontend
npm install
```

## 2단계: PostgreSQL 데이터베이스 설정

### 2-1. PostgreSQL 설치 확인
```bash
psql --version
```

### 2-2. PostgreSQL 실행 (macOS)
```bash
# Homebrew로 설치한 경우
brew services start postgresql@14

# 또는 직접 실행
postgres -D /usr/local/var/postgres
```

### 2-3. 데이터베이스 생성
```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE task_check;

# 종료
\q
```

### 2-4. 스키마 실행
```bash
# 방법 1: psql 명령어 사용
psql -U postgres -d task_check -f database/schema.sql

# 방법 2: 직접 접속해서 실행
psql -U postgres -d task_check
\i database/schema.sql
\q
```

### 2-5. 연결 확인
```bash
psql -U postgres -d task_check -c "\dt"
```

테이블 목록이 보이면 성공입니다!

## 3단계: RabbitMQ 설정 (선택사항)

RabbitMQ 없이도 실행 가능하지만, 메시지 큐 기능은 작동하지 않습니다.

### 3-1. RabbitMQ 설치 (macOS)
```bash
brew install rabbitmq
brew services start rabbitmq
```

### 3-2. RabbitMQ 관리 페이지 확인
브라우저에서 http://localhost:15672 접속
- 기본 ID: `guest`
- 기본 PW: `guest`

### 3-3. RabbitMQ 없이 실행하려면
백엔드 코드에서 MQ 연결 부분이 실패해도 앱은 계속 실행됩니다 (로그만 출력됨).

## 4단계: 환경 변수 설정

### 4-1. 백엔드 .env 파일 생성
```bash
cd backend
cp .env.example .env
```

### 4-2. .env 파일 수정
```bash
# 원하는 에디터로 열기
nano .env
# 또는
code .env
```

다음 내용을 본인의 환경에 맞게 수정하세요:
```env
# Server
PORT=3001
NODE_ENV=development

# Database - 본인의 PostgreSQL 설정에 맞게 수정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_check
DB_USER=postgres          # 본인의 PostgreSQL 사용자명
DB_PASSWORD=postgres      # 본인의 PostgreSQL 비밀번호

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# RabbitMQ - RabbitMQ를 설치하지 않았다면 기본값 유지
RABBITMQ_URL=amqp://localhost:5672
MQ_TASK_QUEUE=task_queue
MQ_EVENT_QUEUE=event_queue
MQ_RETRY_QUEUE=retry_queue

# Retry Policy
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000
```

## 5단계: 애플리케이션 실행

### 방법 1: 루트에서 동시 실행 (권장)
```bash
# 루트 디렉토리에서
npm run dev
```

이 명령어는 백엔드와 프론트엔드를 동시에 실행합니다.

### 방법 2: 별도 터미널에서 실행

#### 백엔드 실행
```bash
cd backend
npm run dev
```

백엔드가 http://localhost:3001 에서 실행됩니다.

#### 프론트엔드 실행 (새 터미널)
```bash
cd frontend
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

## 6단계: 접속 확인

1. 브라우저에서 http://localhost:5173 접속
2. 할일 추가 버튼 클릭하여 할일 생성
3. 일정 추가 버튼 클릭하여 일정 생성
4. 캘린더에서 일정 확인

## 트러블슈팅

### 데이터베이스 연결 오류
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**해결방법:**
- PostgreSQL이 실행 중인지 확인: `brew services list` (macOS)
- PostgreSQL 시작: `brew services start postgresql@14`
- `.env` 파일의 DB_USER, DB_PASSWORD가 올바른지 확인

### RabbitMQ 연결 오류
```
Failed to connect to Message Queue: ...
```
**해결방법:**
- RabbitMQ가 실행 중인지 확인: `brew services list`
- RabbitMQ 시작: `brew services start rabbitmq`
- 또는 RabbitMQ 없이 실행 가능 (기능 제한)

### 포트가 이미 사용 중
```
Error: listen EADDRINUSE: address already in use :::3001
```
**해결방법:**
- 다른 프로세스가 포트를 사용 중입니다
- 포트를 변경하거나 해당 프로세스를 종료하세요
- `.env` 파일에서 PORT 변경 가능

### TypeScript 오류
**해결방법:**
```bash
# 백엔드 의존성 재설치
cd backend
rm -rf node_modules package-lock.json
npm install

# 프론트엔드 의존성 재설치
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

## 프로덕션 빌드

### 백엔드 빌드
```bash
cd backend
npm run build
npm start
```

### 프론트엔드 빌드
```bash
cd frontend
npm run build
# dist 폴더에 빌드된 파일이 생성됩니다
```

## 추가 정보

- 백엔드 API 문서: http://localhost:3001/health (헬스체크)
- 데이터베이스 관리: `psql -U postgres -d task_check`
- RabbitMQ 관리: http://localhost:15672

