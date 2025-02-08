import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlbumWithTracks, Track, api, Playlist } from "../../services/api";
import { Play, Shuffle } from "lucide-react";
import { TrackItem } from "./track-item";
import { Link } from "react-router-dom";

interface AlbumPageProps {
  currentTrackId: number | null;
  isPlaying: boolean;
  onPlayAlbum: (tracks: Track[], startIndex: number) => void;
  playlists: Playlist[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
}

export const AlbumPage = ({
  currentTrackId,
  isPlaying,
  onPlayAlbum,
  playlists,
  onPlaylistsChange,
}: AlbumPageProps) => {
  const { id } = useParams<{ id: string }>();
  const [albumData, setAlbumData] = useState<AlbumWithTracks | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) return;

      try {
        const data = await api.getAlbum(parseInt(id));
        setAlbumData(data);
      } catch (error) {
        console.error("Failed to fetch album:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  // Handle reaction updates
  const handleReactionUpdate = (
    trackId: number,
    newReaction: "like" | "dislike" | null
  ) => {
    if (!albumData) return;

    setAlbumData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tracks: prev.tracks.map((track) =>
          track.id === trackId ? { ...track, reaction: newReaction } : track
        ),
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/60">Album not found</p>
      </div>
    );
  }

  const { album, tracks } = albumData;
  const currentTrackIndex = tracks.findIndex(
    (track) => track.id === currentTrackId
  );

  const handleTrackClick = (index: number) => {
    onPlayAlbum(tracks, index);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="p-8">
        {/* Album Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          <div className="relative group shrink-0">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
            <div className="relative w-60 h-60">
              <img
                src={api.getAlbumCoverUrl(album.id)}
                alt={album.title}
                className="w-full h-full object-cover rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center transform group-hover:scale-105">
                <button
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                  onClick={() => handleTrackClick(0)}
                >
                  <Play className="w-8 h-8 text-white" fill="white" />
                </button>
              </div>
            </div>
          </div>
          <div className="relative flex-1 min-w-0">
            <div className="absolute -inset-8 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-5 blur-2xl" />
            <div className="relative">
              <p className="text-white/60 text-sm font-medium mb-2">Album</p>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-6 break-words">
                {album.title}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity"
                  onClick={() => handleTrackClick(0)}
                >
                  <Play className="w-4 h-4" fill="white" />
                  <span>Play</span>
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                  onClick={() => {
                    // Create a shuffled copy of the tracks array
                    const shuffledTracks = [...tracks].sort(
                      () => Math.random() - 0.5
                    );
                    onPlayAlbum(shuffledTracks, 0);
                  }}
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Shuffle</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={api.getArtistImageUrl(album.artistId)}
                    alt={album.artist}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement?.classList.add(
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                      const icon = document.createElement("div");
                      icon.innerHTML =
                        '<svg class="w-3 h-3 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                      target.parentElement?.appendChild(icon);
                    }}
                  />
                </div>
                <Link
                  to={`/artists/${album.artistId}`}
                  className="text-white font-medium truncate hover:text-white/80 transition-colors"
                >
                  {album.artist}
                </Link>
                <span className="shrink-0">• {tracks.length} songs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-1">
          {tracks.map((track, index) => (
            <TrackItem
              key={track.id}
              number={index + 1}
              title={track.title}
              artist={track.artist}
              duration={Math.floor(track.duration)}
              isActive={currentTrackIndex === index}
              isPlaying={currentTrackIndex === index && isPlaying}
              reaction={track.reaction}
              trackId={track.id}
              onClick={() => handleTrackClick(index)}
              onReactionUpdate={handleReactionUpdate}
              playlists={playlists}
              onPlaylistsChange={onPlaylistsChange}
              onPlayTracks={onPlayAlbum}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
