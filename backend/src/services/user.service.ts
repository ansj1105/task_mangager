import { db } from '../config/database';

export class UserService {
  /**
   * 사용자가 존재하는지 확인하고, 없으면 기본 사용자 생성
   */
  async ensureUserExists(userId: number): Promise<boolean> {
    try {
      const result = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        return true;
      }

      // 사용자가 없으면 기본 사용자 생성
      await db.query(
        `INSERT INTO users (id, email, name, password_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [userId, `user${userId}@example.com`, `User ${userId}`, '$2b$10$defaultpasswordhash']
      );
      return true;
    } catch (error) {
      console.error('Failed to ensure user exists:', error);
      return false;
    }
  }

  /**
   * 기본 사용자 생성 (개발용)
   */
  async createDefaultUser(): Promise<void> {
    try {
      await db.query(
        `INSERT INTO users (id, email, name, password_hash)
         VALUES (1, 'default@example.com', 'Default User', '$2b$10$defaultpasswordhash')
         ON CONFLICT (id) DO NOTHING`
      );
    } catch (error) {
      console.error('Failed to create default user:', error);
    }
  }
}

export const userService = new UserService();

