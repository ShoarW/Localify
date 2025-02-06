// import BetterSqlite3 from "better-sqlite3";
// import fs from "fs";
// import path from "path";
// import type { Track } from "./types/model.js";
// import { parseFile } from "music-metadata";

// export class Localify {

//   constructor() {
//     this.initializeDatabase();
//   }

//   async indexDirectory(directoryPath: string): Promise<{
//     added: Track[];
//     removed: Track[];
//     unchanged: number;
//   }> {
//     const added: Track[] = [];
//     const removed: Track[] = [];
//     let unchanged = 0;

//     // 1. Get current music files.
//     const currentFiles = await this.getAllMusicFiles(directoryPath);

//     // 2. Get existing tracks from the database.
//     const existingTracks = await this.getAllTracks();
//     const existingTrackPaths = new Set(
//       existingTracks.map((track) => track.path)
//     );

//     // 3. Iterate through current files.
//     for (const filePath of currentFiles) {
//       if (existingTrackPaths.has(filePath)) {
//         existingTracks.find((t) => t.path === filePath)!; // We know it exists
//         unchanged++;
//         existingTrackPaths.delete(filePath); // Remove from the set.
//       } else {
//         try {
//           await this.addTrack(filePath);
//           const addedTrack = await this.getTrackByPath(filePath);
//           if (addedTrack) {
//             added.push(addedTrack);
//           }
//         } catch (error) {
//           console.error(`Error processing file ${filePath}:`, error);
//           // Consider what to do here.  Throw, continue, log to file?
//         }
//       }
//     }

//     // 4. Delete removed tracks and add to removed array.
//     for (const pathToRemove of existingTrackPaths) {
//       const trackToDelete = existingTracks.find((t) => t.path === pathToRemove);
//       if (trackToDelete && trackToDelete.id) {
//         const deleted = await this.deleteTrack(trackToDelete.id);
//         if (deleted) {
//           removed.push(trackToDelete);
//         }
//       }
//     }

//     return { added, removed, unchanged };
//   }

//   async getAllTracks(): Promise<Track[]> {
//     const query = this.db.prepare("SELECT * FROM tracks");
//     return query.all() as Track[];
//   }

//   async deleteTrack(id: number): Promise<boolean> {
//     const deleteQuery = this.db.prepare("DELETE FROM tracks WHERE id = ?");
//     const result = deleteQuery.run(id);
//     return result.changes > 0; // Return true if a row was deleted
//   }

//   // Helper function to get all music files recursively
//   private async getAllMusicFiles(directoryPath: string): Promise<string[]> {
//     let filePaths: string[] = [];
//     const files = fs.readdirSync(directoryPath, { withFileTypes: true });

//     for (const file of files) {
//       const fullPath = path.join(directoryPath, file.name);
//       if (file.isDirectory()) {
//         filePaths = filePaths.concat(await this.getAllMusicFiles(fullPath)); // Recursive call
//       } else if (this.isMusicFile(file.name)) {
//         filePaths.push(fullPath);
//       }
//     }
//     return filePaths;
//   }

//   async getTrackByPath(filePath: string): Promise<Track | undefined> {
//     const query = this.db.prepare("SELECT * FROM tracks WHERE path = ?");
//     return query.get(filePath) as Track | undefined;
//   }

//   async searchTracks(query: string): Promise<Track[]> {
//     const sqlQuery = this.db.prepare(`
//         SELECT * FROM tracks
//         WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? OR filename LIKE ?
//     `);
//     const searchTerm = `%${query}%`; // Prepare for LIKE query
//     return sqlQuery.all(
//       searchTerm,
//       searchTerm,
//       searchTerm,
//       searchTerm
//     ) as Track[];
//   }

//   async addTrack(filePath: string): Promise<void> {
//     try {
//       const metadata = await parseFile(filePath);
//       const track: Track = {
//         path: filePath,
//         filename: path.basename(filePath),
//         title: metadata.common.title || null,
//         artist: metadata.common.artist || null,
//         album: metadata.common.album || null,
//         year: metadata.common.year || null,
//         genre: metadata.common.genre ? metadata.common.genre.join(", ") : null, // Handle multiple genres
//         duration: metadata.format.duration || null,
//         timestamp: new Date(),
//       };

//       // Check for existing track with the same path.
//       const existingTrack = this.db
//         .prepare("SELECT id FROM tracks WHERE path = ?")
//         .get(track.path) as { id: number } | undefined;
//       if (existingTrack) {
//         // Update the existing track (optional, depends on requirements).
//         console.warn(`Track already exists, skipping: ${filePath}`);
//         return;
//       }

//       const insertQuery = this.db.prepare(`
//             INSERT INTO tracks (path, filename, title, artist, album, year, genre, duration)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//             `);
//       insertQuery.run(
//         track.path,
//         track.filename,
//         track.title,
//         track.artist,
//         track.album,
//         track.year,
//         track.genre,
//         track.duration
//       );
//     } catch (error) {
//       console.error(`Error adding track ${filePath}:`, error);
//       throw error; // Re-throw the error to be handled by the caller
//     }
//   }

//   private isMusicFile(filename: string): boolean {
//     const supportedExtensions = [
//       ".mp3",
//       ".flac",
//       ".wav",
//       ".ogg",
//       ".m4a",
//       ".aac",
//     ];
//     const ext = path.extname(filename).toLowerCase();
//     return supportedExtensions.includes(ext);
//   }

//   private initializeDatabase() {
//     // Tracks Table
//     this.db
//       .prepare(
//         `
//             CREATE TABLE IF NOT EXISTS tracks (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 path TEXT UNIQUE NOT NULL,
//                 filename TEXT NOT NULL,
//                 title TEXT,
//                 artist TEXT,
//                 album TEXT,
//                 year INTEGER,
//                 genre TEXT,
//                 duration REAL,
//                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
//             );
//         `
//       )
//       .run();

//     // Users Table
//     this.db
//       .prepare(
//         `
//             CREATE TABLE IF NOT EXISTS users (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 username TEXT UNIQUE NOT NULL,
//                 passwordHash TEXT NOT NULL,
//                 email TEXT UNIQUE NOT NULL,
//                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
//             );
//         `
//       )
//       .run();

//     // Playlists Table
//     this.db
//       .prepare(
//         `
//             CREATE TABLE IF NOT EXISTS playlists (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 userId INTEGER NOT NULL,
//                 name TEXT NOT NULL,
//                 description TEXT,
//                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//                 FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
//             );
//         `
//       )
//       .run();

//     // PlaylistTracks Table (Many-to-Many relationship)
//     this.db
//       .prepare(
//         `
//             CREATE TABLE IF NOT EXISTS playlistTracks (
//                 playlistId INTEGER NOT NULL,
//                 trackId INTEGER NOT NULL,
//                 position INTEGER NOT NULL,
//                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//                 PRIMARY KEY (playlistId, trackId),
//                 FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
//                 FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE
//             );
//         `
//       )
//       .run();

//     // Likes Table
//     this.db
//       .prepare(
//         `
//             CREATE TABLE IF NOT EXISTS likes (
//                 userId INTEGER NOT NULL,
//                 trackId INTEGER NOT NULL,
//                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//                 PRIMARY KEY (userId, trackId),
//                 FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
//                 FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE
//             )
//         `
//       )
//       .run();
//   }
// }
