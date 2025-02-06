export interface Track {
  id: number;
  path: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  albumId: number;
  year: number;
  genre: string;
  duration: number;
  mimeType: string;
  createdAt: number;
  updatedAt: number | null;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverPath: string;
  createdAt: number;
  updatedAt: number | null;
}

export interface AlbumWithTracks {
  album: Album;
  tracks: Track[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

const API_BASE_URL = "http://localhost:3000";

export const api = {
  /**
   * Fetches all tracks from the server
   */
  getTracks: async (): Promise<Track[]> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/tracks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tracks");
    }
    return response.json();
  },

  /**
   * Gets the streaming URL for a specific track
   */
  getTrackStreamUrl: (trackId: number): string => {
    return `${API_BASE_URL}/tracks/${trackId}/stream`;
  },

  /**
   * Gets the cover art URL for a track's album
   */
  getTrackCoverUrl: (track: Track): string => {
    return `${API_BASE_URL}/albums/${track.albumId}/cover`;
  },

  /**
   * Stream audio in chunks of 1MB
   */
  streamTrack: async (
    trackId: number,
    startByte: number
  ): Promise<Response> => {
    const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB in bytes
    const endByte = startByte + CHUNK_SIZE - 1;

    const response = await fetch(`${API_BASE_URL}/tracks/${trackId}/stream`, {
      headers: {
        Range: `bytes=${startByte}-${endByte}`,
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok && response.status !== 206) {
      throw new Error("Failed to stream track");
    }

    return response;
  },

  // Album endpoints
  getAlbums: async (): Promise<Album[]> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/albums`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch albums");
    return response.json();
  },

  getAlbum: async (id: number): Promise<AlbumWithTracks> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch album");
    return response.json();
  },

  getAlbumCoverUrl: (id: number): string => {
    return `${API_BASE_URL}/albums/${id}/cover`;
  },

  // Auth endpoints
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return response.json();
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    return response.json();
  },

  // Admin endpoints
  forceIndex: async (): Promise<{
    message: string;
    added: Track[];
    removed: Track[];
    unchanged: Track[];
  }> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/index`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to start indexing");
    }

    return response.json();
  },
};
