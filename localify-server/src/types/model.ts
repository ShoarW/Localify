export type ReactionType = "like" | "dislike" | null;

export interface Track {
  id: number;
  title: string;
  artistId: number;
  artistName: string;
  duration: number;
  reaction: ReactionType;
  albumName: string;
  albumId: number;
  hasImage: boolean;
  year: number;
  genre: string;
}

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: number;
  updatedAt: number | null;
}

export interface SignupUser {
  username: string;
  password: string;
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
  artistString: string | null;
  year: number | null;
  coverPath: string | null;
  createdAt: number;
  updatedAt: number | null;
  artists?: {
    id: number;
    name: string;
    role: "primary" | "featured";
    position: number;
  }[];
}

export interface Artist {
  id?: number;
  name: string;
  description: string | null;
  imagePath: string | null;
  createdAt: number;
  updatedAt: number | null;
}
