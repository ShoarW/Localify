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
  reaction: "like" | "dislike" | null;
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

export type ReactionType = "like" | "dislike" | null;

export interface PaginatedTracks {
  tracks: Track[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  trackCount: number;
  createdAt: string;
}

export interface PlaylistTrack extends Track {
  position: number;
}

export interface PlaylistDetails {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  ownerName: string;
  createdAt: string;
  tracks: PlaylistTrack[];
}

export interface TrackOrder {
  trackId: number;
  position: number;
}

export interface SearchResults {
  artists: {
    name: string;
    trackCount: number;
  }[];
  albums: {
    id: number;
    title: string;
    artist: string | null;
    year: number | null;
    coverPath: string | null;
    trackCount: number;
    createdAt: string;
    updatedAt: string | null;
  }[];
  tracks: {
    id: number;
    title: string;
    artist: string;
    albumId: number;
    duration: number;
    reaction: "like" | "dislike" | null;
  }[];
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

  // Reaction endpoints
  setReaction: async (
    trackId: number,
    type: ReactionType
  ): Promise<{ reaction: ReactionType }> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/tracks/${trackId}/reaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      throw new Error("Failed to set reaction");
    }

    return response.json();
  },

  getReaction: async (trackId: number): Promise<{ reaction: ReactionType }> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/tracks/${trackId}/reaction`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get reaction");
    }

    return response.json();
  },

  getReactions: async (
    type: "like" | "dislike",
    page: number = 1,
    pageSize: number = 100
  ): Promise<PaginatedTracks> => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/reactions?type=${type}&page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch reactions");
    }

    return response.json();
  },

  // Playlist endpoints
  getPlaylists: async (): Promise<Playlist[]> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch playlists");
    return response.json();
  },

  createPlaylist: async (
    name: string,
    description?: string
  ): Promise<{ id: number }> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error("Failed to create playlist");
    return response.json();
  },

  getPlaylist: async (playlistId: number): Promise<PlaylistDetails> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error("Failed to fetch playlist");
    return response.json();
  },

  deletePlaylist: async (playlistId: number): Promise<{ success: boolean }> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to delete playlist");
    return response.json();
  },

  addTrackToPlaylist: async (
    playlistId: number,
    trackId: number
  ): Promise<{ success: boolean }> => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackId }),
      }
    );
    if (!response.ok) throw new Error("Failed to add track to playlist");
    return response.json();
  },

  removeTrackFromPlaylist: async (
    playlistId: number,
    trackId: number
  ): Promise<{ success: boolean }> => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/playlists/${playlistId}/tracks/${trackId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to remove track from playlist");
    return response.json();
  },

  updatePlaylistOrder: async (
    playlistId: number,
    trackOrders: TrackOrder[]
  ): Promise<{ success: boolean }> => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/playlists/${playlistId}/order`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackOrders }),
      }
    );
    if (!response.ok) throw new Error("Failed to update track order");
    return response.json();
  },

  // Search endpoints
  advancedSearch: async (
    query: string,
    limit: number = 5
  ): Promise<SearchResults> => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/search/advanced?q=${encodeURIComponent(
        query
      )}&limit=${limit}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    if (!response.ok) throw new Error("Search failed");
    return response.json();
  },
};
