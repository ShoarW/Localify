import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { Context, Next } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFileSync } from "fs";
import { join } from "path";

import { initializeDatabase } from "./db/db.js";
import dotenv from "dotenv";
import {
  loginHandler,
  signupHandler,
  refreshTokenHandler,
} from "./controllers/auth.controller.js";
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
  streamArtistBackgroundImageHandler,
  getShuffledArtistTracksHandler,
  getPlayCountHandler,
  getTopPlayedTracksHandler,
  getHomePageHandler,
} from "./controllers/track.controller.js";
import { authMiddleware } from "./middleware/auth.js";
import { permissionMiddleware } from "./middleware/permission.js";
import { cors } from "hono/cors";

dotenv.config();

const app = new Hono();
const api = new Hono();

app.use("*", cors());

// Optional auth middleware - will set userId if token is valid, but won't reject if no token
async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    // No auth header, continue without auth
    return await next();
  }

  try {
    await authMiddleware(c, next);
  } catch (e) {
    console.error("Error verifying token:", e);
    // Auth failed, but continue without auth
    return await next();
  }
}

// -- Auth -- //
api.post("/auth/login", loginHandler);
api.post("/auth/signup", signupHandler);
api.post("/auth/refresh", refreshTokenHandler);

// -- Homepage -- //
api.get("/home", optionalAuthMiddleware, getHomePageHandler);

// -- Tracks -- //
api.get("/tracks", optionalAuthMiddleware, getAllTracksHandler);
api.get("/tracks/:id", optionalAuthMiddleware, getTrackByIdHandler);
api.get("/tracks/:id/stream", optionalAuthMiddleware, streamTrackHandler);
api.get("/tracks/:id/play-count", authMiddleware, getPlayCountHandler);
api.get("/tracks/top-played", authMiddleware, getTopPlayedTracksHandler);
api.delete(
  "/tracks/:id",
  authMiddleware,
  permissionMiddleware("delete_track"),
  deleteTrackHandler
);
api.get("/search", searchTracksHandler);
api.get("/search/advanced", optionalAuthMiddleware, advancedSearchHandler);

// -- Reactions -- //
api.post("/tracks/:id/reaction", authMiddleware, setReactionHandler);
api.get("/tracks/:id/reaction", authMiddleware, getReactionHandler);
api.get("/reactions", authMiddleware, getReactedTracksHandler);

// -- Albums -- //
api.get("/albums", optionalAuthMiddleware, getAllAlbumsHandler);
api.get("/albums/:id", optionalAuthMiddleware, getAlbumWithTracksHandler);
api.get("/albums/:id/cover", streamAlbumCoverHandler);

// -- Indexing -- //
api.post(
  "/index",
  authMiddleware,
  permissionMiddleware("index"),
  indexDirectoryHandler
);

// Artist routes
api.get("/artists", getAllArtistsHandler);
api.get("/artists/:artistId", optionalAuthMiddleware, getArtistByIdHandler);
api.get("/artists/:artistId/image", streamArtistImageHandler);
api.get("/artists/:artistId/background", streamArtistBackgroundImageHandler);
api.get("/artists/:artistId/shuffle", getShuffledArtistTracksHandler);
api.post(
  "/artists",
  authMiddleware,
  permissionMiddleware("modify_artists"),
  createOrUpdateArtistHandler
);
api.put(
  "/artists/:artistId",
  authMiddleware,
  permissionMiddleware("modify_artists"),
  createOrUpdateArtistHandler
);

// Playlist routes
api.get("/playlists", authMiddleware, getUserPlaylistsHandler);
api.post("/playlists", authMiddleware, createPlaylistHandler);
api.get(
  "/playlists/:playlistId",
  optionalAuthMiddleware,
  getPlaylistByIdHandler
);
api.delete("/playlists/:playlistId", authMiddleware, deletePlaylistHandler);
api.post(
  "/playlists/:playlistId/tracks",
  authMiddleware,
  addTrackToPlaylistHandler
);
api.delete(
  "/playlists/:playlistId/tracks/:trackId",
  authMiddleware,
  removeTrackFromPlaylistHandler
);
api.put(
  "/playlists/:playlistId/order",
  authMiddleware,
  updatePlaylistOrderHandler
);

// Mount API routes under /api
app.route("/api", api);

// Serve static files
app.use("/*", async (c, next) => {
  const path = c.req.path;

  // If it's an API request, skip static serving
  if (path.startsWith("/api")) {
    return next();
  }

  // Check if the path has a file extension
  if (path.includes(".")) {
    return serveStatic({ root: "./static" })(c, next);
  }

  // For all other routes, serve index.html
  const indexHtml = readFileSync(
    join(process.cwd(), "static", "index.html"),
    "utf-8"
  );
  return c.newResponse(indexHtml, 200, {
    "Content-Type": "text/html",
  });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

initializeDatabase();
