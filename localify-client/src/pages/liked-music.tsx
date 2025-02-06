import { useEffect, useState } from "react";
import { api, Track, Playlist } from "../services/api";
import { ContentView } from "../components/localify/content-view";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LikedMusicProps {
  currentTrackId: number | null;
  isPlaying: boolean;
  onPlayTrack: (tracks: Track[], startIndex: number) => void;
  playlists: Playlist[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
}

export const LikedMusicPage = ({
  currentTrackId,
  isPlaying,
  onPlayTrack,
  playlists,
  onPlaylistsChange,
}: LikedMusicProps) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchLikedTracks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.getReactions("like", currentPage);
        setTracks(data.tracks);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (error) {
        setError("Failed to fetch liked tracks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedTracks();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/60">{error}</p>
      </div>
    );
  }

  const currentTrackIndex = tracks.findIndex(
    (track) => track.id === currentTrackId
  );

  return (
    <div className="flex-1 flex flex-col">
      <ContentView
        title="Liked Songs"
        subtitle="Playlist"
        coverImage="https://iili.io/HlHy9Yx.png"
        artist="Your Library"
        tracks={tracks}
        currentTrackIndex={currentTrackIndex}
        isPlaying={isPlaying}
        onTrackSelect={(index) => onPlayTrack(tracks, index)}
        playlists={playlists}
        onPlaylistsChange={onPlaylistsChange}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 p-4 border-t border-white/10">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};
