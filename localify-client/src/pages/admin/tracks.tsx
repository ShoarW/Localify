import { useEffect, useState } from "react";
import { api, Track } from "../../services/api";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

interface AdminTrack {
  id: number;
  title: string | null;
  albumId: number | null;
  albumTitle: string | null;
  artistId: number | null;
  artistName: string | null;
  isEmbedded: boolean;
}

interface PagedTracks {
  tracks: AdminTrack[];
  total: number;
  currentPage: number;
  totalPages: number;
}

interface AdminTracksPageProps {
  onPlayTrack?: (tracks: Track[], startIndex: number) => void;
}

export const AdminTracksPage = ({ onPlayTrack }: AdminTracksPageProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tracksData, setTracksData] = useState<PagedTracks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayLoading, setIsPlayLoading] = useState<number | null>(null);

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("size") || "50");

  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoading(true);
      try {
        const data = await api.getPagedTracks(currentPage, pageSize);
        setTracksData(data);
      } catch (error) {
        console.error("Failed to fetch tracks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString(), size: pageSize.toString() });
  };

  const handlePlayTrack = async (trackId: number) => {
    if (!onPlayTrack || isPlayLoading) return;

    setIsPlayLoading(trackId);
    try {
      const track = await api.getTrackById(trackId);
      onPlayTrack([track], 0);
    } catch (error) {
      console.error("Failed to play track:", error);
    } finally {
      setIsPlayLoading(null);
    }
  };

  const renderPaginationNumbers = () => {
    if (!tracksData) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(
      tracksData.totalPages,
      startPage + maxVisiblePages - 1
    );

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page if not included
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-2 text-white/60">
            ...
          </span>
        );
      }
    }

    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-lg transition-colors ${
            i === currentPage
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          {i}
        </button>
      );
    }

    // Add last page if not included
    if (endPage < tracksData.totalPages) {
      if (endPage < tracksData.totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2 text-white/60">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={tracksData.totalPages}
          onClick={() => handlePageChange(tracksData.totalPages)}
          className="px-3 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          {tracksData.totalPages}
        </button>
      );
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Track Management</h1>
          <div className="flex items-center gap-4">
            <span className="text-white/60">
              {tracksData?.total ?? 0} tracks total
            </span>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                    Artist
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                    Album
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                    Embedded
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tracksData?.tracks.map((track) => (
                  <tr
                    key={track.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white/60">
                      {track.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        {track.title || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {track.artistId ? (
                        <Link
                          to={`/artists/${track.artistId}`}
                          className="text-white hover:text-white/80 transition-colors"
                        >
                          {track.artistName || "Unknown"}
                        </Link>
                      ) : (
                        <span className="text-white/60">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {track.albumId ? (
                        <Link
                          to={`/albums/${track.albumId}`}
                          className="text-white hover:text-white/80 transition-colors"
                        >
                          {track.albumTitle || "Unknown"}
                        </Link>
                      ) : (
                        <span className="text-white/60">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          track.isEmbedded
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {track.isEmbedded ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handlePlayTrack(track.id)}
                        disabled={isPlayLoading === track.id}
                        className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {isPlayLoading === track.id ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Play className="w-5 h-5 group-hover:text-red-500" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                Page {tracksData?.currentPage} of {tracksData?.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    !tracksData || currentPage === tracksData.totalPages
                  }
                  className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              {renderPaginationNumbers()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
