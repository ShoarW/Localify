// src/services/track.service.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as mm from "music-metadata";
import { db } from "../db/db.js";
import {
  addTrack as dbAddTrack,
  getAllTracks as dbGetAllTracks,
  getTrackById as dbGetTrackById,
  deleteTrack as dbDeleteTrack,
  searchTracks as dbSearchTracks,
  getTrackByPath as dbGetTrackByPath,
  addAlbum as dbAddAlbum,
  getAlbumById as dbGetAlbumById,
  getAllAlbums as dbGetAllAlbums,
  getTracksByAlbumId as dbGetTracksByAlbumId,
  findAlbumByTitle,
  setReaction as dbSetReaction,
  getReactedTracks as dbGetReactedTracks,
  getReaction as dbGetReaction,
  getAllTracksWithReactions as dbGetAllTracksWithReactions,
  getTrackByIdWithReaction as dbGetTrackByIdWithReaction,
  searchTracksWithReactions as dbSearchTracksWithReactions,
  getTracksByAlbumIdWithReactions as dbGetTracksByAlbumIdWithReactions,
  getAllAlbumsWithTracks as dbGetAllAlbumsWithTracks,
  createPlaylist as dbCreatePlaylist,
  addTrackToPlaylist as dbAddTrackToPlaylist,
  removeTrackFromPlaylist as dbRemoveTrackFromPlaylist,
  getPlaylistById as dbGetPlaylistById,
  getUserPlaylists as dbGetUserPlaylists,
  deletePlaylist as dbDeletePlaylist,
  updatePlaylistOrder as dbUpdatePlaylistOrder,
  isPlaylistOwner as dbIsPlaylistOwner,
  advancedSearch as dbAdvancedSearch,
  getArtistById as dbGetArtistById,
  getAllArtists as dbGetAllArtists,
  createOrUpdateArtist as dbCreateOrUpdateArtist,
  getAlbumWithTracks as dbGetAlbumWithTracks,
  getShuffledArtistTracks as dbGetShuffledArtistTracks,
  incrementPlayCount as dbIncrementPlayCount,
  getPlayCount as dbGetPlayCount,
  getTopPlayedTracks as dbGetTopPlayedTracks,
  getNewReleases as dbGetNewReleases,
  getQuickPicks as dbGetQuickPicks,
  getListenAgain as dbGetListenAgain,
} from "../db/track.db.js";
import type { Track, Album, Playlist } from "../types/model.js";
import mime from "mime-types";
import type { Database } from "better-sqlite3";

// Common cover art filenames to look for
const COVER_ART_FILENAMES = [
  "cover.jpg",
  "cover.jpeg",
  "cover.png",
  "folder.jpg",
  "folder.jpeg",
  "folder.png",
  "album.jpg",
  "album.jpeg",
  "album.png",
  "artwork.jpg",
  "artwork.jpeg",
  "artwork.png",
  "front.jpg",
  "front.jpeg",
  "front.png",
];

