import Database from "better-sqlite3";
import { createTracksTable, migrateDatabase } from "./track.db.js";
import { createUsersTable } from "./user.db.js";
import { createPermissionsTable, seedPermissions } from "./permission.db.js";
import { config } from "../config.js";
import * as fs from "node:fs";

const { STORAGE_PATH, DB_NAME } = config;

const dbPath = `${STORAGE_PATH}/${DB_NAME}`;

// Create storage path
fs.mkdirSync(STORAGE_PATH, { recursive: true });

export const db = new Database(dbPath);

export function initializeDatabase() {
  createTracksTable(db);
  createUsersTable(db);
  //   createPlaylistsTable(db);
  //   createPlaylistTracksTable(db);
  //   createLikesTable(db);
  createPermissionsTable(db);
  seedPermissions(db); // Seed initial permissions
  //   seedInitialAdmin(db);

  // Run migrations
  migrateDatabase(db);
}
