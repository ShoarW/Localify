import type { Context } from "hono";
import {
  deleteTrack,
  getAllTracks,
  getTrackById,
  indexDirectory,
  searchTracks,
  getAllAlbums,
  getAlbumWithTracks,
  getAlbumById,
  setReaction,
  getReactedTracks,
  getReaction,
} from "../services/track.service.js";
import { config } from "../config.js";
import fs from "fs";
import mime from "mime-types";

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

  const filePath = track.path;

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

  try {
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      const stream = new ReadableStream({
        start(controller) {
          file.on("data", (chunk) => {
            try {
              controller.enqueue(chunk);
            } catch (error) {
              console.error("Error enqueueing chunk:", error);
              controller.error(error);
              file.destroy();
            }
          });

          file.on("end", () => {
            try {
              controller.close();
            } catch (error) {
              console.error("Error closing controller:", error);
            }
          });

          file.on("error", (err) => {
            console.error("File stream error:", err);
            controller.error(err);
            file.destroy();
          });
        },
        cancel() {
          file.destroy();
        },
      });

      c.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      c.header("Accept-Ranges", "bytes");
      c.header("Content-Length", chunksize.toString());
      c.header("Content-Type", track.mimeType);
      return c.body(stream, 206);
    } else {
      const file = fs.createReadStream(filePath);
      const stream = new ReadableStream({
        start(controller) {
          file.on("data", (chunk) => {
            try {
              controller.enqueue(chunk);
            } catch (error) {
              console.error("Error enqueueing chunk:", error);
              controller.error(error);
              file.destroy();
            }
          });

          file.on("end", () => {
            try {
              controller.close();
            } catch (error) {
              console.error("Error closing controller:", error);
            }
          });

          file.on("error", (err) => {
            console.error("File stream error:", err);
            controller.error(err);
            file.destroy();
          });
        },
        cancel() {
          file.destroy();
        },
      });

      c.header("Content-Length", fileSize.toString());
      c.header("Content-Type", track.mimeType);
      return c.body(stream);
    }
  } catch (error) {
    console.error("Streaming error:", error);
    return c.json({ error: "Error streaming file" }, 500);
  }
}

export async function getAllAlbumsHandler(c: Context) {
  return c.json(await getAllAlbums());
}

export async function getAlbumWithTracksHandler(c: Context) {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid album ID." }, 400);
  }

  const albumWithTracks = await getAlbumWithTracks(id);
  if (!albumWithTracks) {
    return c.json({ error: "Album not found" }, 404);
  }

  // If album has a cover image, prepare it for streaming
  if (albumWithTracks.album.coverPath) {
    try {
      await fs.promises.access(
        albumWithTracks.album.coverPath,
        fs.constants.R_OK
      );
    } catch (err) {
      console.error(
        "Album cover not found or not readable:",
        albumWithTracks.album.coverPath
      );
      albumWithTracks.album.coverPath = null;
    }
  }

  return c.json(albumWithTracks);
}

export async function streamAlbumCoverHandler(c: Context) {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid album ID." }, 400);
  }

  const album = await getAlbumById(id);
  if (!album) {
    return c.json({ error: "Album not found" }, 404);
  }

  if (!album.coverPath) {
    return c.json({ error: "Album has no cover art" }, 404);
  }

  // Check if the file exists and is readable
  try {
    await fs.promises.access(album.coverPath, fs.constants.R_OK);
  } catch (err) {
    console.error("Cover art not found or not readable:", album.coverPath);
    return c.json({ error: "Cover art not found or not readable" }, 404);
  }

  try {
    const stat = await fs.promises.stat(album.coverPath);
    const fileSize = stat.size;
    const mimeType = mime.lookup(album.coverPath) || "application/octet-stream";

    const file = fs.createReadStream(album.coverPath);
    const stream = new ReadableStream({
      start(controller) {
        file.on("data", (chunk) => {
          try {
            controller.enqueue(chunk);
          } catch (error) {
            console.error("Error enqueueing chunk:", error);
            controller.error(error);
            file.destroy();
          }
        });

        file.on("end", () => {
          try {
            controller.close();
          } catch (error) {
            console.error("Error closing controller:", error);
          }
        });

        file.on("error", (err) => {
          console.error("File stream error:", err);
          controller.error(err);
          file.destroy();
        });
      },
      cancel() {
        file.destroy();
      },
    });

    // Set cache headers since cover art rarely changes
    c.header("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    c.header("Content-Length", fileSize.toString());
    c.header("Content-Type", mimeType);
    return c.body(stream);
  } catch (error) {
    console.error("Error streaming cover art:", error);
    return c.json({ error: "Error streaming cover art" }, 500);
  }
}

export async function setReactionHandler(c: Context) {
  const trackId = parseInt(c.req.param("id"));
  if (isNaN(trackId)) {
    return c.json({ error: "Invalid track ID." }, 400);
  }

  const userId = c.get("userId");
  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const { type } = await c.req.json<{ type: "like" | "dislike" | null }>();
  if (type !== null && type !== "like" && type !== "dislike") {
    return c.json(
      { error: "Invalid reaction type. Must be 'like', 'dislike', or null" },
      400
    );
  }

  try {
    const result = await setReaction(userId, trackId, type);
    return c.json(result);
  } catch (error) {
    console.error("Error setting reaction:", error);
    return c.json({ error: "Failed to set reaction" }, 500);
  }
}

export async function getReactionHandler(c: Context) {
  const trackId = parseInt(c.req.param("id"));
  if (isNaN(trackId)) {
    return c.json({ error: "Invalid track ID." }, 400);
  }

  const userId = c.get("userId");
  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  try {
    const reaction = await getReaction(userId, trackId);
    return c.json(reaction);
  } catch (error) {
    console.error("Error getting reaction:", error);
    return c.json({ error: "Failed to get reaction" }, 500);
  }
}

export async function getReactedTracksHandler(c: Context) {
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const type = c.req.query("type") as "like" | "dislike";
  if (type !== "like" && type !== "dislike") {
    return c.json(
      { error: "Invalid reaction type. Must be 'like' or 'dislike'" },
      400
    );
  }

  const page = parseInt(c.req.query("page") || "1");
  const pageSize = parseInt(c.req.query("pageSize") || "100");

  if (isNaN(page) || page < 1) {
    return c.json({ error: "Invalid page number" }, 400);
  }

  if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    return c.json(
      { error: "Invalid page size (must be between 1 and 100)" },
      400
    );
  }

  try {
    const tracks = await getReactedTracks(userId, type, page, pageSize);
    return c.json(tracks);
  } catch (error) {
    console.error("Error getting reacted tracks:", error);
    return c.json({ error: "Failed to get reacted tracks" }, 500);
  }
}
