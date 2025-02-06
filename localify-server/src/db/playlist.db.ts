// import type { Database } from "better-sqlite3";
// import type { Playlist } from "../types/model.js";

// export function createPlaylistsTable(db: Database) {
//   db.prepare(
//     `
//             CREATE TABLE IF NOT EXISTS playlists (
//                 id INTEGER PRIMARY KEY AUTOINCREMENT,
//                 userId INTEGER NOT NULL,
//                 name TEXT NOT NULL,
//                 description TEXT,
//                 FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
//             );
//         `
//   ).run();
// }

// export function createPlaylist(
//   db: Database,
//   playlist: Omit<Playlist, "id">
// ): number {
//   const insertQuery = db.prepare(`
//           INSERT INTO playlists (userId, name, description)
//           VALUES (?, ?, ?)
//       `);
//   const result = insertQuery.run(
//     playlist.userId,
//     playlist.name,
//     playlist.description
//   );
//   return result.lastInsertRowid as number;
// }
// export function getPlaylistById(
//   db: Database,
//   playlistId: number
// ): Playlist | undefined {
//   const query = db.prepare("SELECT * FROM playlists WHERE id = ?");
//   return query.get(playlistId) as Playlist | undefined;
// }

// export function getPlaylistsByUser(db: Database, userId: number): Playlist[] {
//   const query = db.prepare("SELECT * FROM playlists WHERE userId = ?");
//   return query.all(userId) as Playlist[];
// }

// export function updatePlaylist(
//   db: Database,
//   playlistId: number,
//   updatedData: Partial<Omit<Playlist, "id" | "userId">>
// ): boolean {
//   // Build the SET part of the SQL query dynamically
//   const setClauses = Object.keys(updatedData)
//     .map((key) => `${key} = ?`)
//     .join(", ");

//   const values = Object.values(updatedData);
//   values.push(playlistId); // Add playlistId for the WHERE clause

//   const updateQuery = db.prepare(`
//           UPDATE playlists
//           SET ${setClauses}
//           WHERE id = ?
//       `);

//   const result = updateQuery.run(...values);
//   return result.changes > 0;
// }

// export function deletePlaylist(db: Database, playlistId: number): boolean {
//   const deleteQuery = db.prepare("DELETE FROM playlists WHERE id = ?");
//   const result = deleteQuery.run(playlistId);
//   return result.changes > 0;
// }
