import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { Context, Next } from "hono";

import { initializeDatabase } from "./db/db.js";
import dotenv from "dotenv";
import { loginHandler, signupHandler } from "./controllers/auth.controller.js";
import {
  getAllTracksHandler,
  getTrackByIdHandler,
  deleteTrackHandler,
  searchTracksHandler,
  indexDirectoryHandler,
  streamTrackHandler,
  getAllAlbumsHandler,
  getAlbumWithTracksHandler,
  streamAlbumCoverHandler,
  setReactionHandler,
  getReactionHandler,
  getReactedTracksHandler,
  createPlaylistHandler,
  addTrackToPlaylistHandler,
  removeTrackFromPlaylistHandler,
  getPlaylistByIdHandler,
  getUserPlaylistsHandler,
  deletePlaylistHandler,
  updatePlaylistOrderHandler,
  advancedSearchHandler,
  getAllArtistsHandler,
  getArtistByIdHandler,
  createOrUpdateArtistHandler,
  streamArtistImageHandler,
  getShuffledArtistTracksHandler,
} from "./controllers/track.controller.js";
import { authMiddleware } from "./middleware/auth.js";
import { permissionMiddleware } from "./middleware/permission.js";
import { cors } from "hono/cors";

dotenv.config();

// Use env variables

const app = new Hono();

app.use("*", cors());

// Optional auth middleware - will set userId if token is valid, but won't reject if no token
async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    await authMiddleware(c, next);
  } catch (e) {
    // Continue without auth
    await next();
  }
}

// -- Auth -- //
app.post("/auth/login", loginHandler);
app.post("/auth/signup", signupHandler);

// -- Tracks -- //
app.get("/tracks", getAllTracksHandler);
app.get("/tracks/:id", getTrackByIdHandler);
app.delete(
  "/tracks/:id",
  authMiddleware,
  permissionMiddleware("delete_track"),
  deleteTrackHandler
);
app.get("/tracks/:id/stream", streamTrackHandler);
app.get("/search", searchTracksHandler);
app.get("/search/advanced", optionalAuthMiddleware, advancedSearchHandler);

// -- Reactions -- //
app.post("/tracks/:id/reaction", authMiddleware, setReactionHandler);
app.get("/tracks/:id/reaction", authMiddleware, getReactionHandler);
app.get("/reactions", authMiddleware, getReactedTracksHandler);

// -- Albums -- //
app.get("/albums", optionalAuthMiddleware, getAllAlbumsHandler);
app.get("/albums/:id", optionalAuthMiddleware, getAlbumWithTracksHandler);
app.get("/albums/:id/cover", streamAlbumCoverHandler);

// -- Indexing -- //
app.post(
  "/index",
  authMiddleware,
  permissionMiddleware("index"),
  indexDirectoryHandler
);

// Artist routes
app.get("/artists", getAllArtistsHandler);
app.get("/artists/:artistId", optionalAuthMiddleware, getArtistByIdHandler);
app.get("/artists/:artistId/image", streamArtistImageHandler);
app.get(
  "/artists/:artistId/shuffle",
  optionalAuthMiddleware,
  getShuffledArtistTracksHandler
);
app.post(
  "/artists",
  authMiddleware,
  permissionMiddleware("modify_artists"),
  createOrUpdateArtistHandler
);
app.put(
  "/artists/:artistId",
  authMiddleware,
  permissionMiddleware("modify_artists"),
  createOrUpdateArtistHandler
);

// Playlist routes
app.get("/playlists", authMiddleware, getUserPlaylistsHandler);
app.post("/playlists", authMiddleware, createPlaylistHandler);
app.get(
  "/playlists/:playlistId",
  optionalAuthMiddleware,
  getPlaylistByIdHandler
);
app.delete("/playlists/:playlistId", authMiddleware, deletePlaylistHandler);
app.post(
  "/playlists/:playlistId/tracks",
  authMiddleware,
  addTrackToPlaylistHandler
);
app.delete(
  "/playlists/:playlistId/tracks/:trackId",
  authMiddleware,
  removeTrackFromPlaylistHandler
);
app.put(
  "/playlists/:playlistId/order",
  authMiddleware,
  updatePlaylistOrderHandler
);

app.get("/", (c) => {
  return c.text("Hello from Localify!");
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

initializeDatabase();
