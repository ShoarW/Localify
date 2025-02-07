import React, { createContext, useContext, useState, useEffect } from "react";
import { Track } from "../services/api";

interface PlayerContextType {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  setTracks: (tracks: Track[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
}

interface SavedPlayerState {
  tracks: Track[];
  currentTrackIndex: number;
  volume: number;
}

const STORAGE_KEY = "localify_player_state";

const loadSavedState = (): SavedPlayerState | null => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Error loading saved player state:", error);
    }
  }
  return null;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

interface PlayerProviderProps {
  children: React.ReactNode;
}

export const PlayerProvider = ({ children }: PlayerProviderProps) => {
  // Load saved state or use defaults
  const savedState = loadSavedState();
  const [tracks, setTracks] = useState<Track[]>(savedState?.tracks || []);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(
    savedState?.currentTrackIndex || -1
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(savedState?.volume || 70);

  // Save state to localStorage when it changes
  useEffect(() => {
    const state = {
      tracks,
      currentTrackIndex,
      volume,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [tracks, currentTrackIndex, volume]);

  const value: PlayerContextType = {
    tracks,
    currentTrackIndex,
    isPlaying,
    volume,
    setTracks,
    setCurrentTrackIndex,
    setIsPlaying,
    setVolume,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
