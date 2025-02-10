import { validateToken, clearAuth } from "../utils/auth";

export interface Track {
  id: number;
  title: string;
  artist: string;
  artistId: number;
  artistName: string;
  duration: number;
  reaction: ReactionType;
  album: string;
  albumId: number;
  hasImage: boolean;
  year: number;
  genre: string;
  mimeType: string;
  createdAt: number;
  updatedAt: null;
  path: string;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  artistId: number;
  year: number | null;
  hasImage: boolean;
  trackCount: number;
  createdAt: string;
  updatedAt: string | null;
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
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
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
  ownerName: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string | null;
}

export interface TrackOrder {
  trackId: number;
  position: number;
}

export interface SearchResults {
  artists: {
    id: number;
    name: string;
    trackCount: number;
    hasImage: number;
  }[];
  albums: {
    id: number;
    title: string;
    artistId: number;
    hasImage: number;
    artist: string;
    trackCount: number;
  }[];
  tracks: {
    id: number;
    title: string;
    genre: string;
    duration: number;
    reaction: ReactionType;
    artistName: string;
    albumId: number;
    hasImage: boolean;
  }[];
}

export interface Artist {
  id: number;
  name: string;
  description: string | null;
  hasImage: boolean;
  hasBackgroundImage: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ArtistDetails {
  artist: Artist;
  randomTracks: Track[];
  singles: Track[];
  albums: Album[];
}

export interface NewRelease {
  id: number;
  title: string;
  artist: string | null;
  type: "single" | "ep" | "album";
  hasImage: boolean;
}

export interface HomeContent {
  newReleases: NewRelease[];
  quickPicks: Track[];
  listenAgain: Track[];
  featuredPlaylists: Track[];
}

export interface HomeOptions {
  newReleasesLimit?: number;
  quickPicksLimit?: number;
  listenAgainLimit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export type PaginatedAlbums = PaginatedResponse<Album>;
export type PaginatedArtists = PaginatedResponse<Artist>;

const API_BASE_URL = import.meta.env.VITE_API_URL;

const fetchWithToken = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Validate token before making the request
  const isValid = await validateToken();
  if (!isValid) {
    throw new Error("Session expired. Please login again.");
  }

  const accessToken = localStorage.getItem("token");

  // Add access token to request
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  // Make the request
  const response = await fetch(url, { ...options, headers });

  // If we get a 401, the token might have expired just now
  if (response.status === 401) {
    clearAuth(); // This will redirect to login
    throw new Error("Session expired. Please login again.");
  }

  return response;
};

export const api = {
  /**
   * Fetches all tracks from the server
   */
  getTracks: async (): Promise<Track[]> => {
    const response = await fetchWithToken(`${API_BASE_URL}/tracks`);
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
  getAlbums: async (
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedAlbums> => {
    const response = await fetchWithToken(
      `${API_BASE_URL}/albums?page=${page}&pageSize=${pageSize}`
    );
    if (!response.ok) throw new Error("Failed to fetch albums");
    return response.json();
  },

  getAlbum: async (id: number): Promise<AlbumWithTracks> => {
    const response = await fetchWithToken(`${API_BASE_URL}/albums/${id}`);
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

    const data = await response.json();
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
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
  forceIndex: async (
    onProgress: (update: {
      type: "scanning" | "processing" | "cleanup";
      total?: number;
      current: number;
      currentFile?: string;
      added: number;
      removed: number;
      unchanged: number;
      status: "progress" | "complete";
      message?: string;
      addedTracks?: Track[];
      removedTracks?: Track[];
      unchangedTracks?: Track[];
    }) => void
  ): Promise<void> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/index`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Append new chunk to existing buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete events in buffer
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix

            if (data.status === "complete") {
              onProgress({
                status: "complete",
                type: "cleanup", // Keep the last type
                current: 0,
                added: data.added.length,
                removed: data.removed.length,
                unchanged: data.unchanged.length,
                message: data.message,
                addedTracks: data.added,
                removedTracks: data.removed,
                unchangedTracks: data.unchanged,
              });
              return;
            }

            // Handle progress updates
            switch (data.type) {
              case "scanning":
                onProgress({
                  type: "scanning",
                  current: 0,
                  added: data.added,
                  removed: data.removed,
                  unchanged: data.unchanged,
                  status: "progress",
                });
                break;

              case "processing":
                onProgress({
                  type: "processing",
                  total: data.total,
                  current: data.current,
                  currentFile: data.currentFile,
                  added: data.added,
                  removed: data.removed,
                  unchanged: data.unchanged,
                  status: "progress",
                });
                break;

              case "cleanup":
                onProgress({
                  type: "cleanup",
                  total: data.total,
                  current: data.current,
                  added: data.added,
                  removed: data.removed,
                  unchanged: data.unchanged,
                  status: "progress",
                });
                break;
            }
          } catch (error) {
            console.error("Error parsing progress update:", error, line);
          }
        }
      }
    } catch (error) {
      console.error("Indexing error:", error);
      throw error;
    } finally {
      reader.releaseLock();
    }
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

  // Artist endpoints
  getArtists: async (
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedArtists> => {
    const response = await fetch(
      `${API_BASE_URL}/artists?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.json();
  },

  getArtist: async (artistId: number): Promise<ArtistDetails> => {
    const response = await fetch(`${API_BASE_URL}/artists/${artistId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.json();
  },

  updateArtist: async (
    artistId: number,
    data: {
      name: string;
      description: string | null;
      image?: File | null;
      backgroundImage?: File | null;
    }
  ): Promise<{ id: number; artistId: number }> => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description !== null) {
      formData.append("description", data.description);
    }
    if (data.image) {
      formData.append("image", data.image);
    }
    if (data.backgroundImage) {
      formData.append("backgroundImage", data.backgroundImage);
    }

    const response = await fetch(`${API_BASE_URL}/artists/${artistId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to update artist");
    return response.json();
  },

  getArtistImageUrl: (artistId: number): string => {
    return `${API_BASE_URL}/artists/${artistId}/image`;
  },

  getArtistBackgroundUrl: (artistId: number): string => {
    return `${API_BASE_URL}/artists/${artistId}/background`;
  },

  // Artist shuffle endpoint
  shuffleArtist: async (artistId: number, limit?: number): Promise<Track[]> => {
    const token = localStorage.getItem("token");
    const url = new URL(`${API_BASE_URL}/artists/${artistId}/shuffle`);
    if (limit) {
      url.searchParams.append("limit", limit.toString());
    }

    const response = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error("Failed to fetch shuffled tracks");
    return response.json();
  },

  // Home endpoint
  getHomeContent: async (options?: HomeOptions): Promise<HomeContent> => {
    const params = new URLSearchParams();
    if (options?.newReleasesLimit)
      params.append("newReleasesLimit", options.newReleasesLimit.toString());
    if (options?.quickPicksLimit)
      params.append("quickPicksLimit", options.quickPicksLimit.toString());
    if (options?.listenAgainLimit)
      params.append("listenAgainLimit", options.listenAgainLimit.toString());

    const response = await fetchWithToken(
      `${API_BASE_URL}/home${params.toString() ? `?${params.toString()}` : ""}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch home content");
    }

    return response.json();
  },

  // Add new endpoint to get track details
  getTrack: async (id: number): Promise<Track> => {
    const response = await fetchWithToken(`${API_BASE_URL}/tracks/${id}`);
    if (!response.ok) throw new Error("Failed to fetch track");
    return response.json();
  },
};
