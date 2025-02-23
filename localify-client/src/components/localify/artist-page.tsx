import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArtistDetails, Track, api, Playlist } from "../../services/api";
import { Edit, ChevronDown, ChevronUp, Shuffle } from "lucide-react";
import { TrackItem } from "./track-item";
import { AlbumCard } from "./album-card";
import { EditArtistModal } from "./edit-artist-modal";
import { getUser } from "../../utils/auth";
import { useTheme } from "../../contexts/theme-context";
import { PlaceholderImage } from "./placeholder-image";

interface ArtistPageProps {
  currentTrackId: number | null;
  isPlaying: boolean;
  onPlayTrack: (tracks: Track[], startIndex: number) => void;
  playlists: Playlist[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
}

export const ArtistPage = ({
  currentTrackId,
  isPlaying,
  onPlayTrack,
  playlists,
  onPlaylistsChange,
}: ArtistPageProps) => {
  const { id } = useParams<{ id: string }>();
  const [artistData, setArtistData] = useState<ArtistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { gradientFrom, gradientTo } = useTheme();

  // Reset modal and description state when artist changes
  useEffect(() => {
    setIsEditModalOpen(false);
    setIsDescriptionExpanded(false);
  }, [id]);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getUser();
      setIsAdmin(user?.isAdmin || false);
    };
    checkAdmin();
  }, []);

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
        <div
          className={`w-8 h-8 border-2 border-white/20 border-t-${gradientFrom.replace(
            "from-",
            ""
          )} rounded-full animate-spin`}
        />
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
    artistId: number;
    hasImage: boolean;
    hasBackgroundImage: boolean;
  }) => {
    if (!artistData) return;
    setArtistData({
      ...artistData,
      artist: {
        ...artistData.artist,
        name: data.name,
        description: data.description,
        hasImage: data.hasImage,
        hasBackgroundImage: data.hasBackgroundImage,
        createdAt: artistData.artist.createdAt,
        updatedAt: artistData.artist.updatedAt,
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
    <div className="flex-1 h-full overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30 artist-page-container">
      {artist.hasImage && (
        <div className="fixed inset-0 w-full h-full">
          <img
            src={
              artist.hasBackgroundImage
                ? api.getArtistBackgroundUrl(artist.id)
                : api.getArtistImageUrl(artist.id)
            }
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/95 to-black pointer-events-none" />
        </div>
      )}
      <div className="relative z-10 p-8">
        {/* Artist Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
          <div className="relative group shrink-0">
            <div
              className={`absolute -inset-2 rounded-2xl bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-20 blur transition-all duration-300`}
            />
            <div className="relative w-60 h-60">
              <PlaceholderImage
                type="artist"
                id={artist.id}
                hasImage={artist.hasImage}
                size="xl"
                rounded="lg"
                className="w-full h-full shadow-2xl transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center transform group-hover:scale-105" />
            </div>
          </div>
          <div className="relative flex-1 min-w-0">
            <div
              className={`absolute -inset-8 rounded-2xl bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-5 blur-2xl`}
            />
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-medium hover:opacity-90 transition-opacity`}
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
                  track={track}
                  isActive={currentTrackId === track.id}
                  isPlaying={currentTrackId === track.id && isPlaying}
                  onClick={() => handleTrackClick(randomTracks, index)}
                  onReactionUpdate={handleReactionUpdate}
                  playlists={playlists}
                  onPlaylistsChange={onPlaylistsChange}
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
                return (
                  <TrackItem
                    key={track.id}
                    number={index + 1}
                    track={track}
                    isActive={currentTrackId === track.id}
                    isPlaying={currentTrackId === track.id && isPlaying}
                    onClick={() => handleTrackClick([track], 0)}
                    onReactionUpdate={handleReactionUpdate}
                    playlists={playlists}
                    onPlaylistsChange={onPlaylistsChange}
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
          artistId={artist.id}
          initialData={{
            name: artist.name,
            description: artist.description,
            hasImage: artist.hasImage,
            hasBackgroundImage: artist.hasBackgroundImage,
          }}
          onUpdate={handleArtistUpdate}
        />
      )}
    </div>
  );
};
