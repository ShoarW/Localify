import { Search, X, Music, User, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { api, SearchResults, Track } from "../../services/api";
import { Link } from "react-router-dom";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
}

export const SearchModal = ({
  isOpen,
  onClose,
  onPlayTrack,
}: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await api.advancedSearch(query);
        setResults(data);
      } catch (error) {
        setError("Failed to perform search");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query]);

  const handleClose = () => {
    onClose();
    // Clear results and query after a short delay to avoid visual jarring
    setTimeout(() => {
      setResults(null);
      setQuery("");
    }, 200);
  };

  const handleTrackClick = async (track: SearchResults["tracks"][0]) => {
    try {
      const albumData = await api.getAlbum(track.albumId);
      const fullTrack = albumData.tracks.find((t) => t.id === track.id);
      if (fullTrack) {
        onPlayTrack(fullTrack);
        handleClose();
      }
    } catch (error) {
      console.error("Failed to fetch track details:", error);
    }
  };

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 mt-16">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-white/10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for songs, artists, or albums..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500 transition-colors"
              autoFocus
            />
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : results ? (
            <div className="p-6 space-y-8">
              {/* Artists */}
              {results.artists.length > 0 && (
                <div>
                  <h3 className="text-white/60 text-sm font-medium mb-4">
                    Artists
                  </h3>
                  <div className="space-y-2">
                    {results.artists.map((artist) => (
                      <Link
                        key={artist.id}
                        to={`/artists/${artist.id}`}
                        onClick={handleClose}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
                            {api.getArtistImageUrl(artist.id) ? (
                              <img
                                src={`${api.getArtistImageUrl(
                                  artist.id
                                )}?t=${Date.now()}`}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (!parent) return;

                                  // Clean up any existing fallback icons
                                  const existingIcons =
                                    parent.querySelectorAll(".fallback-icon");
                                  existingIcons.forEach((icon) =>
                                    icon.remove()
                                  );

                                  // Hide the failed image
                                  target.style.display = "none";

                                  // Add new icon with a class for future cleanup
                                  const icon = document.createElement("div");
                                  icon.className = "fallback-icon";
                                  icon.innerHTML =
                                    '<svg class="w-5 h-5 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                  parent.appendChild(icon);
                                }}
                              />
                            ) : (
                              <User className="w-5 h-5 text-white/40" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {artist.name}
                            </p>
                            <p className="text-white/60 text-sm">
                              {artist.trackCount} tracks
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums */}
              {results.albums.length > 0 && (
                <div>
                  <h3 className="text-white/60 text-sm font-medium mb-4">
                    Albums
                  </h3>
                  <div className="space-y-2">
                    {results.albums.map((album) => (
                      <Link
                        key={album.id}
                        to={`/albums/${album.id}`}
                        onClick={handleClose}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {album.coverPath ? (
                            <img
                              src={api.getAlbumCoverUrl(album.id)}
                              alt={album.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                              <Music className="w-5 h-5 text-white/40" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {album.title}
                            </p>
                            <p className="text-white/60 text-sm">
                              {album.artist} • {album.trackCount} tracks
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracks */}
              {results.tracks.length > 0 && (
                <div>
                  <h3 className="text-white/60 text-sm font-medium mb-4">
                    Tracks
                  </h3>
                  <div className="space-y-2">
                    {results.tracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
                        onClick={() => handleTrackClick(track)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center relative group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-rose-600 transition-all duration-300">
                            <Music className="w-5 h-5 text-white/40 group-hover:hidden" />
                            <Play
                              className="w-5 h-5 text-white hidden group-hover:block"
                              fill="white"
                            />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {track.title}
                            </p>
                            <p className="text-white/60 text-sm">
                              {track.artist}
                            </p>
                          </div>
                        </div>
                        <span className="text-white/40 text-sm">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {results.artists.length === 0 &&
                results.albums.length === 0 &&
                results.tracks.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    No results found
                  </div>
                )}
            </div>
          ) : (
            <div className="p-8 text-center text-white/40">
              Start typing to search...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
