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
  createPlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getPlaylistById,
  getUserPlaylists,
  deletePlaylist,
  updatePlaylistOrder,
  advancedSearch,
  getArtistById,
  getAllArtists,
  createOrUpdateArtist,
} from "../services/track.service.js";
import { config } from "../config.js";
import fs from "fs";
import mime from "mime-types";
import path from "path";
import sharp from "sharp";

export async function getAllTracksHandler(c: Context) {
  const userId = c.get("userId") || null;
  return c.json(await getAllTracks(userId));
}

export async function getTrackByIdHandler(c: Context) {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid track ID." }, 400);
  }

  const userId = c.get("userId") || null;
  const track = await getTrackById(id, userId);
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

  const userId = c.get("userId") || null;
  const tracks = await searchTracks(query, userId);
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
  const userId = c.get("userId") || null;
  return c.json(await getAllAlbums(userId));
}

export async function getAlbumWithTracksHandler(c: Context) {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid album ID." }, 400);
  }

  // Get userId from context and log it
  const userId = c.get("userId") || null;

  const albumWithTracks = await getAlbumWithTracks(id, userId);
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

// Playlist-related handlers
export async function createPlaylistHandler(c: Context) {
  const userId = c.get("userId");
  const { name, description } = await c.req.json();

  if (!name || typeof name !== "string") {
    return c.json({ error: "Invalid playlist name" }, 400);
  }

  try {
    const playlistId = await createPlaylist(userId, name, description || null);
    return c.json({ id: playlistId }, 201);
  } catch (error) {
    console.error("Error creating playlist:", error);
    return c.json({ error: "Failed to create playlist" }, 500);
  }
}

export async function addTrackToPlaylistHandler(c: Context) {
  const userId = c.get("userId");
  const playlistId = parseInt(c.req.param("playlistId"));
  const { trackId } = await c.req.json();

  if (!trackId || typeof trackId !== "number") {
    return c.json({ error: "Invalid track ID" }, 400);
  }

  try {
    await addTrackToPlaylist(userId, playlistId, trackId);
    return c.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Not authorized to modify this playlist"
    ) {
      return c.json({ error: error.message }, 403);
    }
    console.error("Error adding track to playlist:", error);
    return c.json({ error: "Failed to add track to playlist" }, 500);
  }
}

