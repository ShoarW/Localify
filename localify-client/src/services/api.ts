export interface Track {
  id: number;
  path: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
  duration: number;
  mimeType: string;
  createdAt: number;
  updatedAt: number | null;
}

const API_BASE_URL = "http://localhost:3000";

export const api = {
  /**
   * Fetches all tracks from the server
   */
  getTracks: async (): Promise<Track[]> => {
    const response = await fetch(`${API_BASE_URL}/tracks`);
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
};
