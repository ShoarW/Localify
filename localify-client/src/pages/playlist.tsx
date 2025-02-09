import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlaylistDetails, Track, api, Playlist } from "../services/api";
import { ContentView } from "../components/localify/content-view";
import { Trash2 } from "lucide-react";
import { getGradientByIndex } from "../lib/utils";

interface PlaylistPageProps {
  currentTrackId: number | null;
  isPlaying: boolean;
  onPlayTrack: (tracks: Track[], startIndex: number) => void;
  playlists: Playlist[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
}

export const PlaylistPage = ({
  currentTrackId,
  isPlaying,
  onPlayTrack,
  playlists,
  onPlaylistsChange,
}: PlaylistPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id) return;

      try {
        const data = await api.getPlaylist(parseInt(id));
        setPlaylist(data);
      } catch (error) {
        setError("Failed to fetch playlist");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  const handleDelete = async () => {
    if (
      !playlist ||
      !window.confirm("Are you sure you want to delete this playlist?")
    )
      return;

    setIsDeleting(true);
    try {
      await api.deletePlaylist(playlist.id);
      navigate("/playlists");
    } catch (error) {
      setError("Failed to delete playlist");
      console.error(error);
      setIsDeleting(false);
    }
  };

  // const handleRemoveTrack = async (trackId: number) => {
  //   if (!playlist) return;

  //   try {
  //     await api.removeTrackFromPlaylist(playlist.id, trackId);
  //     setPlaylist({
  //       ...playlist,
  //       tracks: playlist.tracks.filter((t) => t.id !== trackId),
  //     });
  //   } catch (error) {
  //     setError("Failed to remove track");
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/60">Playlist not found</p>
      </div>
    );
  }

  const currentTrackIndex = playlist.tracks.findIndex(
    (track) => track.id === currentTrackId
  );

  return (
    <div className="flex-1 flex flex-col">
      <ContentView
        title={playlist.name}
        subtitle="Playlist"
        coverImage="https://iili.io/HlHy9Yx.png"
        artist={playlist.ownerName}
        tracks={playlist.tracks}
        currentTrackIndex={currentTrackIndex}
        isPlaying={isPlaying}
        onTrackSelect={(index) => onPlayTrack(playlist.tracks, index)}
        gradient={getGradientByIndex(playlist.id)}
        playlists={playlists}
        onPlaylistsChange={onPlaylistsChange}
      />

      {error && (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Playlist Actions */}
      <div className="sticky bottom-0 p-4 border-t border-white/10 backdrop-blur-xl bg-black/30">
        <div className="flex items-center justify-between">
          <p className="text-white/60 text-sm">
            Created {new Date(playlist.createdAt).toLocaleDateString()}
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete Playlist</span>
          </button>
        </div>
      </div>
    </div>
  );
};
