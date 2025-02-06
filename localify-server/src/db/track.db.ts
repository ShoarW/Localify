import type { Database } from "better-sqlite3";
import type { Track, Album } from "../types/model.js";

export function createTracksTable(db: Database) {
  // First create albums table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT,
        year INTEGER,
        coverPath TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT NULL
    );
    `
  ).run();

  // Then create tracks table with album reference
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        title TEXT,
        artist TEXT,
        albumId INTEGER,
        genre TEXT,
        duration REAL,
        mimeType TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT NULL,
        FOREIGN KEY (albumId) REFERENCES albums(id)
    );
    `
  ).run();

  // Create reactions table (likes/dislikes)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS reactions (
        userId INTEGER NOT NULL,
        trackId INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('like', 'dislike')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, trackId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE
    );
    `
  ).run();
}

// Album-related functions
export function getAlbumById(db: Database, id: number): Album | undefined {
  return db.prepare("SELECT * FROM albums WHERE id = ?").get(id) as
    | Album
    | undefined;
}

export function getAllAlbums(db: Database): Album[] {
  return db.prepare("SELECT * FROM albums").all() as Album[];
}

export function addAlbum(db: Database, album: Omit<Album, "id">): number {
  const insertQuery = db.prepare(`
    INSERT INTO albums (title, artist, year, coverPath, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = insertQuery.run(
    album.title,
    album.artist,
    album.year,
    album.coverPath,
    album.createdAt,
    album.updatedAt
  );
  return result.lastInsertRowid as number;
}

export function findAlbumByTitle(
  db: Database,
  title: string
): Album | undefined {
  const query = db.prepare("SELECT * FROM albums WHERE title = ?");
  return query.get(title) as Album | undefined;
}

export function getTracksByAlbumId(db: Database, albumId: number): Track[] {
  return db
    .prepare("SELECT * FROM tracks WHERE albumId = ?")
    .all(albumId) as Track[];
}

// Update existing track functions
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
    INSERT INTO tracks (path, filename, title, artist, albumId, genre, duration, mimeType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertQuery.run(
    track.path,
    track.filename,
    track.title,
    track.artist,
    track.albumId,
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

export function findAlbumByTitleAndDisc(
  db: Database,
  title: string,
  discNumber: number | null
): Album | undefined {
  const query = db.prepare(
    "SELECT * FROM albums WHERE title = ? AND (discNumber = ? OR (discNumber IS NULL AND ? IS NULL))"
  );
  return query.get(title, discNumber, discNumber) as Album | undefined;
}

// Reaction-related functions
export function setReaction(
  db: Database,
  userId: number,
  trackId: number,
  type: "like" | "dislike" | null
): { reaction: "like" | "dislike" | null } {
  // First, remove any existing reaction
  db.prepare("DELETE FROM reactions WHERE userId = ? AND trackId = ?").run(
    userId,
    trackId
  );

  if (type) {
    // Add new reaction if type is provided
    db.prepare(
      "INSERT INTO reactions (userId, trackId, type) VALUES (?, ?, ?)"
    ).run(userId, trackId, type);
  }

  return { reaction: type };
}

export function getReaction(
  db: Database,
  userId: number,
  trackId: number
): { reaction: "like" | "dislike" | null } {
  const reaction = db
    .prepare("SELECT type FROM reactions WHERE userId = ? AND trackId = ?")
    .get(userId, trackId) as { type: "like" | "dislike" } | undefined;

  return { reaction: reaction?.type || null };
}

export function getReactedTracks(
  db: Database,
  userId: number,
  type: "like" | "dislike",
  limit: number = 100,
  offset: number = 0
): { tracks: Track[]; total: number } {
  const tracks = db
    .prepare(
      `
      SELECT t.*, r.createdAt as reactionDate, r.type as reactionType
      FROM tracks t
      JOIN reactions r ON r.trackId = t.id
      WHERE r.userId = ? AND r.type = ?
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?
    `
    )
    .all(userId, type, limit, offset) as (Track & {
    reactionDate: number;
    reactionType: "like" | "dislike";
  })[];

  const total = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM reactions
      WHERE userId = ? AND type = ?
    `
    )
    .get(userId, type) as { count: number };

  return {
    tracks,
    total: total.count,
  };
}
