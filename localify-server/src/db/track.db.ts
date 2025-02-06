import type { Database } from "better-sqlite3";
import type { Track, Album, Playlist } from "../types/model.js";

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

  // Create playlists table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    `
  ).run();

  // Create playlist_tracks table (Many-to-Many relationship)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlistId INTEGER NOT NULL,
        trackId INTEGER NOT NULL,
        position INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (playlistId, trackId),
        FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
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
): {
  tracks: (Track & {
    reaction: "like" | "dislike" | null;
    reactionDate: number;
  })[];
  total: number;
} {
  const tracks = db
    .prepare(
      `
      SELECT t.*, r.type as reaction, r.createdAt as reactionDate
      FROM tracks t
      INNER JOIN reactions r ON r.trackId = t.id
      WHERE r.userId = ? AND r.type = ?
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?
    `
    )
    .all(userId, type, limit, offset) as (Track & {
    reaction: "like" | "dislike" | null;
    reactionDate: number;
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

export function getAllTracksWithReactions(
  db: Database,
  userId: number | null
): (Track & { reaction: "like" | "dislike" | null })[] {
  if (!userId) {
    const tracks = getAllTracks(db);
    return tracks.map((track) => ({ ...track, reaction: null }));
  }

  return db
    .prepare(
      `
    SELECT t.*, r.type as reaction
    FROM tracks t
    LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
  `
    )
    .all(userId) as (Track & { reaction: "like" | "dislike" | null })[];
}

export function getTrackByIdWithReaction(
  db: Database,
  id: number,
  userId: number | null
): (Track & { reaction: "like" | "dislike" | null }) | undefined {
  if (!userId) {
    const track = getTrackById(db, id);
    return track ? { ...track, reaction: null } : undefined;
  }

  return db
    .prepare(
      `
    SELECT t.*, r.type as reaction
    FROM tracks t
    LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
    WHERE t.id = ?
  `
    )
    .get(userId, id) as
    | (Track & { reaction: "like" | "dislike" | null })
    | undefined;
}

export function searchTracksWithReactions(
  db: Database,
  query: string,
  userId: number | null
): (Track & { reaction: "like" | "dislike" | null })[] {
  if (!userId) {
    const tracks = searchTracks(db, query);
    return tracks.map((track) => ({ ...track, reaction: null }));
  }

  const searchTerm = `%${query}%`;
  return db
    .prepare(
      `
    SELECT t.*, r.type as reaction
    FROM tracks t
    LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
    WHERE title LIKE ? OR artist LIKE ? OR filename LIKE ?
  `
    )
    .all(userId, searchTerm, searchTerm, searchTerm) as (Track & {
    reaction: "like" | "dislike" | null;
  })[];
}

export function getTracksByAlbumIdWithReactions(
  db: Database,
  albumId: number,
  userId: number | null
): (Track & { reaction: "like" | "dislike" | null })[] {
  if (!userId) {
    const tracks = getTracksByAlbumId(db, albumId);
    return tracks.map((track) => ({ ...track, reaction: null }));
  }

  return db
    .prepare(
      `
    SELECT t.*, r.type as reaction
    FROM tracks t
    LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
    WHERE t.albumId = ?
    ORDER BY t.id ASC
  `
    )
    .all(userId, albumId) as (Track & {
    reaction: "like" | "dislike" | null;
  })[];
}

export function getAllAlbumsWithTracks(
  db: Database,
  userId: number | null
): (Album & { tracks: (Track & { reaction: "like" | "dislike" | null })[] })[] {
  const albums = getAllAlbums(db);

  return albums.map((album) => {
    const tracks = getTracksByAlbumIdWithReactions(db, album.id!, userId);
    return {
      ...album,
      tracks,
    };
  });
}

// Playlist-related functions
export function createPlaylist(
  db: Database,
  userId: number,
  name: string,
  description: string | null = null
): number {
  const insertQuery = db.prepare(`
    INSERT INTO playlists (userId, name, description, createdAt)
    VALUES (?, ?, ?, ?)
  `);
  const result = insertQuery.run(
    userId,
    name,
    description,
    new Date().getTime()
  );
  return result.lastInsertRowid as number;
}

export function addTrackToPlaylist(
  db: Database,
  playlistId: number,
  trackId: number,
  position: number
): void {
  const insertQuery = db.prepare(`
    INSERT INTO playlist_tracks (playlistId, trackId, position, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  insertQuery.run(playlistId, trackId, position, new Date().getTime());
}

export function removeTrackFromPlaylist(
  db: Database,
  playlistId: number,
  trackId: number
): boolean {
  const deleteQuery = db.prepare(`
    DELETE FROM playlist_tracks
    WHERE playlistId = ? AND trackId = ?
  `);
  const result = deleteQuery.run(playlistId, trackId);
  return result.changes > 0;
}

export function getPlaylistById(
  db: Database,
  playlistId: number,
  userId: number | null
):
  | (Playlist & { tracks: (Track & { reaction: "like" | "dislike" | null })[] })
  | undefined {
  const playlist = db
    .prepare(
      `
      SELECT p.*, u.username as ownerName
      FROM playlists p
      JOIN users u ON p.userId = u.id
      WHERE p.id = ?
    `
    )
    .get(playlistId) as (Playlist & { ownerName: string }) | undefined;

  if (!playlist) return undefined;

  const tracks = db
    .prepare(
      `
      SELECT t.*, pt.position, r.type as reaction
      FROM tracks t
      JOIN playlist_tracks pt ON pt.trackId = t.id
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      WHERE pt.playlistId = ?
      ORDER BY pt.position ASC
    `
    )
    .all(userId, playlistId) as (Track & {
    position: number;
    reaction: "like" | "dislike" | null;
  })[];

  return {
    ...playlist,
    tracks,
  };
}

export function getUserPlaylists(
  db: Database,
  userId: number
): (Playlist & { trackCount: number })[] {
  return db
    .prepare(
      `
      SELECT p.*, COUNT(pt.trackId) as trackCount
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON pt.playlistId = p.id
      WHERE p.userId = ?
      GROUP BY p.id
      ORDER BY p.createdAt DESC
    `
    )
    .all(userId) as (Playlist & { trackCount: number })[];
}

export function deletePlaylist(
  db: Database,
  playlistId: number,
  userId: number
): boolean {
  const deleteQuery = db.prepare(`
    DELETE FROM playlists
    WHERE id = ? AND userId = ?
  `);
  const result = deleteQuery.run(playlistId, userId);
  return result.changes > 0;
}

export function updatePlaylistOrder(
  db: Database,
  playlistId: number,
  trackOrders: { trackId: number; position: number }[]
): void {
  const updateQuery = db.prepare(`
    UPDATE playlist_tracks
    SET position = ?
    WHERE playlistId = ? AND trackId = ?
  `);

  const transaction = db.transaction((orders) => {
    for (const order of orders) {
      updateQuery.run(order.position, playlistId, order.trackId);
    }
  });

  transaction(trackOrders);
}

export function isPlaylistOwner(
  db: Database,
  playlistId: number,
  userId: number
): boolean {
  const playlist = db
    .prepare("SELECT userId FROM playlists WHERE id = ?")
    .get(playlistId) as { userId: number } | undefined;
  return playlist?.userId === userId;
}

export function advancedSearch(
  db: Database,
  query: string,
  userId: number | null,
  limit: number = 5
): {
  artists: { name: string; trackCount: number }[];
  albums: (Album & { artist: string | null; trackCount: number })[];
  tracks: (Track & { reaction: "like" | "dislike" | null })[];
} {
  const searchTerm = `%${query}%`;

  // Search for unique artists and their track counts
  const artists = db
    .prepare(
      `
      SELECT DISTINCT artist as name, COUNT(*) as trackCount
      FROM tracks
      WHERE artist IS NOT NULL AND artist LIKE ?
      GROUP BY artist
      ORDER BY trackCount DESC
      LIMIT ?
    `
    )
    .all(searchTerm, limit) as { name: string; trackCount: number }[];

  // Search for albums with their track counts
  const albums = db
    .prepare(
      `
      SELECT a.*, COUNT(t.id) as trackCount
      FROM albums a
      LEFT JOIN tracks t ON t.albumId = a.id
      WHERE a.title LIKE ? OR a.artist LIKE ?
      GROUP BY a.id
      ORDER BY a.title ASC
      LIMIT ?
    `
    )
    .all(searchTerm, searchTerm, limit) as (Album & {
    trackCount: number;
  })[];

  // Search for tracks with reactions
  const tracks = userId
    ? db
        .prepare(
          `
          SELECT t.*, r.type as reaction
          FROM tracks t
          LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
          WHERE t.title LIKE ? 
             OR t.artist LIKE ? 
             OR t.filename LIKE ?
          ORDER BY 
            CASE 
              WHEN t.title LIKE ? THEN 1
              WHEN t.artist LIKE ? THEN 2
              ELSE 3
            END,
            t.title ASC
          LIMIT ?
        `
        )
        .all(
          userId,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          limit
        )
    : db
        .prepare(
          `
          SELECT t.*, NULL as reaction
          FROM tracks t
          WHERE t.title LIKE ? 
             OR t.artist LIKE ? 
             OR t.filename LIKE ?
          ORDER BY 
            CASE 
              WHEN t.title LIKE ? THEN 1
              WHEN t.artist LIKE ? THEN 2
              ELSE 3
            END,
            t.title ASC
          LIMIT ?
        `
        )
        .all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit);

  return {
    artists,
    albums,
    tracks: tracks as (Track & { reaction: "like" | "dislike" | null })[],
  };
}
