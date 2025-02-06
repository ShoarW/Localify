// src/api/middlewares/auth.ts
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { config } from "../config.js";

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.split(" ")[1]; // Bearer token
  if (!token) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  try {
    const payload = await verify(token, config.JWT_SECRET);
    c.set("user", payload);
    c.set("userId", payload.sub);
    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
});
