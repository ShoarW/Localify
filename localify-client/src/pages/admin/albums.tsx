import { useEffect, useState } from "react";
import { api, AdminAlbum } from "../../services/api";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PagedAlbums {
  albums: AdminAlbum[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export const AdminAlbumsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [albumsData, setAlbumsData] = useState<PagedAlbums | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("size") || "50");

  useEffect(() => {
    const fetchAlbums = async () => {
      setIsLoading(true);
      try {
        const data = await api.getPagedAlbums(currentPage, pageSize);
        setAlbumsData(data);
      } catch (error) {
        console.error("Failed to fetch albums:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString(), size: pageSize.toString() });
  };

  const renderPaginationNumbers = () => {
    if (!albumsData) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(
      albumsData.totalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

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

    if (endPage < albumsData.totalPages) {
      if (endPage < albumsData.totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2 text-white/60">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={albumsData.totalPages}
          onClick={() => handlePageChange(albumsData.totalPages)}
          className="px-3 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          {albumsData.totalPages}
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
                Year
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                Track Count
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                Has Image
              </th>
            </tr>
          </thead>
          <tbody>
            {albumsData?.albums.map((album) => (
              <tr
                key={album.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-white/60">{album.id}</td>
                <td className="px-6 py-4">
                  <Link
                    to={`/albums/${album.id}`}
                    className="text-white hover:text-white/80 transition-colors"
                  >
                    {album.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  {album.artistId ? (
                    <Link
                      to={`/artists/${album.artistId}`}
                      className="text-white hover:text-white/80 transition-colors"
                    >
                      {album.artistName || "Unknown"}
                    </Link>
                  ) : (
                    <span className="text-white/60">Unknown</span>
                  )}
                </td>
                <td className="px-6 py-4 text-white">
                  {album.year || "Unknown"}
                </td>
                <td className="px-6 py-4 text-white">{album.trackCount}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      album.hasImage
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {album.hasImage ? "Yes" : "No"}
                  </span>
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
            Page {albumsData?.currentPage} of {albumsData?.totalPages}
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
              disabled={!albumsData || currentPage === albumsData.totalPages}
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
  );
};
