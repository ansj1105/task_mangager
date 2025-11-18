# 우분투 개발 환경 설정 가이드

우분투에서 Task Check 프로젝트를 위한 개발 환경을 설정하는 가이드입니다.

## 1. 시스템 업데이트

```bash
sudo apt update
sudo apt upgrade -y
```

## 2. 필수 도구 설치

### Git 설치
```bash
sudo apt install git -y
git --version
```

### cURL 설치 (이미 있을 수 있음)
```bash
sudo apt install curl -y
```

## 3. Node.js 및 npm 설치

### 방법 1: NodeSource를 통한 설치 (권장)
```bash
# Node.js 20.x LTS 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 설치 확인
node --version
npm --version
```

### 방법 2: nvm을 통한 설치 (여러 버전 관리 가능)
```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 터미널 재시작 또는 다음 명령 실행
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.js 20 설치
nvm install 20
nvm use 20

# 설치 확인
node --version
npm --version
```

## 4. PostgreSQL 설치 및 설정

### PostgreSQL 설치
```bash
sudo apt install postgresql postgresql-contrib -y

# 설치 확인
psql --version
```

### PostgreSQL 서비스 시작 및 상태 확인
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

### PostgreSQL 데이터베이스 설정
```bash
# postgres 사용자로 전환
sudo -u postgres psql

# PostgreSQL 셸에서 실행할 명령들:
# 1. 데이터베이스 생성
CREATE DATABASE task_check;

# 2. 비밀번호 설정 (선택사항)
ALTER USER postgres PASSWORD 'postgres';

# 3. 종료
\q
```

### 데이터베이스 접근 권한 설정 (선택사항)
```bash
# PostgreSQL 설정 파일 수정
sudo nano /etc/postgresql/*/main/postgresql.conf

# 다음 라인 찾아서 수정 (이미 있으면 주석 해제)
# listen_addresses = 'localhost'

# 접근 권한 설정 파일 수정
sudo nano /etc/postgresql/*/main/pg_hba.conf

# 다음 라인 확인/추가 (IPv4 local connections)
# local   all             all                                     peer
# host    all             all             127.0.0.1/32            md5

# PostgreSQL 재시작
sudo systemctl restart postgresql
```

### 스키마 및 마이그레이션 실행
```bash
# 프로젝트 디렉토리로 이동
cd /path/to/task_check

# 스키마 실행
sudo -u postgres psql -d task_check -f database/schema.sql

# 마이그레이션 실행
sudo -u postgres psql -d task_check -f database/migration_add_task_time.sql
sudo -u postgres psql -d task_check -f database/migration_add_author.sql

# 기본 사용자 생성
sudo -u postgres psql -d task_check -f database/init_user.sql
```

## 5. RabbitMQ 설치 (선택사항)

### Erlang 설치 (RabbitMQ 의존성)
```bash
# Erlang 저장소 추가
wget https://packages.erlang-solutions.com/erlang-solutions_2.0_all.deb
sudo dpkg -i erlang-solutions_2.0_all.deb
sudo apt update

# Erlang 설치
sudo apt install erlang -y
```

### RabbitMQ 설치
```bash
# RabbitMQ 저장소 추가
curl -1sLf "https://keys.openpgp.org/vks/v1/by-fingerprint/0A9AF2115F4687BD29803A206B73A36E6026DFCA" | sudo gpg --dearmor | sudo tee /usr/share/keyrings/com.rabbitmq.team.gpg > /dev/null
curl -1sLf "https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/deb/ubuntu $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/rabbitmq.list
curl -1sLf "https://ppa1.novemberain.com/rabbitmq/rabbitmq-server/deb/ubuntu $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/rabbitmq.list

sudo apt update
sudo apt install rabbitmq-server -y

# RabbitMQ 서비스 시작
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server

# 관리 플러그인 활성화
sudo rabbitmq-plugins enable rabbitmq_management

# 기본 사용자 설정 (이미 있으면 스킵)
sudo rabbitmqctl add_user admin admin
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

# 설치 확인
sudo systemctl status rabbitmq-server
```

### RabbitMQ 관리 페이지 접속
- URL: http://localhost:15672
- 기본 계정: guest / guest (또는 위에서 생성한 admin / admin)

## 6. 프로젝트 설정

### 프로젝트 클론 (또는 파일 복사)
```bash
# Git을 사용하는 경우
git clone <repository-url>
cd task_check

# 또는 파일을 직접 복사한 경우
cd /path/to/task_check
```

