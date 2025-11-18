# Task Check - 할일 및 일정 관리 앱

구글 캘린더 스타일의 할일 체크 및 월별 일정 관리 애플리케이션입니다.

## 기능

- ✅ 할일(Task) 관리 및 체크
- 📅 월별 일정(Event) 추가 및 관리
- 🔄 트랜잭션 롤백 지원
- 📨 메시지 큐를 통한 비동기 처리 및 재처리 정책

## 프로젝트 구조

```
task_check/
├── backend/          # 백엔드 API 서버
├── frontend/         # 프론트엔드 React 앱
└── database/         # 데이터베이스 스키마 SQL 파일
```

## 빠른 시작

자세한 실행 가이드는 [SETUP.md](./SETUP.md)를 참고하세요.

### 1. 의존성 설치
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. 데이터베이스 설정
```bash
# PostgreSQL 데이터베이스 생성
createdb task_check  # 또는 psql에서 CREATE DATABASE task_check;

# 스키마 실행
psql -U postgres -d task_check -f database/schema.sql
```

### 3. 환경 변수 설정
```bash
cd backend
cp .env.example .env
# .env 파일을 열어서 데이터베이스 정보 수정

cd ../frontend
cp .env.example .env
# 개발용은 기본값(/api) 유지, 프로덕션 배포 시에는 백엔드 전체 URL 입력
# 예: VITE_API_BASE_URL=https://your-domain.com/api
```

### 4. 실행
```bash
# 루트 디렉토리에서
npm run dev
```

- 백엔드: http://localhost:3001
- 프론트엔드: http://localhost:5173

**자세한 설정 및 트러블슈팅은 [SETUP.md](./SETUP.md) 참고**

