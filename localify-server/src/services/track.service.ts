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

export async function indexDirectory(directoryPath: string): Promise<{
  added: Track[];
  removed: Track[];
  unchanged: Track[];
}> {
  const added: Track[] = [];
  const removed: Track[] = [];
  const unchanged: Track[] = [];

  const currentFiles = await getAllMusicFiles(directoryPath);
  const existingTracks = await dbGetAllTracks(db);
  const existingTrackPaths = new Set(existingTracks.map((track) => track.path));

  for (const filePath of currentFiles) {
    if (existingTrackPaths.has(filePath)) {
      const existingTrack = existingTracks.find((t) => t.path === filePath)!;
      unchanged.push(existingTrack);
      existingTrackPaths.delete(filePath);
    } else {
      try {
        await addTrack(filePath); // Use the service function
        const addedTrack = await getTrackByPath(filePath); //use the service function
        if (addedTrack) {
          added.push(addedTrack);
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        // Consider: Throw, continue, log?
      }
    }
  }

  for (const pathToRemove of existingTrackPaths) {
    const trackToDelete = existingTracks.find((t) => t.path === pathToRemove);
    if (trackToDelete && trackToDelete.id) {
      const deleted = await deleteTrack(trackToDelete.id); // Use service function
      if (deleted) {
        removed.push(trackToDelete);
      }
    }
  }

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

    // Find or create artist
    const artistId = await findOrCreateArtist(metadata.common.artist || null);

    // Try to find or create album if we have album metadata
    let albumId: number | null = null;
    if (metadata.common.album) {
      const albumTitle = cleanAlbumTitle(metadata.common.album);
      const directoryPath = path.dirname(filePath);

      // Try to find existing album
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

        // Create new album
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
      return; // Or update, depending on your needs
    }
    dbAddTrack(db, track);
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
): Promise<(Track & { reaction: "like" | "dislike" | null }) | undefined> {
  return dbGetTrackByIdWithReaction(db, id, userId);
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

export async function getAllAlbums(userId: number | null = null): Promise<
  (Album & {
    artist: string | null;
    tracks: (Track & { reaction: "like" | "dislike" | null })[];
  })[]
> {
  return dbGetAllAlbumsWithTracks(db, userId);
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
      albums: (Album & { trackCount: number })[];
      singles: (Track & { reaction: "like" | "dislike" | null })[];
    }
  | undefined
> {
  return dbGetArtistById(db, artistId, userId);
}

export async function getAllArtists(): Promise<
  {
    id: number;
    name: string;
    description: string | null;
    imagePath: string | null;
    trackCount: number;
    albumCount: number;
  }[]
> {
  return dbGetAllArtists(db);
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
