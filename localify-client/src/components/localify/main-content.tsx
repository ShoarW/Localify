import { Track, api } from "../../services/api";
import { ContentView } from "./content-view";
import { Playlist } from "../../services/api";

interface MainContentProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onTrackSelect: (index: number) => void;
  playlists: Playlist[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
}

export const MainContent = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  onTrackSelect,
  playlists,
  onPlaylistsChange,
}: MainContentProps) => {
  const currentTrack = tracks[currentTrackIndex];

  return (
    <ContentView
      title={currentTrack?.album || "No Album"}
      subtitle="Album"
      coverImage={
        currentTrack
          ? api.getTrackCoverUrl(currentTrack)
          : "https://iili.io/HlHy9Yx.png"
      }
      artist={currentTrack?.artist || "Unknown Artist"}
      tracks={tracks}
      currentTrackIndex={currentTrackIndex}
      isPlaying={isPlaying}
      onTrackSelect={onTrackSelect}
      playlists={playlists}
      onPlaylistsChange={onPlaylistsChange}
    />
  );
};
