import { Trash2 } from "lucide-react";
import { Track } from "../../services/api";
import { TrackItem } from "./track-item";
import { Playlist } from "../../services/api";
import { useTheme } from "../../contexts/theme-context";
import { PlaceholderImage } from "./placeholder-image";
import { api } from "../../services/api";

interface ContentViewProps {
  title: string;
  subtitle: string;
  artist: string;
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onTrackSelect: (index: number) => void;
  gradient?: string;
  playlists: Playlist[];
  onPlaylistsChange?: (playlists: Playlist[]) => void;
  createdAt?: string;
  onDelete?: () => void;
  isDeleting?: boolean;
  albumId?: number;
  artistId?: number;
  hasImage?: boolean;
  onReactionUpdate?: (
    trackId: number,
    reaction: "like" | "dislike" | null
  ) => void;
}

export const ContentView = ({
  title,
  subtitle,
  artist,
  tracks,
  currentTrackIndex,
  isPlaying,
  onTrackSelect,
  gradient,
  playlists,
  onPlaylistsChange,
  createdAt,
  onDelete,
  isDeleting,
  albumId,
  artistId,
  hasImage = false,
  onReactionUpdate,
}: ContentViewProps) => {
  const { gradientFrom, gradientTo } = useTheme();
  const finalGradient = gradient || `${gradientFrom} ${gradientTo}`;

  const handlePlay = () => {
    if (tracks.length > 0) {
      onTrackSelect(0);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      {/* Background image for artist/album */}
      {hasImage && (artistId || albumId) && (
        <div className="fixed inset-0 w-full h-full">
          <img
            src={
              artistId
                ? api.getArtistImageUrl(artistId)
                : api.getAlbumCoverUrl(albumId!)
            }
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/95 to-black pointer-events-none" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 p-8 pb-4 bg-gradient-to-b from-black/50 to-black/30 backdrop-blur-xl">
          <div className="flex items-end gap-6 mb-8">
            <div className="relative group shrink-0">
              <div
                className={`absolute -inset-2 rounded-2xl bg-gradient-to-r ${finalGradient} opacity-0 group-hover:opacity-20 blur transition-all duration-300`}
              />
              <div className="relative w-60 h-60">
                {artistId ? (
                  <PlaceholderImage
                    type="artist"
                    id={artistId}
                    hasImage={hasImage}
                    size="xl"
                    rounded="lg"
                    className="w-full h-full shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    showPlayButton
                    onPlayClick={handlePlay}
                    gradient={finalGradient}
                  />
                ) : albumId ? (
                  <PlaceholderImage
                    type="album"
                    id={albumId}
                    hasImage={hasImage}
                    size="xl"
                    rounded="lg"
                    className="w-full h-full shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    showPlayButton
                    onPlayClick={handlePlay}
                    gradient={finalGradient}
                  />
                ) : (
                  <PlaceholderImage
                    type="album"
                    size="xl"
                    rounded="lg"
                    className="w-full h-full shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    showPlayButton
                    onPlayClick={handlePlay}
                    gradient={finalGradient}
                  />
                )}
              </div>
            </div>
            <div className="relative">
              <div
                className={`absolute -inset-8 rounded-2xl bg-gradient-to-r ${finalGradient} opacity-5 blur-2xl`}
              />
              <div className="relative">
                <p className="text-white/60 text-sm font-medium mb-2">
                  {subtitle}
                </p>
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-6">
                  {title}
                </h1>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    {artistId ? (
                      <PlaceholderImage
                        type="artist"
                        id={artistId}
                        hasImage={hasImage}
                        size="sm"
                        rounded="full"
                      />
                    ) : albumId ? (
                      <PlaceholderImage
                        type="album"
                        id={albumId}
                        hasImage={hasImage}
                        size="sm"
                        rounded="full"
                      />
                    ) : (
                      <PlaceholderImage type="album" size="sm" rounded="full" />
                    )}
                    <span className="text-white font-medium">{artist}</span>
                    {tracks.length > 0 && (
                      <span>
                        • {tracks.length}{" "}
                        {tracks.length === 1 ? "song" : "songs"}
                      </span>
                    )}
                  </div>
                  {createdAt && (
                    <p className="text-white/60 text-sm">
                      Created {new Date(createdAt).toLocaleDateString()}
                    </p>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      disabled={isDeleting}
                      className={`self-start flex items-center gap-2 px-4 py-2 mt-2 rounded-xl text-${gradientFrom.replace(
                        "from-",
                        ""
                      )} hover:bg-${gradientFrom.replace(
                        "from-",
                        ""
                      )}/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Playlist</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Track List */}
        <div className="px-8 pb-8 pt-4">
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <TrackItem
                key={track.id}
                track={track}
                isActive={currentTrackIndex === index}
                isPlaying={currentTrackIndex === index && isPlaying}
                onClick={() => onTrackSelect(index)}
                playlists={playlists}
                onPlaylistsChange={onPlaylistsChange}
                onReactionUpdate={onReactionUpdate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
