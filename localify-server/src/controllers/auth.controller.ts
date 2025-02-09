// src/api/controllers/auth.controller.ts
import type { Context } from "hono";
import {
  authenticateUser,
  refreshAccessToken,
  signupUser,
} from "../services/user.service.js";
import type { SignupUser } from "../types/model.js";

export async function loginHandler(c: Context) {
  const { username, password } = (await c.req.json()) as {
    username: string;
    password: string;
  };
  if (!username || !password) {
    return c.json({ error: "Missing required fields." }, 400);
  }

  const authResult = await authenticateUser(username, password);
  if (!authResult) {
    return c.json({ error: "Invalid credentials." }, 401);
  }

  return c.json(authResult);
}

export async function refreshTokenHandler(c: Context) {
  const refreshToken = c.req.header("Authorization")?.split(" ")[1]; // Bearer token
  if (!refreshToken) {
    return c.json({ error: "No refresh token provided" }, 401);
  }

  const result = await refreshAccessToken(refreshToken);
  if (!result) {
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }

  return c.json(result);
}

export async function signupHandler(c: Context) {
  const { username, password } = (await c.req.json()) as SignupUser;

  if (!username || !password) {
    return c.json({ error: "Missing required fields." }, 400);
  }
  if (typeof username !== "string" || username.length < 3) {
    return c.json({ error: "Username must be at least 3 characters." }, 400);
  }
  try {
    const userId = await signupUser({
      username,
      password,
    });

    return c.json({ id: userId, message: "User created successfully." }, 201);
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return c.json({ error: "Username already exists." }, 409);
    }
    console.error("Create user error:", error);
    return c.json({ error: "Failed to create user." }, 500);
  }
}
