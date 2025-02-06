// src/services/user.service.ts
import { db } from "../db/db.js";
import * as userDB from "../db/user.db.js";
import type { SignupUser, User } from "../types/model.js";
import { sign } from "hono/jwt";
import type { Context } from "hono";
import { config } from "../config.js";

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
  password: string,
  c: Context
): Promise<{ token: string } | null> {
  const user = await userDB.getUserByUsername(db, username);

  if (!user || user.passwordHash !== password) {
    //PLEASE HASH PASSWORDS
    return null;
  }

  const payload = {
    sub: user.id, //standard claim for user id
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, //1 hour
  };

  const token = await sign(payload, config.JWT_SECRET);

  return { token };
}

export async function signupUser(user: SignupUser): Promise<number> {
  const usersCount = (await getAllUsers()).length;
  const role = usersCount === 0 ? "admin" : "user";
  return createUser({
    ...user,
    role,
    passwordHash: user.password,
    createdAt: new Date().getTime(),
    updatedAt: null,
  });
}
