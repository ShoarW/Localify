import dotenv from "dotenv";
import { join } from "path";

// Load environment variables as early as possible
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const isDevelopment = process.env.NODE_ENV !== "production";

export const env = {
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  STORAGE_PATH: isDevelopment ? "./storage" : "/storage",
  MEDIA_PATH: isDevelopment ? "./media" : "/media",
} as const;
