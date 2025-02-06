import type { Context } from "hono";
import {
  deleteTrack,
  getAllTracks,
  getTrackById,
  indexDirectory,
  searchTracks,
} from "../services/track.service.js";
import { config } from "../config.js";
import fs from "fs";

export async function getAllTracksHandler(c: Context) {
  return c.json(await getAllTracks());
}

export async function getTrackByIdHandler(c: Context) {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid track ID." }, 400);
  }
  const track = await getTrackById(id);
  if (!track) {
    return c.json({ error: "Track not found" }, 404);
  }
  return c.json(track);
}

export async function deleteTrackHandler(c: Context) {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid track ID." }, 400);
  }
  const success = await deleteTrack(id);
  if (!success) {
    return c.json({ error: "Track not found or could not be deleted." }, 404);
  }
  return c.json({ message: "Track deleted successfully" });
}
export async function searchTracksHandler(c: Context) {
  const query = c.req.query("q");
  if (!query) {
    return c.json({ error: 'Missing search query parameter "q".' }, 400);
  }
  const tracks = await searchTracks(query);
  return c.json(tracks);
}

export async function indexDirectoryHandler(c: Context) {
  try {
    const result = await indexDirectory(config.MEDIA_PATH);
    return c.json({
      message: `Indexing complete.`,
      added: result.added,
      removed: result.removed,
      unchanged: result.unchanged,
    });
  } catch (error) {
    console.error("Indexing error:", error);
    return c.json({ error: "Failed to index tracks." }, 500);
  }
}

export async function streamTrackHandler(c: Context) {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid track ID." }, 400);
  }

  const track = await getTrackById(id);
  if (!track) {
    return c.json({ error: "Track not found" }, 404);
  }

  const filePath = track.path; // Full path to the music file

  // Check if the file exists
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch (err) {
    console.error("File not found or not readable:", filePath);
    return c.json({ error: "File not found or not readable" }, 404);
  }
  const stat = await fs.promises.stat(filePath);
  const fileSize = stat.size;
  const range = c.req.header("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    c.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    c.header("Accept-Ranges", "bytes");
    c.header("Content-Length", chunksize.toString());
    c.header("Content-Type", track.mimeType); // Or determine dynamically
    return c.body(file, 206);
  } else {
    c.header("Content-Length", fileSize.toString());
    c.header("Content-Type", track.mimeType); // Or determine dynamically

    // Create a readable stream from the file
    const fileStream = fs.createReadStream(filePath);

    // Return the stream as the response body
    return c.body(fileStream);
  }
}
