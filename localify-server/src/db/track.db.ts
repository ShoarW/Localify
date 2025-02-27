import type { Database } from "better-sqlite3";
import type { Album, Track, Playlist } from "../types/model.js";

export function createTracksTable(db: Database) {
  // Create artists table first
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        imagePath TEXT,
        backgroundImagePath TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT NULL
    );
    `
  ).run();

  // First create albums table with artist reference
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artistId INTEGER,
        artistString TEXT,
        year INTEGER,
        coverPath TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT NULL,
        FOREIGN KEY (artistId) REFERENCES artists(id) ON DELETE SET NULL
    );
    `
  ).run();

  // Then create tracks table with album and artist references
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        title TEXT,
        artistId INTEGER,
        artistString TEXT,
        albumId INTEGER,
        genre TEXT,
        year INTEGER,
        duration REAL,
        mimeType TEXT NOT NULL,
        model TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT NULL,
        FOREIGN KEY (albumId) REFERENCES albums(id) ON DELETE SET NULL,
        FOREIGN KEY (artistId) REFERENCES artists(id) ON DELETE SET NULL
    );
    `
  ).run();

  // Create track_artists table for many-to-many relationship
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS track_artists (
        trackId INTEGER NOT NULL,
        artistId INTEGER NOT NULL,
        role TEXT DEFAULT 'primary',
        position INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (trackId, artistId),
        FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE,
        FOREIGN KEY (artistId) REFERENCES artists(id) ON DELETE CASCADE
    );
    `
  ).run();

  // Create album_artists table for many-to-many relationship
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS album_artists (
        albumId INTEGER NOT NULL,
        artistId INTEGER NOT NULL,
        role TEXT DEFAULT 'primary',
        position INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (albumId, artistId),
        FOREIGN KEY (albumId) REFERENCES albums(id) ON DELETE CASCADE,
        FOREIGN KEY (artistId) REFERENCES artists(id) ON DELETE CASCADE
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

  // Create play_counts table
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS play_counts (
        userId INTEGER NOT NULL,
        trackId INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        lastPlayed DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, trackId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE
    );
    `
  ).run();
}

// Album-related functions
export function getAlbumById(
  db: Database,
  id: number
):
  | (Album & {
      artist: string | null;
      type: "single" | "ep" | "album";
      hasImage: boolean;
      artists: {
        id: number;
        name: string;
        role: "primary" | "featured";
        position: number;
      }[];
    })
  | undefined {
  const result = db
    .prepare(
      `
      WITH album_tracks AS (
        SELECT 
          a.id,
          a.title,
          a.artistId,
          a.artistString,
          ar.name as artist,
          CASE WHEN a.coverPath IS NOT NULL THEN 1 ELSE 0 END as hasImage,
          COUNT(t.id) as trackCount,
          GROUP_CONCAT(DISTINCT aa.artistId || ':' || art.name || ':' || aa.role || ':' || aa.position) as artists
        FROM albums a
        LEFT JOIN artists ar ON a.artistId = ar.id
        LEFT JOIN tracks t ON t.albumId = a.id
        LEFT JOIN album_artists aa ON aa.albumId = a.id
        LEFT JOIN artists art ON art.id = aa.artistId
        WHERE a.id = ?
        GROUP BY a.id
      )
      SELECT 
        *,
        CASE 
          WHEN trackCount <= 3 THEN 'single'
          WHEN trackCount <= 6 THEN 'ep'
          ELSE 'album'
        END as type
      FROM album_tracks
    `
    )
    .get(id) as
    | (Album & {
        artist: string | null;
        type: "single" | "ep" | "album";
        hasImage: boolean;
        artists: string;
      })
    | undefined;

  if (!result) return undefined;

  // Parse the artists string into an array of objects
  const artists = result.artists
    ? result.artists
        .split(",")
        .map((artist) => {
          const [id, name, role, position] = artist.split(":");
          return {
            id: parseInt(id),
            name,
            role: role as "primary" | "featured",
            position: parseInt(position),
          };
        })
        .sort((a, b) => a.position - b.position)
    : [];

  return {
    ...result,
    artists,
  };
}

export function getAllAlbums(
  db: Database,
  limit: number = 20,
  offset: number = 0
): {
  items: (Album & {
    artist: string | null;
    type: "single" | "ep" | "album";
    hasImage: boolean;
  })[];
  total: number;
} {
  // First get total count
  const total = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM albums
    `
    )
    .get() as { count: number };

  // Then get paginated results
  const items = db
    .prepare(
      `
      WITH album_tracks AS (
        SELECT 
          a.id,
          a.title,
          a.artistId,
          ar.name as artist,
          CASE WHEN a.coverPath IS NOT NULL THEN 1 ELSE 0 END as hasImage,
          COUNT(t.id) as trackCount
        FROM albums a
        LEFT JOIN artists ar ON a.artistId = ar.id
        LEFT JOIN tracks t ON t.albumId = a.id
        GROUP BY a.id
      )
      SELECT 
        *,
        CASE 
          WHEN trackCount <= 3 THEN 'single'
          WHEN trackCount <= 6 THEN 'ep'
          ELSE 'album'
        END as type
      FROM album_tracks
      ORDER BY title ASC
      LIMIT ? OFFSET ?
    `
    )
    .all(limit, offset) as (Album & {
    artist: string | null;
    type: "single" | "ep" | "album";
    hasImage: boolean;
  })[];

  return {
    items,
    total: total.count,
  };
}

