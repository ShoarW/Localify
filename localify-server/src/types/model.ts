export interface Track {
  id?: number;
  path: string;
  filename: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  genre: string | null;
  year: number | null;
  duration: number | null;
  mimeType: string;
  createdAt: number;
  updatedAt: number | null;
}

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  email: string;
  role: "admin" | "user";
  createdAt: number;
  updatedAt: number | null;
}

export interface SignupUser {
  username: string;
  email: string;
  password: string;
}

interface Permission {
  id?: number;
  role: "admin" | "user"; // Could also be more granular (e.g., 'edit_tracks')
  action: string; // e.g., 'index', 'delete_track', 'create_user'
  createdAt: number;
  updatedAt: number | null;
}

export interface Playlist {
  id?: number;
  userId: number; // Foreign key referencing the User table
  name: string;
  description?: string | null;
  createdAt: Date;
}

export interface PlaylistTrack {
  playlistId: number; // Foreign key referencing the Playlist table
  trackId: number; // Foreign key referencing the Track table
  position: number; // Order of the track within the playlist
  timestamp: Date;
}

export interface Like {
  userId: number;
  trackId: number;
  timestamp: Date;
}
