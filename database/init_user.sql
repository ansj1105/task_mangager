-- 기본 사용자 생성 (개발용)
-- Foreign key 오류 방지를 위해 기본 사용자를 생성합니다.

INSERT INTO users (id, email, name, password_hash)
VALUES (1, 'default@example.com', 'Default User', '$2b$10$defaultpasswordhash')
ON CONFLICT (id) DO NOTHING;

-- 또는 email로 체크
INSERT INTO users (email, name, password_hash)
VALUES ('default@example.com', 'Default User', '$2b$10$defaultpasswordhash')
ON CONFLICT (email) DO NOTHING;

