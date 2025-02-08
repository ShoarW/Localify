import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getSimilarTracksHandler } from "../controllers/track.controller.js";

const app = new Hono();

// Radio endpoint for similar tracks
app.get("/tracks/:id/similar", authMiddleware, getSimilarTracksHandler);

export { app as trackRoutes };
