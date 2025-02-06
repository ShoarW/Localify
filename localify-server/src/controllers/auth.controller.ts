// src/api/controllers/auth.controller.ts
import type { Context } from "hono";
import { authenticateUser, signupUser } from "../services/user.service.js";
import type { SignupUser } from "../types/model.js";

export async function loginHandler(c: Context) {
  const { username, password } = (await c.req.json()) as {
    username: string;
    password: string;
  };
  if (!username || !password) {
    return c.json({ error: "Missing required fields." }, 400);
  }

  const authResult = await authenticateUser(username, password, c);
  if (!authResult) {
    return c.json({ error: "Invalid credentials." }, 401);
  }

  return c.json(authResult);
}

export async function signupHandler(c: Context) {
  const { username, password, email } = (await c.req.json()) as SignupUser;

  if (!username || !password || !email) {
    return c.json({ error: "Missing required fields." }, 400);
  }
  if (typeof username !== "string" || username.length < 3) {
    return c.json({ error: "Username must be at least 3 characters." }, 400);
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return c.json({ error: "Invalid email address." }, 400);
  }
  try {
    const userId = await signupUser({
      username,
      password,
      email,
    });

    return c.json({ id: userId, message: "User created successfully." }, 201);
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return c.json({ error: "Username or email already exists." }, 409);
    }
    console.error("Create user error:", error);
    return c.json({ error: "Failed to create user." }, 500);
  }
}
