import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArtistDetails, Track, api } from "../../services/api";
import {
  User,
  Play,
  Edit,
  ChevronDown,
  ChevronUp,
  Shuffle,
} from "lucide-react";
import { TrackItem } from "./track-item";
import { AlbumCard } from "./album-card";
import { EditArtistModal } from "./edit-artist-modal";
import { getUser } from "../../utils/auth";

interface ArtistPageProps {
  currentTrackId: number | null;
  isPlaying: boolean;
  onPlayTrack: (tracks: Track[], startIndex: number) => void;
}

export const ArtistPage = ({
  currentTrackId,
  isPlaying,
  onPlayTrack,
}: ArtistPageProps) => {
  const { id } = useParams<{ id: string }>();
  const [artistData, setArtistData] = useState<ArtistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const isAdmin = getUser()?.isAdmin || false;

  useEffect(() => {
    const fetchArtist = async () => {
      if (!id) return;

      try {
        const data = await api.getArtist(parseInt(id));
        setArtistData(data);
      } catch (error) {
        console.error("Failed to fetch artist:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!artistData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/60">Artist not found</p>
      </div>
    );
  }

  const { artist, randomTracks, albums, singles } = artistData;

  const handleTrackClick = (tracks: Track[], index: number) => {
    onPlayTrack(tracks, index);
  };

  const handleReactionUpdate = (
    trackId: number,
    newReaction: "like" | "dislike" | null
  ) => {
    setArtistData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        randomTracks: prev.randomTracks.map((track) =>
          track.id === trackId ? { ...track, reaction: newReaction } : track
        ),
        singles: prev.singles.map((track) =>
          track.id === trackId ? { ...track, reaction: newReaction } : track
        ),
      };
    });
  };

  const handleArtistUpdate = (data: {
    name: string;
    description: string | null;
    imagePath: string | null;
    artistId: number;
  }) => {
    if (!artistData) return;
    setArtistData({
      ...artistData,
      artist: {
        ...artistData.artist,
        name: data.name,
        description: data.description,
        imagePath: data.imagePath,
      },
      randomTracks: artistData.randomTracks.map((track) => ({
        ...track,
        artist: data.name,
        artistId: data.artistId,
      })),
      singles: artistData.singles.map((track) => ({
        ...track,
        artist: data.name,
        artistId: data.artistId,
      })),
      albums: artistData.albums.map((album) => ({
        ...album,
        artist: data.name,
        artistId: data.artistId,
      })),
    });
  };

  return (
    <div className="flex-1 h-full overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="p-8">
        {/* Artist Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          <div className="relative group shrink-0">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
            <div className="relative w-60 h-60">
              {artist.imagePath ? (
                <img
                  src={api.getArtistImageUrl(artist.id)}
                  alt={artist.name}
                  className="w-full h-full object-cover rounded-xl shadow-2xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <User className="w-20 h-20 text-white/40" />
                </div>
              )}
            </div>
          </div>
          <div className="relative flex-1 min-w-0">
            <div className="absolute -inset-8 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-5 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-2">
                <p className="text-white/60 text-sm font-medium">Artist</p>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5 transition-all duration-300"
                    title="Edit artist"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-6 break-words">
                {artist.name}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={async () => {
                    try {
                      const shuffledTracks = await api.shuffleArtist(artist.id);
                      if (shuffledTracks.length > 0) {
                        onPlayTrack(shuffledTracks, 0);
                      }
                    } catch (error) {
                      console.error("Failed to shuffle artist tracks:", error);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Shuffle Play</span>
                </button>
              </div>
              {artist.description && (
                <div className="relative">
                  <p
                    className={`text-white/60 text-sm max-w-2xl transition-all duration-300 ${
                      !isDescriptionExpanded ? "line-clamp-2" : ""
                    }`}
                  >
                    {artist.description}
                  </p>
                  {artist.description.length > 150 && (
                    <button
                      onClick={() =>
                        setIsDescriptionExpanded(!isDescriptionExpanded)
                      }
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors mt-1"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          Show less <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Popular Tracks */}
        {randomTracks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Popular</h2>
            <div className="space-y-1">
              {randomTracks.map((track, index) => (
                <TrackItem
                  key={track.id}
                  number={index + 1}
                  title={track.title}
                  artist={track.artist}
                  duration={track.duration}
                  isActive={currentTrackId === track.id}
                  isPlaying={currentTrackId === track.id && isPlaying}
                  reaction={track.reaction}
                  trackId={track.id}
                  onClick={() => handleTrackClick(randomTracks, index)}
                  onReactionUpdate={handleReactionUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onPlay={async () => {
                    try {
                      const albumData = await api.getAlbum(album.id);
                      handleTrackClick(albumData.tracks, 0);
                    } catch (error) {
                      console.error("Failed to play album:", error);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Singles */}
        {singles.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Singles</h2>
            <div className="space-y-1">
              {singles.map((track, index) => {
                // Convert single track to full Track type
                const fullTrack: Track = {
                  id: track.id,
                  title: track.title,
                  artist: artist.name,
                  artistId: artist.id,
                  duration: track.duration,
                  reaction: track.reaction,
                  // Add required Track properties with placeholder values
                  path: "",
                  filename: "",
                  album: "Single",
                  albumId: 0,
                  year: 0,
                  genre: "",
                  mimeType: "",
                  createdAt: 0,
                  updatedAt: null,
                };
                return (
                  <TrackItem
                    key={track.id}
                    number={index + 1}
                    title={track.title}
                    artist={artist.name}
                    duration={track.duration}
                    isActive={currentTrackId === track.id}
                    isPlaying={currentTrackId === track.id && isPlaying}
                    reaction={track.reaction}
                    trackId={track.id}
                    onClick={() => handleTrackClick([fullTrack], 0)}
                    onReactionUpdate={handleReactionUpdate}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isAdmin && artistData && (
        <EditArtistModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          artistId={parseInt(id!)}
          initialData={{
            name: artistData.artist.name,
            description: artistData.artist.description,
            imagePath: artistData.artist.imagePath,
          }}
          onUpdate={handleArtistUpdate}
        />
      )}
    </div>
  );
};
