import {
  Music,
  Home,
  Search,
  PlusCircle,
  Heart,
  Disc,
  LogOut,
  User,
  ListMusic,
  X,
} from "lucide-react";
import { NavItem } from "./nav-item";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { getUser } from "../../utils/auth";
import { Playlist } from "../../services/api";
import { SearchContext } from "../../App";
import { useTheme } from "../../contexts/theme-context";

interface UserData {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface SidebarProps {
  playlists: Playlist[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ playlists, isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const { openSearch } = useContext(SearchContext);
  const { gradientFrom, gradientTo } = useTheme();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        openSearch();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [openSearch]);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      if (userData) {
        setUser({
          id: userData.id,
          username: userData.username,
          isAdmin: userData.isAdmin,
        });
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    navigate("/auth/login");
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const menuButton = document.getElementById("menu-button");
      if (
        isOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        menuButton &&
        !menuButton.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div
      id="sidebar"
      className={`fixed md:relative w-64 h-full backdrop-blur-2xl bg-gradient-to-b from-white/10 to-white/5 border-r border-white/10 flex flex-col overflow-hidden z-50 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo}`}
              >
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xl font-bold tracking-wider">
                Localify
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors md:hidden"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="space-y-2 mb-8">
            <NavItem icon={<Home />} label="Home" to="/" onClick={onClose} />
            <NavItem
              icon={<Search />}
              label="Search"
              onClick={() => {
                openSearch();
                onClose();
              }}
              shortcut="⌃ Space"
            />
            <NavItem
              icon={<Disc />}
              label="Albums"
              to="/albums"
              onClick={onClose}
            />
            <NavItem
              icon={<User />}
              label="Artists"
              to="/artists"
              onClick={onClose}
            />
          </div>

          <div className="space-y-2">
            <Link
              to="/playlists"
              className="w-full px-4 py-3 rounded-xl transition-all duration-300 text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 flex items-center gap-2"
              onClick={onClose}
            >
              <PlusCircle size={20} />
              <span className="font-medium">Create Playlist</span>
            </Link>
            <NavItem
              icon={<Heart className="text-red-500 fill-red-500" />}
              label="Liked Songs"
              to="/liked-music"
              onClick={onClose}
            />
          </div>
        </div>

        <div className="px-2">
          <div className="space-y-1 p-4">
            <p className="text-white/40 text-sm px-4 mb-4">PLAYLISTS</p>
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlists/${playlist.id}`}
                className="px-4 py-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 flex items-center gap-2 group"
                onClick={onClose}
              >
                <ListMusic className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                <p className="text-white/70 group-hover:text-white text-sm truncate">
                  {playlist.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {user && (
        <div className="p-4 border-t border-white/10">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            onClick={onClose}
          >
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center`}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user.username}</p>
              {user.isAdmin && (
                <p className="text-white/60 text-sm truncate">Admin</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
              }}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-white/60 hover:text-white" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};