async function findCoverArtInDirectory(
  directoryPath: string
): Promise<string | null> {
  try {
    const files = await fs.readdir(directoryPath);

    // First look for exact matches
    for (const coverFile of COVER_ART_FILENAMES) {
      if (files.includes(coverFile)) {
        return path.join(directoryPath, coverFile);
      }
    }

    // Then try case-insensitive matches
    const lowerCaseFiles = files.map((f) => f.toLowerCase());
    for (const coverFile of COVER_ART_FILENAMES) {
      const index = lowerCaseFiles.indexOf(coverFile);
      if (index !== -1) {
        return path.join(directoryPath, files[index]);
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding cover art:", error);
    return null;
  }
}

export async function indexDirectory(
  directoryPath: string,
  progressCallback?: (progress: {
    type: "scanning" | "processing" | "cleanup";
    total?: number;
    current: number;
    currentFile?: string;
    added: number;
    removed: number;
    unchanged: number;
  }) => void
): Promise<{
  added: Track[];
  removed: Track[];
  unchanged: Track[];
}> {
  const added: Track[] = [];
  const removed: Track[] = [];
  const unchanged: Track[] = [];
  const BATCH_SIZE = 50; // Process files in batches of 50

  // First, scan all files
  progressCallback?.({
    type: "scanning",
    current: 0,
    added: 0,
    removed: 0,
    unchanged: 0,
  });
  const currentFiles = await getAllMusicFiles(directoryPath);
  const existingTracks = await dbGetAllTracks(db);
  const existingTrackPaths = new Set(existingTracks.map((track) => track.path));

  // Process files in batches
  const filesToProcess = currentFiles.filter(
    (filePath) => !existingTrackPaths.has(filePath)
  );
  const totalFiles = filesToProcess.length;

  // Process new files in batches
  for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
    const batch = filesToProcess.slice(i, i + BATCH_SIZE);

    // Process batch sequentially
    for (const filePath of batch) {
      try {
        await addTrack(filePath);
        const addedTrack = await getTrackByPath(filePath);
        if (addedTrack) {
          added.push(addedTrack);
        }
        progressCallback?.({
          type: "processing",
          total: totalFiles,
          current: i + added.length,
          currentFile: filePath,
          added: added.length,
          removed: removed.length,
          unchanged: unchanged.length,
        });
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }
  }

  // Add unchanged tracks
  for (const filePath of currentFiles) {
    if (existingTrackPaths.has(filePath)) {
      const existingTrack = existingTracks.find((t) => t.path === filePath)!;
      unchanged.push(existingTrack);
      existingTrackPaths.delete(filePath);
    }
  }

  // Process removals in batches
  const pathsToRemove = Array.from(existingTrackPaths);
  for (let i = 0; i < pathsToRemove.length; i += BATCH_SIZE) {
    const batch = pathsToRemove.slice(i, i + BATCH_SIZE);

    progressCallback?.({
      type: "cleanup",
      total: pathsToRemove.length,
      current: i,
      added: added.length,
      removed: removed.length,
      unchanged: unchanged.length,
    });

    // Process removals sequentially as well
    for (const pathToRemove of batch) {
      const trackToDelete = existingTracks.find((t) => t.path === pathToRemove);
      if (trackToDelete && trackToDelete.id) {
        const deleted = await deleteTrack(trackToDelete.id);
        if (deleted) {
          removed.push(trackToDelete);
        }
      }
    }
  }

  // Final progress update
  progressCallback?.({
    type: "cleanup",
    total: pathsToRemove.length,
    current: pathsToRemove.length,
    added: added.length,
    removed: removed.length,
    unchanged: unchanged.length,
  });

  return { added, removed, unchanged };
}

// Helper function (now part of the service)
async function getAllMusicFiles(directoryPath: string): Promise<string[]> {
  let filePaths: string[] = [];
  const files = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(directoryPath, file.name);
    if (file.isDirectory()) {
      filePaths = filePaths.concat(await getAllMusicFiles(fullPath));
    } else if (isMusicFile(file.name)) {
      filePaths.push(fullPath);
    }
  }
  return filePaths;
}

// Helper function (also part of the service)
function isMusicFile(filename: string): boolean {
  const supportedExtensions = [".mp3", ".flac", ".wav", ".ogg", ".m4a", ".aac"];
  const ext = path.extname(filename).toLowerCase();
  return supportedExtensions.includes(ext);
}

function cleanAlbumTitle(albumTitle: string): string {
  // Remove CD/Disc information and trim whitespace
  return albumTitle.replace(/\s*(?:CD|Disc)\s*\d+/i, "").trim();
}

async function findOrCreateArtist(
  artistName: string | null
): Promise<number | null> {
  if (!artistName) return null;

  // Try to find existing artist
  const existingArtist = db
    .prepare("SELECT id FROM artists WHERE name = ?")
    .get(artistName) as { id: number } | undefined;

  if (existingArtist) {
    return existingArtist.id;
  }

  // Create new artist
  const result = db
    .prepare("INSERT INTO artists (name) VALUES (?)")
    .run(artistName);

  return result.lastInsertRowid as number;
}

export async function addTrack(filePath: string): Promise<void> {
  try {
    const metadata = await mm.parseFile(filePath);
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    // Find or create artist for the track
    const artistId = await findOrCreateArtist(metadata.common.artist || null);

    // Try to find or create album if we have album metadata
    let albumId: number | null = null;
    if (metadata.common.album) {
      const albumTitle = cleanAlbumTitle(metadata.common.album);
      const directoryPath = path.dirname(filePath);

      // Try to find existing album by exact title match (case-insensitive)
      const existingAlbum = findAlbumByTitle(db, albumTitle);

      if (existingAlbum) {
        albumId = existingAlbum.id!;

        // Update cover art if not set and found in directory
        if (!existingAlbum.coverPath) {
          const coverPath = await findCoverArtInDirectory(directoryPath);
          if (coverPath) {
            db.prepare("UPDATE albums SET coverPath = ? WHERE id = ?").run(
              coverPath,
              albumId
            );
          }
        }
      } else {
        // Look for cover art in the album directory
        const coverPath = await findCoverArtInDirectory(directoryPath);

        // Create new album with the track's artist
        const album: Omit<Album, "id"> = {
          title: albumTitle,
          artistId: artistId,
          year: metadata.common.year || null,
          coverPath: coverPath,
          createdAt: new Date().getTime(),
          updatedAt: null,
        };
        albumId = dbAddAlbum(db, album);
      }
    }

    const track: Omit<Track, "id"> = {
      path: filePath,
      filename: path.basename(filePath),
      title: metadata.common.title || null,
      artistId: artistId,
      albumId: albumId,
      genre: metadata.common.genre ? metadata.common.genre.join(", ") : null,
      year: metadata.common.year || null,
      duration: metadata.format.duration || null,
      mimeType: mimeType,
      createdAt: new Date().getTime(),
      updatedAt: null,
    };

    // Check if the track already exists
    const existingTrack = dbGetTrackByPath(db, track.path);
    if (existingTrack) {
      return; // Skip if track already exists
    }

    // Add the track
    dbAddTrack(db, track);

    // After adding the track, check if we need to update the album's artist to "Various Artists"
    if (albumId) {
      const albumTracks = db
        .prepare(
          "SELECT DISTINCT artistId FROM tracks WHERE albumId = ? AND artistId IS NOT NULL"
        )
        .all(albumId) as { artistId: number }[];

      // If we have multiple different artists on this album
      if (albumTracks.length > 1) {
        const variousArtistsId = await findOrCreateArtist("Various Artists");
        db.prepare("UPDATE albums SET artistId = ? WHERE id = ?").run(
          variousArtistsId,
          albumId
        );
      }
    }
  } catch (error) {
    console.error(`Error adding track ${filePath}:`, error);
    throw error;
  }
}

export async function getAllTracks(
  userId: number | null = null
): Promise<(Track & { reaction: "like" | "dislike" | null })[]> {
  return dbGetAllTracksWithReactions(db, userId);
}

export async function getTrackByPath(
  filePath: string
): Promise<Track | undefined> {
  return dbGetTrackByPath(db, filePath);
}

export async function getTrackById(
  id: number,
  userId: number | null = null
): Promise<
  | (Track & {
      reaction: "like" | "dislike" | null;
      albumHasImage: boolean | null;
    })
  | undefined
> {
  return getTrackByIdWithReaction(db, id, userId);
}

export function getTrackByIdWithReaction(
  db: Database,
  id: number,
  userId: number | null
):
  | (Track & {
      reaction: "like" | "dislike" | null;
      albumHasImage: boolean | null;
    })
  | undefined {
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
          NULL as reaction,
          CASE WHEN al.coverPath IS NOT NULL THEN 1 ELSE 0 END as albumHasImage
        FROM tracks t
        LEFT JOIN artists ar ON t.artistId = ar.id
        LEFT JOIN albums al ON t.albumId = al.id
        WHERE t.id = ?
      `
      )
      .get(id) as
      | (Track & {
          reaction: "like" | "dislike" | null;
          albumHasImage: boolean | null;
        })
      | undefined;
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
        r.type as reaction,
        CASE WHEN al.coverPath IS NOT NULL THEN 1 ELSE 0 END as albumHasImage
      FROM tracks t
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      LEFT JOIN artists ar ON t.artistId = ar.id
      LEFT JOIN albums al ON t.albumId = al.id
      WHERE t.id = ?
    `
    )
    .get(userId, id) as
    | (Track & {
        reaction: "like" | "dislike" | null;
        albumHasImage: boolean | null;
      })
    | undefined;
}

