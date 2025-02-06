import type { Database } from "better-sqlite3";
import type { Track } from "../types/model.js";

export function createTracksTable(db: Database) {
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            filename TEXT NOT NULL,
            title TEXT,
            artist TEXT,
            album TEXT,
            year INTEGER,
            genre TEXT,
            duration REAL,
            mimeType TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT NULL
        );
    `
  ).run();
}

export function getAllTracks(db: Database): Track[] {
  return db.prepare("SELECT * FROM tracks").all() as Track[];
}

export function getTrackById(db: Database, id: number): Track | undefined {
  return db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as
    | Track
    | undefined;
}
export function getTrackByPath(
  db: Database,
  filePath: string
): Track | undefined {
  const query = db.prepare("SELECT * FROM tracks WHERE path = ?");
  return query.get(filePath) as Track | undefined;
}

export function addTrack(db: Database, track: Omit<Track, "id">): void {
  const insertQuery = db.prepare(`
        INSERT INTO tracks (path, filename, title, artist, album, year, genre, duration, mimeType, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  insertQuery.run(
    track.path,
    track.filename,
    track.title,
    track.artist,
    track.album,
    track.year,
    track.genre,
    track.duration,
    track.mimeType,
    track.createdAt,
    track.updatedAt
  );
}

export function deleteTrack(db: Database, id: number): boolean {
  const deleteQuery = db.prepare("DELETE FROM tracks WHERE id = ?");
  const result = deleteQuery.run(id);
  return result.changes > 0;
}

export function searchTracks(db: Database, query: string): Track[] {
  const sqlQuery = db.prepare(`
        SELECT * FROM tracks
        WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? OR filename LIKE ?
    `);
  const searchTerm = `%${query}%`;
  return sqlQuery.all(
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm
  ) as Track[];
}
