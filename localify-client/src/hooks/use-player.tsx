import React, { createContext, useContext, useState } from "react";
import { Track } from "../services/api";

interface PlayerContextType {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  setTracks: (tracks: Track[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

interface PlayerProviderProps {
  children: React.ReactNode;
}

export const PlayerProvider = ({ children }: PlayerProviderProps) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const value: PlayerContextType = {
    tracks,
    currentTrackIndex,
    isPlaying,
    setTracks,
    setCurrentTrackIndex,
    setIsPlaying,
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