export function addAlbum(db: Database, album: Omit<Album, "id">): number {
  const insertQuery = db.prepare(`
    INSERT INTO albums (title, artistId, year, coverPath, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = insertQuery.run(
    album.title,
    album.artistId,
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
  return db.prepare(BASE_TRACK_QUERY).all() as Track[];
}

export function getTrackById(db: Database, id: number): Track | undefined {
  const track = db
    .prepare(
      `
      ${BASE_TRACK_QUERY}
      WHERE t.id = ?
      GROUP BY t.id
      `
    )
    .get(id) as Track | undefined;

  if (!track) return undefined;

  return track;
}

export function getTrackByPath(
  db: Database,
  filePath: string
): Track | undefined {
  return db
    .prepare(
      `
      ${BASE_TRACK_QUERY}
      WHERE t.path = ?
    `
    )
    .get(filePath) as Track | undefined;
}

export function addTrack(
  db: Database,
  track: Omit<
    Track,
    "id" | "reaction" | "hasImage" | "artistName" | "albumName"
  >
): void {
  const insertQuery = db.prepare(`
    INSERT INTO tracks (
      title, artistId, albumId, genre, 
      year, duration
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertQuery.run(
    track.title,
    track.artistId,
    track.albumId,
    track.genre,
    track.year,
    track.duration
  );
}

export function deleteTrack(db: Database, id: number): boolean {
  const deleteQuery = db.prepare("DELETE FROM tracks WHERE id = ?");
  const result = deleteQuery.run(id);
  return result.changes > 0;
}

export function searchTracks(db: Database, query: string): Track[] {
  const searchTerm = `%${query}%`;
  return db
    .prepare(
      `
      ${BASE_TRACK_QUERY}
      WHERE t.title LIKE ? 
         OR ar.name LIKE ? 
         OR al.title LIKE ? 
         OR t.filename LIKE ?
      ORDER BY 
        CASE 
          WHEN t.title LIKE ? THEN 1
          WHEN ar.name LIKE ? THEN 2
          ELSE 3
        END,
        t.title ASC
    `
    )
    .all(
      searchTerm,
      searchTerm,
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
    return db
      .prepare(
        `
        SELECT 
          t.id,
          t.title,
          t.genre,
          t.duration,
          t.albumId,
          ar.name as artistName,
          NULL as reaction
        FROM tracks t
        LEFT JOIN artists ar ON t.artistId = ar.id
        ORDER BY t.id ASC
      `
      )
      .all() as (Track & { reaction: "like" | "dislike" | null })[];
  }

  return db
    .prepare(
      `
      SELECT 
        t.id,
        t.title,
        t.genre,
        t.duration,
        t.albumId,
        ar.name as artistName,
        r.type as reaction
      FROM tracks t
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      LEFT JOIN artists ar ON t.artistId = ar.id
      ORDER BY t.id ASC
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
    return db
      .prepare(
        `
        SELECT 
          t.id,
          t.title,
          t.genre,
          t.duration,
          t.albumId,
          ar.name as artistName,
          NULL as reaction
        FROM tracks t
        LEFT JOIN artists ar ON t.artistId = ar.id
        WHERE t.id = ?
      `
      )
      .get(id) as (Track & { reaction: "like" | "dislike" | null }) | undefined;
  }

  return db
    .prepare(
      `
      SELECT 
        t.id,
        t.title,
        t.genre,
        t.duration,
        t.albumId,
        ar.name as artistName,
        r.type as reaction
      FROM tracks t
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      LEFT JOIN artists ar ON t.artistId = ar.id
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
      LEFT JOIN artists a ON t.artistId = a.id
      LEFT JOIN albums al ON t.albumId = al.id
      WHERE t.title LIKE ? 
         OR a.name LIKE ? 
         OR al.title LIKE ? 
         OR t.filename LIKE ?
      ORDER BY 
        CASE 
          WHEN t.title LIKE ? THEN 1
          WHEN a.name LIKE ? THEN 2
          ELSE 3
        END,
        t.title ASC
    `
    )
    .all(
      userId,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    ) as (Track & {
    reaction: "like" | "dislike" | null;
  })[];
}

export function getTracksByAlbumIdWithReactions(
  db: Database,
  albumId: number,
  userId: number | null
): (Track & {
  reaction: "like" | "dislike" | null;
  artistName: string | null;
  albumName: string | null;
})[] {
  return db
    .prepare(
      `
      ${BASE_TRACK_WITH_REACTION_QUERY(userId)}
      WHERE t.albumId = ?
      ORDER BY t.id ASC
    `
    )
    .all(albumId) as (Track & {
    reaction: "like" | "dislike" | null;
    artistName: string | null;
    albumName: string | null;
  })[];
}

export function getAllAlbumsWithTracks(
  db: Database,
  userId: number | null
): (Album & {
  artist: string | null;
  type: "single" | "ep" | "album";
  tracks: (Track & { reaction: "like" | "dislike" | null })[];
})[] {
  const albums = getAllAlbums(db);

  return albums.items.map((album) => {
    const tracks = getTracksByAlbumIdWithReactions(db, album.id!, userId);
    return {
      ...album,
      tracks,
    };
  });
}

export function getAlbumWithTracks(
  db: Database,
  id: number,
  userId: number | null
):
  | {
      album: Album & { artist: string | null; type: "single" | "ep" | "album" };
      tracks: (Track & { reaction: "like" | "dislike" | null })[];
    }
  | undefined {
  const album = getAlbumById(db, id);
  if (!album) return undefined;

  const tracks = getTracksByAlbumIdWithReactions(db, album.id!, userId);
  return { album, tracks };
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
  | (Playlist & {
      tracks: (Track & {
        reaction: "like" | "dislike" | null;
        artistName: string | null;
        album: string | null;
      })[];
    })
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

  const tracksQuery = userId
    ? `
      SELECT 
        t.id,
        t.title,
        t.duration,
        t.genre,
        t.albumId,
        t.artistId,
        pt.position,
        r.type as reaction,
        ar.name as artistName,
        al.title as album
      FROM tracks t
      JOIN playlist_tracks pt ON pt.trackId = t.id
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      LEFT JOIN artists ar ON t.artistId = ar.id
      LEFT JOIN albums al ON t.albumId = al.id
      WHERE pt.playlistId = ?
      ORDER BY pt.position ASC
    `
    : `
      SELECT 
        t.id,
        t.title,
        t.duration,
        t.genre,
        t.albumId,
        t.artistId,
        pt.position,
        NULL as reaction,
        ar.name as artistName,
        al.title as albumName
      FROM tracks t
      JOIN playlist_tracks pt ON pt.trackId = t.id
      LEFT JOIN artists ar ON t.artistId = ar.id
      LEFT JOIN albums al ON t.albumId = al.id
      WHERE pt.playlistId = ?
      ORDER BY pt.position ASC
    `;

  const tracks = userId
    ? db.prepare(tracksQuery).all(userId, playlistId)
    : (db.prepare(tracksQuery).all(playlistId) as any);

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
  artists: {
    id: number;
    name: string;
    trackCount: number;
    hasImage: boolean;
  }[];
  albums: (Album & {
    artist: string | null;
    trackCount: number;
    hasImage: boolean;
  })[];
  tracks: (Track & {
    reaction: "like" | "dislike" | null;
    artistName: string | null;
  })[];
} {
  const searchTerm = `%${query}%`;

  // Search for artists and their track counts
  const artists = db
    .prepare(
      `
      SELECT 
        a.id, 
        a.name, 
        COUNT(t.id) as trackCount,
        CASE WHEN a.imagePath IS NOT NULL THEN 1 ELSE 0 END as hasImage
      FROM artists a
      LEFT JOIN tracks t ON t.artistId = a.id
      WHERE a.name LIKE ?
      GROUP BY a.id
      ORDER BY trackCount DESC
      LIMIT ?
    `
    )
    .all(searchTerm, limit) as {
    id: number;
    name: string;
    trackCount: number;
    hasImage: boolean;
  }[];

  // Search for albums with their track counts and artist names
  const albums = db
    .prepare(
      `
      SELECT 
        a.id,
        a.title,
        a.artistId,
        CASE WHEN a.coverPath IS NOT NULL THEN 1 ELSE 0 END as hasImage,
        ar.name as artist, 
        COUNT(t.id) as trackCount
      FROM albums a
      LEFT JOIN tracks t ON t.albumId = a.id
      LEFT JOIN artists ar ON a.artistId = ar.id
      WHERE a.title LIKE ? OR ar.name LIKE ?
      GROUP BY a.id
      ORDER BY a.title ASC
      LIMIT ?
    `
    )
    .all(searchTerm, searchTerm, limit) as (Album & {
    artist: string | null;
    trackCount: number;
    hasImage: boolean;
  })[];

  // Search for tracks with reactions and artist names
  const tracks = userId
    ? db
        .prepare(
          `
          SELECT 
            t.id,
            t.title,
            t.genre,
            t.duration,
            t.albumId,
            r.type as reaction,
            ar.name as artistName
          FROM tracks t
          LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
          LEFT JOIN artists ar ON t.artistId = ar.id
          WHERE t.title LIKE ? 
             OR ar.name LIKE ? 
          ORDER BY 
            CASE 
              WHEN t.title LIKE ? THEN 1
              WHEN ar.name LIKE ? THEN 2
              ELSE 3
            END,
            t.title ASC
          LIMIT ?
        `
        )
        .all(userId, searchTerm, searchTerm, searchTerm, searchTerm, limit)
    : db
        .prepare(
          `
          SELECT 
            t.id,
            t.title,
            t.genre,
            t.duration,
            t.albumId,
            NULL as reaction,
            ar.name as artistName
          FROM tracks t
          LEFT JOIN artists ar ON t.artistId = ar.id
          WHERE t.title LIKE ? 
             OR ar.name LIKE ? 
          ORDER BY 
            CASE 
              WHEN t.title LIKE ? THEN 1
              WHEN ar.name LIKE ? THEN 2
              ELSE 3
            END,
            t.title ASC
          LIMIT ?
        `
        )
        .all(searchTerm, searchTerm, searchTerm, searchTerm, limit);

  return {
    artists,
    albums,
    tracks: tracks as (Track & {
      reaction: "like" | "dislike" | null;
      artistName: string | null;
    })[],
  };
}

// Add artist-related functions
export function getArtistById(
  db: Database,
  artistId: number,
  userId: number | null
):
  | {
      artist: {
        id: number;
        name: string;
        description: string | null;
        hasImage: boolean;
        hasBackgroundImage: boolean;
      };
      randomTracks: (Track & { reaction: "like" | "dislike" | null })[];
      albums: (Album & {
        trackCount: number;
        type: "single" | "ep" | "album";
        hasImage: boolean;
      })[];
      singles: (Track & { reaction: "like" | "dislike" | null })[];
    }
  | undefined {
  const artist = db
    .prepare(
      `
      SELECT 
        id,
        name,
        description,
        CASE WHEN imagePath IS NOT NULL THEN 1 ELSE 0 END as hasImage,
        CASE WHEN backgroundImagePath IS NOT NULL THEN 1 ELSE 0 END as hasBackgroundImage
      FROM artists 
      WHERE id = ?
    `
    )
    .get(artistId) as
    | {
        id: number;
        name: string;
        description: string | null;
        hasImage: boolean;
        hasBackgroundImage: boolean;
      }
    | undefined;

  if (!artist) return undefined;

  const randomTracks = db
    .prepare(
      `
      SELECT 
        t.id,
        t.title,
        t.duration,
        t.genre,
        r.type as reaction,
        ar.name as artistName
      FROM tracks t
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      LEFT JOIN artists ar ON t.artistId = ar.id
      WHERE t.artistId = ?
      ORDER BY RANDOM()
      LIMIT 5
    `
    )
    .all(userId, artistId) as (Track & {
    reaction: "like" | "dislike" | null;
    artistName: string | null;
  })[];

  const albums = getArtistAlbums(db, artistId);

  const singles = db
    .prepare(
      `
      SELECT 
        t.id,
        t.title,
        t.duration,
        t.genre,
        r.type as reaction,
        ar.name as artistName
      FROM tracks t
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      LEFT JOIN artists ar ON t.artistId = ar.id
      WHERE t.artistId = ? AND t.albumId IS NULL
      ORDER BY t.createdAt DESC
    `
    )
    .all(userId, artistId) as (Track & {
    reaction: "like" | "dislike" | null;
    artistName: string | null;
  })[];

  return {
    artist,
    randomTracks,
    albums,
    singles,
  };
}

export function getAllArtists(
  db: Database,
  limit: number = 20,
  offset: number = 0
): {
  items: {
    id: number;
    name: string;
    description: string | null;
    hasImage: boolean;
    hasBackgroundImage: boolean;
    trackCount: number;
    albumCount: number;
  }[];
  total: number;
} {
  // First get total count
  const total = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM artists
    `
    )
    .get() as { count: number };

  // Then get paginated results
  const items = db
    .prepare(
      `
      SELECT 
        a.id,
        a.name,
        a.description,
        CASE WHEN a.imagePath IS NOT NULL THEN 1 ELSE 0 END as hasImage,
        CASE WHEN a.backgroundImagePath IS NOT NULL THEN 1 ELSE 0 END as hasBackgroundImage,
        COUNT(DISTINCT t.id) as trackCount,
        COUNT(DISTINCT al.id) as albumCount
      FROM artists a
      LEFT JOIN tracks t ON t.artistId = a.id
      LEFT JOIN albums al ON al.artistId = a.id
      GROUP BY a.id
      ORDER BY a.name ASC
      LIMIT ? OFFSET ?
    `
    )
    .all(limit, offset) as {
    id: number;
    name: string;
    description: string | null;
    hasImage: boolean;
    hasBackgroundImage: boolean;
    trackCount: number;
    albumCount: number;
  }[];

  return {
    items,
    total: total.count,
  };
}

export function createOrUpdateArtist(
  db: Database,
  artist: {
    id?: number;
    name: string;
    description?: string | null;
    imagePath?: string | null;
    backgroundImagePath?: string | null;
  }
): number {
  if (artist.id) {
    // For updates, first check if the new name conflicts with any other artist
    const existingArtist = db
      .prepare("SELECT id FROM artists WHERE name = ? AND id != ?")
      .get(artist.name, artist.id) as { id: number } | undefined;

    if (existingArtist) {
      throw new Error("An artist with this name already exists");
    }

    // Update existing artist
    const updateQuery = db.prepare(`
      UPDATE artists 
      SET name = ?, description = ?, imagePath = ?, backgroundImagePath = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateQuery.run(
      artist.name,
      artist.description,
      artist.imagePath,
      artist.backgroundImagePath,
      artist.id
    );
    return artist.id;
  } else {
    // For new artists, check if name already exists
    const existingArtist = db
      .prepare("SELECT id FROM artists WHERE name = ?")
      .get(artist.name) as { id: number } | undefined;

    if (existingArtist) {
      throw new Error("An artist with this name already exists");
    }

    // Create new artist
    const insertQuery = db.prepare(`
      INSERT INTO artists (name, description, imagePath, backgroundImagePath)
      VALUES (?, ?, ?, ?)
    `);
    const result = insertQuery.run(
      artist.name,
      artist.description,
      artist.imagePath,
      artist.backgroundImagePath
    );
    return result.lastInsertRowid as number;
  }
}

export function getShuffledArtistTracks(
  db: Database,
  artistId: number,
  userId: number | null,
  limit: number = 50
): (Track & {
  reaction: "like" | "dislike" | null;
  artistName: string | null;
})[] {
  return db
    .prepare(
      `
      ${BASE_TRACK_WITH_REACTION_QUERY(userId)}
      WHERE t.artistId = ?
      ORDER BY RANDOM()
      LIMIT ?
    `
    )
    .all(artistId, limit) as (Track & {
    reaction: "like" | "dislike" | null;
    artistName: string | null;
  })[];
}

// Get all albums with track counts and classify them
export function getArtistAlbums(
  db: Database,
  artistId: number
): (Album & {
  trackCount: number;
  type: "single" | "ep" | "album";
  hasImage: boolean;
})[] {
  return db
    .prepare(
      `
      WITH album_tracks AS (
        SELECT 
          a.id,
          a.title,
          CASE WHEN a.coverPath IS NOT NULL THEN 1 ELSE 0 END as hasImage,
          COUNT(t.id) as trackCount
        FROM albums a
        LEFT JOIN tracks t ON t.albumId = a.id
        WHERE a.artistId = ?
        GROUP BY a.id
      )
      SELECT 
        *,
        CASE 
          WHEN trackCount <= 3 THEN 'single'
          WHEN trackCount <= 6 THEN 'ep'
          ELSE 'album'
        END as type
      FROM album_tracks
      ORDER BY title ASC
    `
    )
    .all(artistId) as (Album & {
    trackCount: number;
    type: "single" | "ep" | "album";
    hasImage: boolean;
  })[];
}

// Add play count functions
export function incrementPlayCount(
  db: Database,
  userId: number,
  trackId: number
): void {
  const upsertQuery = db.prepare(`
    INSERT INTO play_counts (userId, trackId, count, lastPlayed)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(userId, trackId) DO UPDATE SET
      count = count + 1,
      lastPlayed = CURRENT_TIMESTAMP
  `);
  upsertQuery.run(userId, trackId);
}

export function getPlayCount(
  db: Database,
  userId: number,
  trackId: number
): { count: number; lastPlayed: number } | undefined {
  return db
    .prepare(
      "SELECT count, lastPlayed FROM play_counts WHERE userId = ? AND trackId = ?"
    )
    .get(userId, trackId) as { count: number; lastPlayed: number } | undefined;
}

export function getTopPlayedTracks(
  db: Database,
  userId: number,
  limit: number = 50
): (Track & { playCount: number; lastPlayed: number })[] {
  return db
    .prepare(
      `
      SELECT 
        ${BASE_TRACK_FIELDS},
        pc.count as playCount,
        pc.lastPlayed,
        ar.name as artistName,
        al.title as albumName
      FROM tracks t
      JOIN play_counts pc ON pc.trackId = t.id
      LEFT JOIN artists ar ON t.artistId = ar.id
      LEFT JOIN albums al ON t.albumId = al.id
      WHERE pc.userId = ?
      ORDER BY pc.count DESC, pc.lastPlayed DESC
      LIMIT ?
    `
    )
    .all(userId, limit) as (Track & {
    playCount: number;
    lastPlayed: number;
  })[];
}

export function getNewReleases(
  db: Database,
  limit: number = 10
): (Album & {
  artist: string | null;
  type: "single" | "ep" | "album";
  hasImage: boolean;
})[] {
  return db
    .prepare(
      `
      WITH album_tracks AS (
        SELECT 
          a.id,
          a.title,
          a.artistId,
          ar.name as artist,
          CASE WHEN a.coverPath IS NOT NULL THEN 1 ELSE 0 END as hasImage,
          COUNT(t.id) as trackCount
        FROM albums a
        LEFT JOIN artists ar ON a.artistId = ar.id
        LEFT JOIN tracks t ON t.albumId = a.id
        GROUP BY a.id
      )
      SELECT 
        *,
        CASE 
          WHEN trackCount <= 3 THEN 'single'
          WHEN trackCount <= 6 THEN 'ep'
          ELSE 'album'
        END as type
      FROM album_tracks
      ORDER BY id DESC
      LIMIT ?
    `
    )
    .all(limit) as (Album & {
    artist: string | null;
    type: "single" | "ep" | "album";
    hasImage: boolean;
  })[];
}

export function getQuickPicks(
  db: Database,
  userId: number | null,
  limit: number = 10
): (Track & {
  reaction: "like" | "dislike" | null;
  artistName: string | null;
})[] {
  return db
    .prepare(
      `
      ${BASE_TRACK_WITH_REACTION_QUERY(userId)}
      ORDER BY RANDOM()
      LIMIT ?
    `
    )
    .all(limit) as (Track & {
    reaction: "like" | "dislike" | null;
    artistName: string | null;
  })[];
}

export function getListenAgain(
  db: Database,
  userId: number,
  limit: number = 10
): (Track & { lastPlayed: number; artistName: string | null })[] {
  return db
    .prepare(
      `
      SELECT 
        ${BASE_TRACK_FIELDS},
        pc.lastPlayed,
        ar.name as artistName,
        al.title as albumName
      FROM tracks t
      JOIN play_counts pc ON pc.trackId = t.id
      LEFT JOIN artists ar ON t.artistId = ar.id
      LEFT JOIN albums al ON t.albumId = al.id
      WHERE pc.userId = ?
      ORDER BY pc.lastPlayed DESC
      LIMIT ?
    `
    )
    .all(userId, limit) as (Track & {
    lastPlayed: number;
    artistName: string | null;
  })[];
}

export function migrateDatabase(db: Database) {
  // Add backgroundImagePath to artists table if it doesn't exist
  const artistsTableInfo = db.prepare("PRAGMA table_info(artists)").all() as {
    name: string;
  }[];
  if (!artistsTableInfo.some((col) => col.name === "backgroundImagePath")) {
    db.prepare(
      `
      ALTER TABLE artists
      ADD COLUMN backgroundImagePath TEXT;
      `
    ).run();
  }

  // Add model to tracks table if it doesn't exist
  const tracksTableInfo = db.prepare("PRAGMA table_info(tracks)").all() as {
    name: string;
  }[];
  if (!tracksTableInfo.some((col) => col.name === "model")) {
    db.prepare(
      `
      ALTER TABLE tracks
      ADD COLUMN model TEXT;
      `
    ).run();
  }
}

const BASE_TRACK_FIELDS = `
  t.id,
  t.title,
  t.artistId,
  t.duration,
  t.genre,
  t.year,
  ar.name as artistName,
  al.title as albumName,
  t.albumId,
  CASE WHEN al.coverPath IS NOT NULL THEN 1 ELSE 0 END as hasImage
`;

const BASE_TRACK_QUERY = `
  SELECT 
    ${BASE_TRACK_FIELDS}
  FROM tracks t
  LEFT JOIN artists ar ON t.artistId = ar.id
  LEFT JOIN albums al ON t.albumId = al.id
`;

const BASE_TRACK_WITH_REACTION_QUERY = (userId: number | null) => `
  SELECT 
    ${BASE_TRACK_FIELDS},
    ${userId ? "r.type as reaction" : "NULL as reaction"}
  FROM tracks t
  ${
    userId
      ? `LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ${userId}`
      : ""
  }
  LEFT JOIN artists ar ON t.artistId = ar.id
  LEFT JOIN albums al ON t.albumId = al.id
`;
