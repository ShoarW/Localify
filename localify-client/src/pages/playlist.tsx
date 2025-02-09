import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlaylistDetails, Track, api, Playlist } from "../services/api";
import { ContentView } from "../components/localify/content-view";
import { getGradientByIndex } from "../lib/utils";
import { useTheme } from "../contexts/theme-context";

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
  const { gradientFrom } = useTheme();
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
      <div className="flex-1 h-full flex items-center justify-center">
        <div
          className={`w-8 h-8 border-2 border-t-${gradientFrom.replace(
            "from-",
            ""
          )} rounded-full animate-spin`}
        />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <p className="text-white/60">Playlist not found</p>
      </div>
    );
  }

  const currentTrackIndex = playlist.tracks.findIndex(
    (track) => track.id === currentTrackId
  );

  return (
    <div className="flex-1 h-full flex flex-col">
      <ContentView
        title={playlist.name}
        subtitle="Playlist"
        artist={playlist.ownerName}
        tracks={playlist.tracks}
        currentTrackIndex={currentTrackIndex}
        isPlaying={isPlaying}
        onTrackSelect={(index) => onPlayTrack(playlist.tracks, index)}
        gradient={getGradientByIndex(playlist.id)}
        playlists={playlists}
        onPlaylistsChange={onPlaylistsChange}
        createdAt={playlist.createdAt}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {error && (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};
