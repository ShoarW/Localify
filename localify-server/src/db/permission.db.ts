import type { Database } from "better-sqlite3";

export function createPermissionsTable(db: Database) {
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT NULL
        );
    `
  ).run();
}

export function seedPermissions(db: Database) {
  const permissionsCount = db
    .prepare("SELECT COUNT(*) as count FROM permissions")
    .get() as { count: number };
  if (permissionsCount.count === 0) {
    db.prepare(
      "INSERT INTO permissions (role, action) VALUES ('admin', 'index')"
    ).run();
    db.prepare(
      "INSERT INTO permissions (role, action) VALUES ('admin', 'delete_track')"
    ).run();
    db.prepare(
      "INSERT INTO permissions (role, action) VALUES ('admin', 'create_user')"
    ).run();
    db.prepare(
      "INSERT INTO permissions (role, action) VALUES ('admin', 'delete_user')"
    ).run();
    db.prepare(
      "INSERT INTO permissions (role, action) VALUES ('admin', 'modify_artists')"
    ).run();
    // Add other default permissions as needed
  }
}

export function hasPermission(
  db: Database,
  role: string,
  action: string
): boolean {
  // Check for wildcard permission first
  const wildcardPermission = db
    .prepare(
      `
      SELECT 1 FROM permissions WHERE role = ? AND action = '*'
  `
    )
    .get(role) as { 1: number } | undefined;

  if (wildcardPermission) {
    return true;
  }

  const permission = db
    .prepare(
      `
      SELECT 1 FROM permissions WHERE role = ? AND action = ?
  `
    )
    .get(role, action) as { 1: number } | undefined;

  return !!permission;
}