export async function removeTrackFromPlaylistHandler(c: Context) {
  const userId = c.get("userId");
  const playlistId = parseInt(c.req.param("playlistId"));
  const trackId = parseInt(c.req.param("trackId"));

  try {
    const success = await removeTrackFromPlaylist(userId, playlistId, trackId);
    if (!success) {
      return c.json({ error: "Track not found in playlist" }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Not authorized to modify this playlist"
    ) {
      return c.json({ error: error.message }, 403);
    }
    console.error("Error removing track from playlist:", error);
    return c.json({ error: "Failed to remove track from playlist" }, 500);
  }
}

export async function getPlaylistByIdHandler(c: Context) {
  const playlistId = parseInt(c.req.param("playlistId"));
  const userId = c.get("userId") as number | null;

  try {
    const playlist = await getPlaylistById(playlistId, userId);
    if (!playlist) {
      return c.json({ error: "Playlist not found" }, 404);
    }
    return c.json(playlist);
  } catch (error) {
    console.error("Error getting playlist:", error);
    return c.json({ error: "Failed to get playlist" }, 500);
  }
}

export async function getUserPlaylistsHandler(c: Context) {
  const userId = c.get("userId");

  try {
    const playlists = await getUserPlaylists(userId);
    return c.json(playlists);
  } catch (error) {
    console.error("Error getting user playlists:", error);
    return c.json({ error: "Failed to get playlists" }, 500);
  }
}

export async function deletePlaylistHandler(c: Context) {
  const userId = c.get("userId");
  const playlistId = parseInt(c.req.param("playlistId"));

  try {
    const success = await deletePlaylist(userId, playlistId);
    if (!success) {
      return c.json({ error: "Playlist not found or not authorized" }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return c.json({ error: "Failed to delete playlist" }, 500);
  }
}

export async function updatePlaylistOrderHandler(c: Context) {
  const userId = c.get("userId");
  const playlistId = parseInt(c.req.param("playlistId"));
  const { trackOrders } = await c.req.json();

  if (
    !Array.isArray(trackOrders) ||
    !trackOrders.every(
      (order) =>
        typeof order === "object" &&
        typeof order.trackId === "number" &&
        typeof order.position === "number"
    )
  ) {
    return c.json({ error: "Invalid track orders format" }, 400);
  }

  try {
    await updatePlaylistOrder(userId, playlistId, trackOrders);
    return c.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Not authorized to modify this playlist"
    ) {
      return c.json({ error: error.message }, 403);
    }
    console.error("Error updating playlist order:", error);
    return c.json({ error: "Failed to update playlist order" }, 500);
  }
}

export async function advancedSearchHandler(c: Context) {
  const query = c.req.query("q");
  if (!query) {
    return c.json({ error: 'Missing search query parameter "q".' }, 400);
  }

  const limit = parseInt(c.req.query("limit") || "5");
  if (isNaN(limit) || limit < 1 || limit > 20) {
    return c.json({ error: "Invalid limit (must be between 1 and 20)" }, 400);
  }

  const userId = c.get("userId") || null;

  try {
    const results = await advancedSearch(query, userId, limit);
    return c.json(results);
  } catch (error) {
    console.error("Error performing advanced search:", error);
    return c.json({ error: "Failed to perform search" }, 500);
  }
}

// Artist-related handlers
export async function getArtistByIdHandler(c: Context) {
  const artistId = parseInt(c.req.param("artistId"));
  if (isNaN(artistId)) {
    return c.json({ error: "Invalid artist ID." }, 400);
  }

  const userId = c.get("userId") as number | null;

  try {
    const artist = await getArtistById(artistId, userId);
    if (!artist) {
      return c.json({ error: "Artist not found" }, 404);
    }
    return c.json(artist);
  } catch (error) {
    console.error("Error getting artist:", error);
    return c.json({ error: "Failed to get artist" }, 500);
  }
}

export async function getAllArtistsHandler(c: Context) {
  try {
    const artists = await getAllArtists();
    return c.json(artists);
  } catch (error) {
    console.error("Error getting artists:", error);
    return c.json({ error: "Failed to get artists" }, 500);
  }
}

export async function createOrUpdateArtistHandler(c: Context) {
  try {
    const formData = await c.req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const imageFile = formData.get("image") as File | null;
    const urlArtistId = c.req.param("artistId");

    if (!name) {
      return c.json({ error: "Invalid artist name" }, 400);
    }

    let artist: any = {
      name,
      description: description || null,
    };

    // Handle artist ID for updates
    if (urlArtistId) {
      const id = parseInt(urlArtistId);
      if (isNaN(id)) {
        return c.json({ error: "Invalid artist ID" }, 400);
      }
      artist.id = id;
    }

    // Handle image upload if provided
    if (imageFile) {
      const fileExtension =
        imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      if (!["jpg", "jpeg", "png"].includes(fileExtension)) {
        return c.json(
          {
            error: "Invalid image format. Only jpg, jpeg, and png are allowed.",
          },
          400
        );
      }

      // Create the image path
      const imagePath = path.join(
        config.STORAGE_PATH,
        "assets",
        "artist",
        `${artist.id || "temp"}.${fileExtension}`
      );

      // Convert File to Buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Process image with sharp
      await sharp(buffer)
        .resize(600, 600, {
          fit: "inside", // Maintain aspect ratio
          withoutEnlargement: true, // Don't upscale if image is smaller
        })
        .jpeg({ quality: 85 }) // Convert to JPEG with good quality
        .toFile(imagePath);

      // Update the artist object with the image path
      artist.imagePath = imagePath;
    }

    const artistId = await createOrUpdateArtist(artist);

    // If this was a new artist and we saved a temporary image, rename it
    if (!artist.id && imageFile) {
      const oldPath = path.join(
        config.STORAGE_PATH,
        "assets",
        "artist",
        "temp.jpg" // We're always saving as jpg now
      );
      const newPath = path.join(
        config.STORAGE_PATH,
        "assets",
        "artist",
        `${artistId}.jpg`
      );
      await fs.promises.rename(oldPath, newPath);

      // Update the image path in the database
      await createOrUpdateArtist({
        id: artistId,
        name: artist.name,
        description: artist.description,
        imagePath: newPath,
      });
    }

    return c.json({ id: artistId }, artist.id ? 200 : 201);
  } catch (error) {
    console.error("Error creating/updating artist:", error);
    if (
      error instanceof Error &&
      error.message === "An artist with this name already exists"
    ) {
      return c.json({ error: error.message }, 409); // 409 Conflict
    }
    return c.json({ error: "Failed to create/update artist" }, 500);
  }
}

export async function streamArtistImageHandler(c: Context) {
  const artistId = parseInt(c.req.param("artistId"));
  if (isNaN(artistId)) {
    return c.json({ error: "Invalid artist ID." }, 400);
  }

  const artist = await getArtistById(artistId, null);
  if (!artist) {
    return c.json({ error: "Artist not found" }, 404);
  }

  if (!artist.artist.imagePath) {
    return c.json({ error: "Artist has no image" }, 404);
  }

  // Check if the file exists and is readable
  try {
    await fs.promises.access(artist.artist.imagePath, fs.constants.R_OK);
  } catch (err) {
    console.error(
      "Artist image not found or not readable:",
      artist.artist.imagePath
    );
    return c.json({ error: "Artist image not found or not readable" }, 404);
  }

  try {
    const stat = await fs.promises.stat(artist.artist.imagePath);
    const fileSize = stat.size;
    const mimeType =
      mime.lookup(artist.artist.imagePath) || "application/octet-stream";

    const file = fs.createReadStream(artist.artist.imagePath);
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

    // Set cache headers since artist images rarely change
    c.header("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    c.header("Content-Length", fileSize.toString());
    c.header("Content-Type", mimeType);
    return c.body(stream);
  } catch (error) {
    console.error("Error streaming artist image:", error);
    return c.json({ error: "Error streaming artist image" }, 500);
  }
}
