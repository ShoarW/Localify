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
} from "../db/track.db.js"; // Import from track.db.ts
import type { Track } from "../types/model.js";
import mime from "mime-types";

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

export async function addTrack(filePath: string): Promise<void> {
  try {
    const metadata = await mm.parseFile(filePath);
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    const track: Omit<Track, "id"> = {
      path: filePath,
      filename: path.basename(filePath),
      title: metadata.common.title || null,
      artist: metadata.common.artist || null,
      album: metadata.common.album || null,
      year: metadata.common.year || null,
      genre: metadata.common.genre ? metadata.common.genre.join(", ") : null,
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
    throw error; // Re-throw to be handled by the caller
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
