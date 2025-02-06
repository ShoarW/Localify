import type { Database } from "better-sqlite3";
import type { User } from "../types/model.js";

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
}

export function getAllUsers(db: Database): User[] {
  // Omit passwordHash from the result
  return db
    .prepare("SELECT id, username, email, role FROM users")
    .all() as User[];
}

export function createUser(db: Database, user: Omit<User, "id">): number {
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
  const query = db.prepare("SELECT * FROM users WHERE username = ?");
  return query.get(username) as User | undefined;
}

export function getUserById(db: Database, userId: number): User | undefined {
  const query = db.prepare("SELECT * FROM users WHERE id = ?");
  return query.get(userId) as User | undefined;
}

export function deleteUser(db: Database, userId: number): boolean {
  const deleteQuery = db.prepare("DELETE FROM users WHERE id = ?");
  const result = deleteQuery.run(userId);
  return result.changes > 0;
}
