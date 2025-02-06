import { Track, api } from "../../services/api";
import { ContentView } from "./content-view";

interface MainContentProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onTrackSelect: (index: number) => void;
}

export const MainContent = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  onTrackSelect,
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
    />
  );
};
