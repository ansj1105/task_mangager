#!/bin/bash

# Task Check 프로젝트 우분투 환경 설정 스크립트
# 사용법: chmod +x ubuntu_setup.sh && ./ubuntu_setup.sh

set -e  # 오류 발생 시 스크립트 중단

echo "==================================="
echo "Task Check 우분투 환경 설정 시작"
echo "==================================="

# 1. 시스템 업데이트
echo ""
echo "[1/8] 시스템 업데이트 중..."
sudo apt update && sudo apt upgrade -y

# 2. 필수 도구 설치
echo ""
echo "[2/8] 필수 도구 설치 중..."
sudo apt install -y git curl build-essential

# 3. Node.js 설치
echo ""
echo "[3/8] Node.js 설치 중..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js가 이미 설치되어 있습니다: $(node --version)"
fi

echo "Node.js 버전: $(node --version)"
echo "npm 버전: $(npm --version)"

# 4. PostgreSQL 설치
echo ""
echo "[4/8] PostgreSQL 설치 중..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    echo "PostgreSQL이 이미 설치되어 있습니다."
fi

echo "PostgreSQL 버전: $(psql --version)"

# 5. PostgreSQL 데이터베이스 생성
echo ""
echo "[5/8] PostgreSQL 데이터베이스 설정 중..."
sudo -u postgres psql -c "CREATE DATABASE task_check;" 2>/dev/null || echo "데이터베이스가 이미 존재합니다."

# 6. RabbitMQ 설치 (선택사항)
echo ""
echo "[6/8] RabbitMQ 설치 중..."
read -p "RabbitMQ를 설치하시겠습니까? (y/n): " install_rabbitmq

if [[ $install_rabbitmq == "y" || $install_rabbitmq == "Y" ]]; then
    if ! command -v rabbitmq-server &> /dev/null; then
        # Erlang 설치
        wget https://packages.erlang-solutions.com/erlang-solutions_2.0_all.deb
        sudo dpkg -i erlang-solutions_2.0_all.deb
        sudo apt update
        sudo apt install -y erlang
        
        # RabbitMQ 저장소 추가 및 설치
        curl -1sLf "https://keys.openpgp.org/vks/v1/by-fingerprint/0A9AF2115F4687BD29803A206B73A36E6026DFCA" | sudo gpg --dearmor | sudo tee /usr/share/keyrings/com.rabbitmq.team.gpg > /dev/null
        curl -1sLf "https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/deb/ubuntu $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/rabbitmq.list
        curl -1sLf "https://ppa1.novemberain.com/rabbitmq/rabbitmq-server/deb/ubuntu $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/rabbitmq.list
        
        sudo apt update
        sudo apt install -y rabbitmq-server
        
        sudo systemctl start rabbitmq-server
        sudo systemctl enable rabbitmq-server
        sudo rabbitmq-plugins enable rabbitmq_management
        
        echo "RabbitMQ 설치 완료!"
        echo "관리 페이지: http://localhost:15672"
        echo "기본 계정: guest / guest"
    else
        echo "RabbitMQ가 이미 설치되어 있습니다."
    fi
else
    echo "RabbitMQ 설치를 건너뜁니다."
fi

# 7. 프로젝트 의존성 설치
echo ""
echo "[7/8] 프로젝트 의존성 설치 중..."

if [ -f "package.json" ]; then
    echo "루트 디렉토리 의존성 설치..."
    npm install
fi

if [ -d "backend" ]; then
    echo "백엔드 의존성 설치..."
    cd backend
    npm install
    cd ..
fi

if [ -d "frontend" ]; then
    echo "프론트엔드 의존성 설치..."
    cd frontend
    npm install
    cd ..
fi

# 8. 데이터베이스 스키마 실행
echo ""
echo "[8/8] 데이터베이스 스키마 실행 중..."

if [ -f "database/schema.sql" ]; then
    echo "스키마 실행 중..."
    sudo -u postgres psql -d task_check -f database/schema.sql || echo "스키마 실행 중 오류 (이미 실행되었을 수 있습니다)"
fi

if [ -f "database/migration_add_task_time.sql" ]; then
    echo "시간대별 관리 마이그레이션 실행 중..."
    sudo -u postgres psql -d task_check -f database/migration_add_task_time.sql || echo "마이그레이션 실행 중 오류"
fi

if [ -f "database/migration_add_author.sql" ]; then
    echo "작성자 필드 마이그레이션 실행 중..."
    sudo -u postgres psql -d task_check -f database/migration_add_author.sql || echo "마이그레이션 실행 중 오류"
fi

if [ -f "database/init_user.sql" ]; then
    echo "기본 사용자 생성 중..."
    sudo -u postgres psql -d task_check -f database/init_user.sql || echo "기본 사용자 생성 중 오류"
fi

# 환경 변수 파일 생성
echo ""
echo "환경 변수 파일 생성 중..."

if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
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
    echo "backend/.env 파일이 생성되었습니다."
else
    echo "backend/.env 파일이 이미 존재합니다."
fi

# 완료 메시지
echo ""
echo "==================================="
echo "설정이 완료되었습니다!"
echo "==================================="
echo ""
echo "다음 단계:"
echo "1. backend/.env 파일을 확인하고 필요시 수정하세요"
echo "2. 데이터베이스 비밀번호를 확인하세요 (기본: postgres)"
echo "3. 프로젝트 실행: npm run dev"
echo ""
echo "접속 주소:"
echo "- 프론트엔드: http://localhost:5173"
echo "- 백엔드 API: http://localhost:3001"
echo "- RabbitMQ 관리 (설치한 경우): http://localhost:15672"
echo ""

