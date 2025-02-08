import { useEffect, useState } from "react";
import { api, AdminUser } from "../../services/api";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PagedUsers {
  users: AdminUser[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export const AdminUsersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [usersData, setUsersData] = useState<PagedUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("size") || "50");

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await api.getPagedUsers(currentPage, pageSize);
        setUsersData(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString(), size: pageSize.toString() });
  };

  const renderPaginationNumbers = () => {
    if (!usersData) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(
      usersData.totalPages,
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

    if (endPage < usersData.totalPages) {
      if (endPage < usersData.totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2 text-white/60">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={usersData.totalPages}
          onClick={() => handlePageChange(usersData.totalPages)}
          className="px-3 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          {usersData.totalPages}
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
                Username
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                Playlists
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                Tracks
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                Admin
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-white/60">
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {usersData?.users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-white/60">{user.id}</td>
                <td className="px-6 py-4 text-white">{user.username}</td>
                <td className="px-6 py-4 text-white">{user.email}</td>
                <td className="px-6 py-4 text-white">{user.playlistCount}</td>
                <td className="px-6 py-4 text-white">{user.trackCount}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isAdmin
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {user.isAdmin ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-6 py-4 text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
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
            Page {usersData?.currentPage} of {usersData?.totalPages}
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
              disabled={!usersData || currentPage === usersData.totalPages}
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
