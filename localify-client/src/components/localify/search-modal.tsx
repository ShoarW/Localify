import { Search, X, Music, User, Play } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { api, SearchResults, Track } from "../../services/api";
import { Link } from "react-router-dom";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
}

type SearchItem = {
  type: "artist" | "album" | "track";
  id: number;
  index: number;
};

export const SearchModal = ({
  isOpen,
  onClose,
  onPlayTrack,
}: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Create refs for each section to enable scrolling into view
  const artistsRef = useRef<HTMLDivElement>(null);
  const albumsRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      if (!results) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();

        const allItems: SearchItem[] = [
          ...results.artists.map((_, i) => ({
            type: "artist" as const,
            id: results.artists[i].id,
            index: i,
          })),
          ...results.albums.map((_, i) => ({
            type: "album" as const,
            id: results.albums[i].id,
            index: i,
          })),
          ...results.tracks.map((_, i) => ({
            type: "track" as const,
            id: results.tracks[i].id,
            index: i,
          })),
        ];

        if (allItems.length === 0) return;

        let currentIndex = -1;
        if (selectedItem) {
          currentIndex = allItems.findIndex(
            (item) =>
              item.type === selectedItem.type && item.id === selectedItem.id
          );
        }

        let newIndex = currentIndex;
        if (e.key === "ArrowDown") {
          newIndex =
            currentIndex === allItems.length - 1 ? 0 : currentIndex + 1;
        } else {
          newIndex =
            currentIndex === -1 || currentIndex === 0
              ? allItems.length - 1
              : currentIndex - 1;
        }

        const newSelectedItem = allItems[newIndex];
        setSelectedItem(newSelectedItem);

        // Scroll the selected item into view
        const itemElement = document.querySelector(
          `[data-search-item="${newSelectedItem.type}-${newSelectedItem.id}"]`
        );
        if (itemElement) {
          itemElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }

      if (e.key === "Enter" && selectedItem) {
        e.preventDefault();
        if (selectedItem.type === "track") {
          const track = results.tracks[selectedItem.index];
          handleTrackClick(track);
        } else {
          const element = document.querySelector(
            `[data-search-item="${selectedItem.type}-${selectedItem.id}"] a`
          ) as HTMLElement;
          if (element) {
            element.click();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, results, selectedItem]);

  useEffect(() => {
    // Reset selection when query changes
    setSelectedItem(null);

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
      setSelectedItem(null);
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
              ref={searchInputRef}
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
                <div ref={artistsRef}>
                  <h3 className="text-white/60 text-sm font-medium mb-4">
                    Artists
                  </h3>
                  <div className="space-y-2">
                    {results.artists.map((artist) => (
                      <div
                        key={artist.id}
                        data-search-item={`artist-${artist.id}`}
                        className={`rounded-xl transition-colors ${
                          selectedItem?.type === "artist" &&
                          selectedItem.id === artist.id
                            ? "bg-white/10"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <Link
                          to={`/artists/${artist.id}`}
                          onClick={handleClose}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
                              {artist.hasImage ? (
                                <img
                                  src={`${api.getArtistImageUrl(
                                    artist.id
                                  )}?t=${Date.now()}`}
                                  alt={artist.name}
                                  className="w-10 h-10 object-cover"
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums */}
              {results.albums.length > 0 && (
                <div ref={albumsRef}>
                  <h3 className="text-white/60 text-sm font-medium mb-4">
                    Albums
                  </h3>
                  <div className="space-y-2">
                    {results.albums.map((album) => (
                      <div
                        key={album.id}
                        data-search-item={`album-${album.id}`}
                        className={`rounded-xl transition-colors ${
                          selectedItem?.type === "album" &&
                          selectedItem.id === album.id
                            ? "bg-white/10"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <Link
                          to={`/albums/${album.id}`}
                          onClick={handleClose}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-3">
                            {album.hasImage ? (
                              <img
                                src={api.getAlbumCoverUrl(album.id)}
                                alt={album.title}
                                className="w-10 h-10 object-cover rounded-xl"
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracks */}
              {results.tracks.length > 0 && (
                <div ref={tracksRef}>
                  <h3 className="text-white/60 text-sm font-medium mb-4">
                    Tracks
                  </h3>
                  <div className="space-y-2">
                    {results.tracks.map((track) => (
                      <div
                        key={track.id}
                        data-search-item={`track-${track.id}`}
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer group ${
                          selectedItem?.type === "track" &&
                          selectedItem.id === track.id
                            ? "bg-white/10"
                            : "hover:bg-white/10"
                        }`}
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
                              {track.artistName} • {track.genre}
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
