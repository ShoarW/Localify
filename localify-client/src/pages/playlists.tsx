import { useState } from "react";
import { Link } from "react-router-dom";
import { Playlist, api } from "../services/api";
import { PlusCircle, Music } from "lucide-react";
import { Modal } from "../components/ui/modal";

interface PlaylistsPageProps {
  playlists: Playlist[];
  isLoading: boolean;
  onPlaylistsChange: (playlists: Playlist[]) => void;
}

export const PlaylistsPage = ({
  playlists,
  isLoading,
  onPlaylistsChange,
}: PlaylistsPageProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const { id } = await api.createPlaylist(
        newPlaylistName,
        newPlaylistDescription || undefined
      );
      const newPlaylist = {
        id,
        name: newPlaylistName,
        description: newPlaylistDescription || null,
        userId: 0, // Will be set by server
        trackCount: 0,
        createdAt: new Date().toISOString(),
      };
      onPlaylistsChange([...playlists, newPlaylist]);
      handleCloseModal();
    } catch (error) {
      setError("Failed to create playlist");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewPlaylistName("");
    setNewPlaylistDescription("");
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Playlist</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              to={`/playlists/${playlist.id}`}
              className="group relative flex flex-col gap-4 p-4 bg-black/20 hover:bg-black/40 rounded-lg transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white/5">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-12 h-12 text-white/20" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-medium truncate">
                  {playlist.name}
                </h3>
                {playlist.description && (
                  <p className="text-white/60 text-sm truncate">
                    {playlist.description}
                  </p>
                )}
                <p className="text-white/40 text-sm">
                  {playlist.trackCount}{" "}
                  {playlist.trackCount === 1 ? "song" : "songs"}
                </p>
              </div>
            </Link>
          ))}
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
              className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors"
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
              className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors"
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
              disabled={!newPlaylistName.trim() || isCreating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