### 의존성 설치
```bash
# 루트 디렉토리
npm install

# 백엔드
cd backend
npm install
cd ..

# 프론트엔드
cd frontend
npm install
cd ..
```

### 환경 변수 설정
```bash
# 백엔드 .env 파일 생성
cd backend
cat > .env << 'EOF'
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_check
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
MQ_TASK_QUEUE=task_queue
MQ_EVENT_QUEUE=event_queue
MQ_RETRY_QUEUE=retry_queue

# Retry Policy
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000
EOF

cd ..
```

## 7. 방화벽 설정 (필요한 경우)

```bash
# UFW 방화벽이 활성화된 경우
sudo ufw allow 3001/tcp   # 백엔드
sudo ufw allow 5173/tcp   # 프론트엔드
sudo ufw allow 15672/tcp  # RabbitMQ 관리 (선택사항)
```

## 8. 프로젝트 실행

### 개발 모드 실행 (백엔드 + 프론트엔드 동시)
```bash
# 루트 디렉토리에서
npm run dev
```

### 또는 별도로 실행

#### 백엔드
```bash
cd backend
npm run dev
```

#### 프론트엔드 (새 터미널)
```bash
cd frontend
npm run dev
```

## 9. 접속 확인

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3001
- 백엔드 헬스체크: http://localhost:3001/health
- RabbitMQ 관리: http://localhost:15672 (설치한 경우)

## 10. 문제 해결

### PostgreSQL 연결 오류
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# PostgreSQL 재시작
sudo systemctl restart postgresql

# 데이터베이스 연결 테스트
sudo -u postgres psql -d task_check -c "SELECT version();"
```

### 포트가 이미 사용 중인 경우
```bash
# 포트 사용 프로세스 확인
sudo lsof -i :3001
sudo lsof -i :5173

# 프로세스 종료 (PID 확인 후)
sudo kill -9 <PID>
```

### Node.js 버전 확인
```bash
node --version  # 18.x 이상이어야 함
npm --version
```

### 의존성 재설치
```bash
# 백엔드
cd backend
rm -rf node_modules package-lock.json
npm install

# 프론트엔드
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

## 11. 편의 도구 설치 (선택사항)

### PostgreSQL 클라이언트 도구
```bash
# pgAdmin 설치 (GUI 도구)
sudo apt install pgadmin4 -y

# 또는 명령줄 도구만 설치
sudo apt install postgresql-client -y
```

### 코드 에디터
```bash
# VS Code 설치
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code -y
```

## 12. 빠른 체크리스트

설치가 완료되었는지 확인:

```bash
# Node.js 및 npm
node --version && npm --version

# PostgreSQL
sudo systemctl status postgresql

# RabbitMQ (설치한 경우)
sudo systemctl status rabbitmq-server

# 데이터베이스 확인
sudo -u postgres psql -d task_check -c "\dt"

# 프로젝트 의존성
cd /path/to/task_check
ls node_modules backend/node_modules frontend/node_modules
```

## 13. 전체 설치 스크립트 (한 번에 실행)

```bash
#!/bin/bash

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 도구 설치
sudo apt install -y git curl

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 설치
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL 시작 및 데이터베이스 생성
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres psql -c "CREATE DATABASE task_check;"

echo "기본 설치가 완료되었습니다!"
echo "다음 단계:"
echo "1. 프로젝트 디렉토리로 이동"
echo "2. npm install 실행"
echo "3. 데이터베이스 스키마 실행"
echo "4. .env 파일 설정"
echo "5. npm run dev 실행"
```

이 스크립트를 `setup.sh`로 저장하고 실행:
```bash
chmod +x setup.sh
./setup.sh
```

## 주의사항

1. **보안**: 프로덕션 환경에서는 기본 비밀번호를 반드시 변경하세요.
2. **포트**: 다른 서비스와 포트가 충돌하지 않는지 확인하세요.
3. **방화벽**: 개발 환경에서는 방화벽을 열어두어야 할 수 있습니다.
4. **권한**: PostgreSQL 관련 작업은 `sudo -u postgres` 권한이 필요합니다.

## 추가 도움말

문제가 발생하면 다음을 확인하세요:
- 로그 파일: `backend/` 또는 `frontend/` 디렉토리의 콘솔 출력
- 시스템 로그: `journalctl -xe` (systemd 로그)
- 서비스 상태: `sudo systemctl status <service-name>`

