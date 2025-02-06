export interface Track {
  id?: number;
  path: string;
  filename: string;
  title: string | null;
  artistId: number | null;
  albumId: number | null;
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
  userId: number;
  name: string;
  description: string | null;
  ownerName?: string;
  createdAt: number;
  tracks?: PlaylistTrack[];
}

export interface PlaylistTrack extends Track {
  position: number;
  reaction?: "like" | "dislike" | null;
}

export interface Like {
  userId: number;
  trackId: number;
  timestamp: Date;
}

export interface Album {
  id?: number;
  title: string;
  artistId: number | null;
  year: number | null;
  coverPath: string | null;
  createdAt: number;
  updatedAt: number | null;
}

export interface Artist {
  id?: number;
  name: string;
  description: string | null;
  imagePath: string | null;
  createdAt: number;
  updatedAt: number | null;
}