export async function deleteTrack(id: number): Promise<boolean> {
  return dbDeleteTrack(db, id);
}

export async function searchTracks(
  query: string,
  userId: number | null = null
): Promise<(Track & { reaction: "like" | "dislike" | null })[]> {
  return dbSearchTracksWithReactions(db, query, userId);
}

// Album-related functions
export async function getAlbumById(
  id: number
): Promise<(Album & { artist: string | null }) | undefined> {
  return dbGetAlbumById(db, id);
}

export async function getAllAlbums(
  userId: number | null,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  items: (Album & {
    artist: string | null;
    type: "single" | "ep" | "album";
    tracks: (Track & { reaction: "like" | "dislike" | null })[];
  })[];
  total: number;
  currentPage: number;
  totalPages: number;
}> {
  const offset = (page - 1) * pageSize;
  const { items: albums, total } = await dbGetAllAlbums(db, pageSize, offset);

  const albumsWithTracks = albums.map((album) => {
    const tracks = dbGetTracksByAlbumIdWithReactions(db, album.id!, userId);
    return {
      ...album,
      tracks,
    };
  });

  return {
    items: albumsWithTracks,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAlbumWithTracks(
  id: number,
  userId: number | null = null
): Promise<
  | {
      album: Album & { artist: string | null };
      tracks: (Track & { reaction: "like" | "dislike" | null })[];
    }
  | undefined
> {
  return dbGetAlbumWithTracks(db, id, userId);
}

export async function getTracksByAlbumId(albumId: number): Promise<Track[]> {
  return dbGetTracksByAlbumId(db, albumId);
}

// Reaction-related functions
export async function setReaction(
  userId: number,
  trackId: number,
  type: "like" | "dislike" | null
): Promise<{ reaction: "like" | "dislike" | null }> {
  return dbSetReaction(db, userId, trackId, type);
}

export async function getReaction(
  userId: number,
  trackId: number
): Promise<{ reaction: "like" | "dislike" | null }> {
  return dbGetReaction(db, userId, trackId);
}

export async function getReactedTracks(
  userId: number,
  type: "like" | "dislike",
  page: number = 1,
  pageSize: number = 100
): Promise<{
  tracks: Track[];
  total: number;
  currentPage: number;
  totalPages: number;
}> {
  const offset = (page - 1) * pageSize;
  const { tracks, total } = dbGetReactedTracks(
    db,
    userId,
    type,
    pageSize,
    offset
  );
  const totalPages = Math.ceil(total / pageSize);

  return {
    tracks,
    total,
    currentPage: page,
    totalPages,
  };
}

// Playlist-related functions
export async function createPlaylist(
  userId: number,
  name: string,
  description: string | null = null
): Promise<number> {
  return dbCreatePlaylist(db, userId, name, description);
}

export async function addTrackToPlaylist(
  userId: number,
  playlistId: number,
  trackId: number
): Promise<void> {
  // Verify ownership
  if (!dbIsPlaylistOwner(db, playlistId, userId)) {
    throw new Error("Not authorized to modify this playlist");
  }

  // Get current max position
  const playlist = await getPlaylistById(playlistId, userId);
  const position = playlist ? playlist.tracks.length : 0;

  dbAddTrackToPlaylist(db, playlistId, trackId, position);
}

export async function removeTrackFromPlaylist(
  userId: number,
  playlistId: number,
  trackId: number
): Promise<boolean> {
  // Verify ownership
  if (!dbIsPlaylistOwner(db, playlistId, userId)) {
    throw new Error("Not authorized to modify this playlist");
  }

  return dbRemoveTrackFromPlaylist(db, playlistId, trackId);
}

export async function getPlaylistById(
  playlistId: number,
  userId: number | null
): Promise<
  | (Playlist & {
      tracks: (Track & {
        reaction: "like" | "dislike" | null;
        position: number;
      })[];
      ownerName: string;
    })
  | undefined
> {
  const playlist = await dbGetPlaylistById(db, playlistId, userId);
  if (!playlist) return undefined;
  const tracksWithPosition = playlist.tracks.map((track, index) => ({
    ...track,
    position: track.position ?? index,
    reaction: track.reaction ?? null,
  }));
  return {
    ...playlist,
    tracks: tracksWithPosition,
    ownerName: playlist.ownerName || "Unknown",
  };
}

export async function getUserPlaylists(
  userId: number
): Promise<(Playlist & { trackCount: number })[]> {
  return dbGetUserPlaylists(db, userId);
}

export async function deletePlaylist(
  userId: number,
  playlistId: number
): Promise<boolean> {
  return dbDeletePlaylist(db, playlistId, userId);
}

export async function updatePlaylistOrder(
  userId: number,
  playlistId: number,
  trackOrders: { trackId: number; position: number }[]
): Promise<void> {
  // Verify ownership
  if (!dbIsPlaylistOwner(db, playlistId, userId)) {
    throw new Error("Not authorized to modify this playlist");
  }

  dbUpdatePlaylistOrder(db, playlistId, trackOrders);
}

export async function advancedSearch(
  query: string,
  userId: number | null = null,
  limit: number = 5
): Promise<{
  artists: { name: string; trackCount: number }[];
  albums: (Album & { artist: string | null; trackCount: number })[];
  tracks: (Track & { reaction: "like" | "dislike" | null })[];
}> {
  return dbAdvancedSearch(db, query, userId, limit);
}

// Artist-related functions
export async function getArtistById(
  artistId: number,
  userId: number | null = null
): Promise<
  | {
      artist: {
        id: number;
        name: string;
        description: string | null;
        imagePath: string | null;
        createdAt: string;
        updatedAt: string | null;
      };
      randomTracks: (Track & { reaction: "like" | "dislike" | null })[];
      albums: (Album & {
        trackCount: number;
        type: "single" | "ep" | "album";
        hasImage: boolean;
      })[];
      singles: (Track & { reaction: "like" | "dislike" | null })[];
    }
  | undefined
> {
  const result = await dbGetArtistById(db, artistId, userId);
  if (!result) return undefined;

  // Transform the result to match the expected type
  return {
    artist: {
      id: result.artist.id,
      name: result.artist.name,
      description: result.artist.description,
      imagePath: result.artist.hasImage
        ? `/assets/artist/${result.artist.id}.jpg`
        : null,
      createdAt: new Date().toISOString(), // This is a temporary fix, should come from DB
      updatedAt: null, // This is a temporary fix, should come from DB
    },
    randomTracks: result.randomTracks,
    albums: result.albums,
    singles: result.singles,
  };
}

export async function getAllArtists(
  page: number = 1,
  pageSize: number = 20
): Promise<{
  items: {
    id: number;
    name: string;
    description: string | null;
    imagePath: string | null;
    trackCount: number;
    albumCount: number;
  }[];
  total: number;
  currentPage: number;
  totalPages: number;
}> {
  const offset = (page - 1) * pageSize;
  const { items: artists, total } = await dbGetAllArtists(db, pageSize, offset);

  // Transform the results to match the expected type
  const transformedArtists = artists.map((artist) => ({
    id: artist.id,
    name: artist.name,
    description: artist.description,
    imagePath: artist.hasImage ? `/assets/artist/${artist.id}.jpg` : null,
    trackCount: artist.trackCount,
    albumCount: artist.albumCount,
  }));

  return {
    items: transformedArtists,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createOrUpdateArtist(artist: {
  id?: number;
  name: string;
  description?: string | null;
  imagePath?: string | null;
}): Promise<number> {
  return dbCreateOrUpdateArtist(db, artist);
}

export async function getShuffledArtistTracks(
  artistId: number,
  userId: number | null = null,
  limit: number = 50
): Promise<(Track & { reaction: "like" | "dislike" | null })[]> {
  return dbGetShuffledArtistTracks(db, artistId, userId, limit);
}

// Play count functions
export async function incrementPlayCount(
  userId: number,
  trackId: number
): Promise<void> {
  dbIncrementPlayCount(db, userId, trackId);
}

export async function getPlayCount(
  userId: number,
  trackId: number
): Promise<{ count: number; lastPlayed: number } | undefined> {
  return dbGetPlayCount(db, userId, trackId);
}

export async function getTopPlayedTracks(
  userId: number,
  limit: number = 50
): Promise<(Track & { playCount: number; lastPlayed: number })[]> {
  return dbGetTopPlayedTracks(db, userId, limit);
}

export async function getHomePageContent(
  userId: number | null,
  options: {
    newReleasesLimit?: number;
    quickPicksLimit?: number;
    listenAgainLimit?: number;
  } = {}
): Promise<{
  newReleases: (Album & {
    artist: string | null;
    type: "single" | "ep" | "album";
    hasImage: boolean;
  })[];
  quickPicks: (Track & {
    reaction: "like" | "dislike" | null;
    artistName: string | null;
  })[];
  listenAgain: (Track & { lastPlayed: number; artistName: string | null })[];
  featuredPlaylists: any[]; // For future implementation
}> {
  const {
    newReleasesLimit = 10,
    quickPicksLimit = 10,
    listenAgainLimit = 10,
  } = options;

  const newReleases = dbGetNewReleases(db, newReleasesLimit);
  const quickPicks = dbGetQuickPicks(db, userId, quickPicksLimit);
  const listenAgain = userId
    ? dbGetListenAgain(db, userId, listenAgainLimit)
    : [];

  return {
    newReleases,
    quickPicks,
    listenAgain,
    featuredPlaylists: [], // Empty for now
  };
}

export function getAllTracksWithReactions(
  db: Database,
  userId: number | null
): (Track & {
  reaction: "like" | "dislike" | null;
  albumHasImage: boolean | null;
})[] {
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
          NULL as reaction,
          CASE WHEN al.coverPath IS NOT NULL THEN 1 ELSE 0 END as albumHasImage
        FROM tracks t
        LEFT JOIN artists ar ON t.artistId = ar.id
        LEFT JOIN albums al ON t.albumId = al.id
        ORDER BY t.id ASC
      `
      )
      .all() as (Track & {
      reaction: "like" | "dislike" | null;
      albumHasImage: boolean | null;
    })[];
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
        r.type as reaction,
        CASE WHEN al.coverPath IS NOT NULL THEN 1 ELSE 0 END as albumHasImage
      FROM tracks t
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      LEFT JOIN artists ar ON t.artistId = ar.id
      LEFT JOIN albums al ON t.albumId = al.id
      ORDER BY t.id ASC
    `
    )
    .all(userId) as (Track & {
    reaction: "like" | "dislike" | null;
    albumHasImage: boolean | null;
  })[];
}

export function searchTracksWithReactions(
  db: Database,
  query: string,
  userId: number | null
): (Track & {
  reaction: "like" | "dislike" | null;
  albumHasImage: boolean | null;
})[] {
  if (!userId) {
    const searchTerm = `%${query}%`;
    return db
      .prepare(
        `
        SELECT 
          t.id,
          t.title,
          t.genre,
          t.duration,
          t.albumId,
          NULL as reaction,
          ar.name as artistName,
          CASE WHEN al.coverPath IS NOT NULL THEN 1 ELSE 0 END as albumHasImage
        FROM tracks t
        LEFT JOIN artists ar ON t.artistId = ar.id
        LEFT JOIN albums al ON t.albumId = al.id
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
      ) as (Track & {
      reaction: "like" | "dislike" | null;
      albumHasImage: boolean | null;
    })[];
  }

  const searchTerm = `%${query}%`;
  return db
    .prepare(
      `
      SELECT 
        t.id,
        t.title,
        t.genre,
        t.duration,
        t.albumId,
        r.type as reaction,
        ar.name as artistName,
        CASE WHEN al.coverPath IS NOT NULL THEN 1 ELSE 0 END as albumHasImage
      FROM tracks t
      LEFT JOIN reactions r ON r.trackId = t.id AND r.userId = ?
      LEFT JOIN artists ar ON t.artistId = ar.id
      LEFT JOIN albums al ON t.albumId = al.id
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
      userId,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    ) as (Track & {
    reaction: "like" | "dislike" | null;
    albumHasImage: boolean | null;
  })[];
}
