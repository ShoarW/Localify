import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlbumWithTracks, Track, api } from "../../services/api";
import { ContentView } from "./content-view";
import { Play } from "lucide-react";
import { TrackItem } from "./track-item";

interface AlbumPageProps {
  currentTrackId: number | null;
  isPlaying: boolean;
  onPlayAlbum: (tracks: Track[], startIndex: number) => void;
}

export const AlbumPage = ({
  currentTrackId,
  isPlaying,
  onPlayAlbum,
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
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <img
                  src={api.getAlbumCoverUrl(album.id)}
                  alt={album.artist}
                  className="w-6 h-6 rounded-full shrink-0"
                />
                <span className="text-white font-medium truncate">
                  {album.artist}
                </span>
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
            />
          ))}
        </div>
      </div>
    </div>
  );
};
