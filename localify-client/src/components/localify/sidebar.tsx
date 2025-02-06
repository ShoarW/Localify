import {
  Music,
  Home,
  Search,
  Library,
  PlusCircle,
  Heart,
  Disc,
  LogOut,
  User,
  ListMusic,
} from "lucide-react";
import { NavItem } from "./nav-item";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { getUser } from "../../utils/auth";
import { Playlist, api } from "../../services/api";
import { SearchContext } from "../../App";

interface UserData {
  id: number;
  username: string;
  isAdmin: boolean;
}

export const Sidebar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { openSearch } = useContext(SearchContext);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault(); // Prevent default browser behavior
        openSearch();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [openSearch]);

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await api.getPlaylists();
        setPlaylists(data);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      }
    };

    if (user) {
      fetchPlaylists();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/auth/login");
  };

  return (
    <div className="w-64 h-full backdrop-blur-2xl bg-gradient-to-b from-white/10 to-white/5 border-r border-white/10 flex flex-col overflow-hidden">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-wider">
            Localify
          </span>
        </Link>

        <div className="space-y-2 mb-8">
          <NavItem icon={<Home />} label="Home" to="/" />
          <NavItem
            icon={<Search />}
            label="Search"
            onClick={openSearch}
            shortcut="⌃ Space"
          />
          {/* <NavItem icon={<Library />} label="Your Library" /> */}
          <NavItem icon={<Disc />} label="Albums" to="/albums" />
          <NavItem icon={<User />} label="Artists" to="/artists" />
        </div>

        <div className="space-y-2">
          <Link
            to="/playlists"
            className="w-full px-4 py-3 rounded-xl transition-all duration-300 text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 flex items-center gap-2"
          >
            <PlusCircle size={20} />
            <span className="font-medium">Create Playlist</span>
          </Link>
          <NavItem
            icon={<Heart className="text-red-500 fill-red-500" />}
            label="Liked Songs"
            to="/liked-music"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-2">
        <div className="space-y-1 p-4">
          <p className="text-white/40 text-sm px-4 mb-4">PLAYLISTS</p>
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              to={`/playlists/${playlist.id}`}
              className="px-4 py-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 flex items-center gap-2 group"
            >
              <ListMusic className="w-4 h-4 text-white/40 group-hover:text-white/60" />
              <p className="text-white/70 group-hover:text-white text-sm truncate">
                {playlist.name}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {user && (
        <div className="p-4 border-t border-white/10">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user.username}</p>
              {user.isAdmin && (
                <p className="text-red-500/80 text-sm truncate">Admin</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
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
