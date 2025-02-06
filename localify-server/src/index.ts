import { serve } from "@hono/node-server";
import { Hono } from "hono";

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
} from "./controllers/track.controller.js";
import { authMiddleware } from "./middleware/auth.js";
import { permissionMiddleware } from "./middleware/permission.js";
import { cors } from "hono/cors";

dotenv.config();

// Use env variables

const app = new Hono();

app.use("*", cors());

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

// -- Indexing -- //
app.post(
  "/index",
  authMiddleware,
  permissionMiddleware("index"),
  indexDirectoryHandler
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
