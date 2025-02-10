import { env } from "./env.js";

export const config = {
  STORAGE_PATH: env.STORAGE_PATH,
  MEDIA_PATH: env.MEDIA_PATH,
  DB_NAME: "localify.db",
  JWT_SECRET: env.JWT_SECRET,
} as const;
