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
} from "../db/track.db.js";
import type { Track, Album } from "../types/model.js";
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

async function getAlbumArtist(
  db: Database,
  title: string,
  newTrackArtist: string | null | undefined
): Promise<string | null> {
  // If we already have an album, use its artist
  const existingAlbum = findAlbumByTitle(db, title);
  if (existingAlbum) {
    return existingAlbum.artist;
  }

  // For completely new albums, start with the track's artist
  return newTrackArtist || null;
}

export async function addTrack(filePath: string): Promise<void> {
  try {
    const metadata = await mm.parseFile(filePath);
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    // Try to find or create album if we have album metadata
    let albumId: number | null = null;
    if (metadata.common.album) {
      const albumTitle = cleanAlbumTitle(metadata.common.album);
      const directoryPath = path.dirname(filePath);

      // Try to find existing album
      const existingAlbum = findAlbumByTitle(db, albumTitle);

      if (existingAlbum) {
        albumId = existingAlbum.id!;

        // Check if we need to update the album artist to Various Artists
        const albumTracks = await getTracksByAlbumId(albumId);
        if (albumTracks.length > 0) {
          const trackArtist = metadata.common.artist;
          const hasMultipleArtists = albumTracks.some(
            (track) => track.artist !== trackArtist
          );

          if (
            hasMultipleArtists &&
            existingAlbum.artist !== "Various Artists"
          ) {
            // Update album to Various Artists
            db.prepare("UPDATE albums SET artist = ? WHERE id = ?").run(
              "Various Artists",
              albumId
            );
          }
        }

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
        // Get the appropriate artist for the new album
        const albumArtist = await getAlbumArtist(
          db,
          albumTitle,
          metadata.common.albumartist || metadata.common.artist
        );

        // Look for cover art in the album directory
        const coverPath = await findCoverArtInDirectory(directoryPath);

        // Create new album
        const album: Omit<Album, "id"> = {
          title: albumTitle,
          artist: albumArtist,
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
      artist: metadata.common.artist || null,
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

export async function getAllTracks(): Promise<Track[]> {
  return dbGetAllTracks(db);
}
export async function getTrackByPath(
  filePath: string
): Promise<Track | undefined> {
  return dbGetTrackByPath(db, filePath);
}
export async function getTrackById(id: number): Promise<Track | undefined> {
  return dbGetTrackById(db, id);
}

export async function deleteTrack(id: number): Promise<boolean> {
  return dbDeleteTrack(db, id);
}

export async function searchTracks(query: string): Promise<Track[]> {
  return dbSearchTracks(db, query);
}

// Album-related functions
export async function getAlbumById(id: number): Promise<Album | undefined> {
  return dbGetAlbumById(db, id);
}

export async function getAllAlbums(): Promise<Album[]> {
  return dbGetAllAlbums(db);
}

export async function getAlbumWithTracks(
  id: number
): Promise<{ album: Album; tracks: Track[] } | undefined> {
  const album = await getAlbumById(id);
  if (!album) return undefined;

  const tracks = await getTracksByAlbumId(id);
  return { album, tracks };
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
