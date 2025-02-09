import type { Database } from 'better-sqlite3';
import type { User } from '../types/model.js';

export function createUsersTable(db: Database) {
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT NULL
    );
`
  ).run();

  // Create refresh tokens table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    `
  ).run();
}

export function getAllUsers(db: Database): User[] {
  // Omit passwordHash from the result
  return db
    .prepare('SELECT id, username, email, role FROM users')
    .all() as User[];
}

export function createUser(db: Database, user: Omit<User, 'id'>): number {
  const insertQuery = db.prepare(`
          INSERT INTO users (username, passwordHash, email, role, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)
      `);
  const result = insertQuery.run(
    user.username,
    user.passwordHash,
    user.email,
    user.role,
    user.createdAt,
    user.updatedAt
  );
  return result.lastInsertRowid as number;
}

export function getUserByUsername(
  db: Database,
  username: string
): User | undefined {
  const query = db.prepare('SELECT * FROM users WHERE username = ?');
  return query.get(username) as User | undefined;
}

export function getUserById(db: Database, userId: number): User | undefined {
  const query = db.prepare('SELECT * FROM users WHERE id = ?');
  return query.get(userId) as User | undefined;
}

export function deleteUser(db: Database, userId: number): boolean {
  const deleteQuery = db.prepare('DELETE FROM users WHERE id = ?');
  const result = deleteQuery.run(userId);
  return result.changes > 0;
}

export function createRefreshToken(
  db: Database,
  userId: number,
  token: string,
  expiresAt: Date
): void {
  db.prepare(
    `INSERT INTO refresh_tokens (userId, token, expiresAt)
     VALUES (?, ?, ?)`
  ).run(userId, token, expiresAt.toISOString());
}

export function getRefreshToken(
  db: Database,
  token: string
): { userId: number; expiresAt: string } | undefined {
  return db
    .prepare(
      `SELECT userId, expiresAt
       FROM refresh_tokens
       WHERE token = ?`
    )
    .get(token) as { userId: number; expiresAt: string } | undefined;
}

export function deleteRefreshToken(db: Database, token: string): void {
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
}

export function deleteUserRefreshTokens(db: Database, userId: number): void {
  db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(userId);
}
