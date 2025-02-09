// src/services/user.service.ts
import { db } from "../db/db.js";
import * as userDB from "../db/user.db.js";
import type { SignupUser, User } from "../types/model.js";
import { sign, verify } from "hono/jwt";
import { config } from "../config.js";
import bcrypt from "bcrypt";

export async function getAllUsers(): Promise<User[]> {
  return userDB.getAllUsers(db);
}
export async function createUser(user: Omit<User, "id">): Promise<number> {
  // Additional business logic (e.g., password complexity checks) can go here
  return userDB.createUser(db, user);
}

export async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  return userDB.getUserByUsername(db, username);
}
export async function getUserById(id: number): Promise<User | undefined> {
  return userDB.getUserById(db, id);
}
export async function deleteUser(id: number): Promise<boolean> {
  return userDB.deleteUser(db, id);
}
export async function authenticateUser(
  username: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const user = await userDB.getUserByUsername(db, username);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return null;
  }

  // Generate access token (short-lived)
  const accessPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  };

  // Generate refresh token (long-lived)
  const refreshPayload = {
    sub: user.id,
    type: "refresh",
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  };

  const accessToken = await sign(accessPayload, config.JWT_SECRET);
  const refreshToken = await sign(refreshPayload, config.JWT_SECRET);

  // Store refresh token in database
  const expiresAt = new Date(refreshPayload.exp * 1000);
  userDB.createRefreshToken(db, user.id!, refreshToken, expiresAt);

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string } | null> {
  try {
    // Verify refresh token
    const payload = await verify(refreshToken, config.JWT_SECRET);
    if (payload.type !== "refresh") {
      return null;
    }

    // Check if refresh token exists in database
    const storedToken = userDB.getRefreshToken(db, refreshToken);
    if (!storedToken) {
      return null;
    }

    // Check if token is expired
    const expiresAt = new Date(storedToken.expiresAt);
    if (expiresAt < new Date()) {
      userDB.deleteRefreshToken(db, refreshToken);
      return null;
    }

    // Get user info
    const user = await getUserById(payload.sub as number);
    if (!user) {
      return null;
    }

    // Generate new access token
    const accessPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const accessToken = await sign(accessPayload, config.JWT_SECRET);
    return { accessToken };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

export async function signupUser(user: SignupUser): Promise<number> {
  const usersCount = (await getAllUsers()).length;
  const role = usersCount === 0 ? "admin" : "user";

  // Hash the password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(user.password, saltRounds);

  return createUser({
    ...user,
    role,
    passwordHash,
    createdAt: new Date().getTime(),
    updatedAt: null,
  });
}
