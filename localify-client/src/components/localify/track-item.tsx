import {
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  PlusCircle,
  ListMusic,
} from "lucide-react";
import { useState } from "react";
import { ReactionType, Playlist, api } from "../../services/api";
import { ContextMenu } from "../ui/context-menu";
import { Modal } from "../ui/modal";
import { PlaceholderImage } from "./placeholder-image";
import { useTheme } from "../../contexts/theme-context";

interface TrackItemProps {
  title: string;
  artist: string;
  duration: number;
  isPlaying?: boolean;
  isActive?: boolean;
  reaction: ReactionType;
  trackId: number;
  number?: number;
  onClick?: () => void;
  onReactionUpdate?: (trackId: number, reaction: ReactionType) => void;
  playlists: Playlist[];
  onPlaylistsChange?: (playlists: Playlist[]) => void;
  showArt?: boolean;
  albumId?: number;
}

export const TrackItem = ({
  title,
  artist,
  duration,
  isPlaying,
  isActive,
  reaction,
  trackId,
  number,
  onClick,
  onReactionUpdate,
  playlists,
  onPlaylistsChange,
  showArt,
  albumId,
}: TrackItemProps) => {
  const { gradientFrom, gradientTo } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);

  const handleAddToPlaylist = async (playlistId: number) => {
    try {
      await api.addTrackToPlaylist(playlistId, trackId);
      // Update the playlist's track count in the local state
      if (onPlaylistsChange) {
        onPlaylistsChange(
          playlists.map((p) =>
            p.id === playlistId ? { ...p, trackCount: p.trackCount + 1 } : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to add track to playlist:", error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const { id } = await api.createPlaylist(
        newPlaylistName,
        newPlaylistDescription || undefined
      );
      await api.addTrackToPlaylist(id, trackId);

      const newPlaylist = {
        id,
        name: newPlaylistName,
        description: newPlaylistDescription || null,
        userId: 0,
        trackCount: 1,
        createdAt: new Date().toISOString(),
      };
      if (onPlaylistsChange) {
        onPlaylistsChange([...playlists, newPlaylist]);
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      setError("Failed to create playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewPlaylistName("");
    setNewPlaylistDescription("");
    setError(null);
  };

  const handleReaction = async (type: "like" | "dislike") => {
    if (reactionLoading) return;
    setReactionLoading(true);

    try {
      const newType = type === reaction ? null : type;
      const { reaction: newReaction } = await api.setReaction(trackId, newType);
      onReactionUpdate?.(trackId, newReaction);
    } catch (error) {
      console.error("Failed to set reaction:", error);
    } finally {
      setReactionLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div
        className={`group px-4 py-3 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 hover:backdrop-blur-xl cursor-pointer ${
          isActive ? "bg-white/10 border-white/10" : ""
        }`}
        onClick={(e) => {
          const isMenuClick = (e.target as HTMLElement).closest(
            '[data-context-menu="true"]'
          );
          if (!isMenuClick && onClick) {
            onClick();
          }
        }}
      >
        <div className="flex items-center gap-4">
          {showArt ? (
            <PlaceholderImage
              type="album"
              id={albumId}
              hasImage={albumId !== undefined}
              size="md"
            />
          ) : (
            <div className="w-8 text-center text-sm text-white/40 group-hover:text-white/60">
              {isActive ? (
                isPlaying ? (
                  <div
                    className={`w-4 h-4 mx-auto rounded-sm bg-gradient-to-r ${gradientFrom} ${gradientTo} animate-pulse`}
                  />
                ) : (
                  <Pause className="w-4 h-4 mx-auto text-white" fill="white" />
                )
              ) : (
                <span className="group-hover:hidden">{number}</span>
              )}
              {!isActive && (
                <Play
                  className="w-4 h-4 mx-auto text-white hidden group-hover:block"
                  fill="white"
                />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                isActive
                  ? `text-transparent bg-clip-text bg-gradient-to-r ${gradientFrom} ${gradientTo}`
                  : "text-white"
              }`}
            >
              {title}
            </p>
            <p className="text-sm text-white/60 truncate">{artist}</p>
          </div>
          <div
            className="flex items-center gap-4"
            data-context-menu="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReaction("like")}
                disabled={reactionLoading}
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  reaction === "like"
                    ? "text-green-500 bg-green-500/10"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5 opacity-0 group-hover:opacity-100"
                } ${reactionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReaction("dislike")}
                disabled={reactionLoading}
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  reaction === "dislike"
                    ? "text-red-500 bg-red-500/10"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5 opacity-0 group-hover:opacity-100"
                } ${reactionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
            <ContextMenu
              items={[
                {
                  label: "Add to Playlist",
                  icon: <ListMusic className="w-4 h-4" />,
                  items: [
                    ...playlists.map((playlist) => ({
                      label: playlist.name,
                      icon: <ListMusic className="w-4 h-4" />,
                      onClick: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleAddToPlaylist(playlist.id);
                      },
                    })),
                    {
                      label: "Create New Playlist",
                      icon: <PlusCircle className="w-4 h-4" />,
                      onClick: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setIsModalOpen(true);
                      },
                    },
                  ],
                },
              ]}
            >
              <button className="p-1 rounded-lg hover:bg-white/10">
                <MoreHorizontal className="w-4 h-4 text-white/60" />
              </button>
            </ContextMenu>
            <span className="text-sm text-white/60 w-12 text-right">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create New Playlist"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-white/60 mb-2">Name</label>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-${gradientFrom.replace(
                "from-",
                ""
              )} transition-colors`}
              placeholder="My Awesome Playlist"
            />
          </div>
          <div>
            <label className="block text-white/60 mb-2">
              Description (optional)
            </label>
            <textarea
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-${gradientFrom.replace(
                "from-",
                ""
              )} transition-colors`}
              placeholder="A collection of my favorite tracks"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim() || isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
