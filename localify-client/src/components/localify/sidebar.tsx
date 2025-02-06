import { Music, Home, Search, Library, PlusCircle, Heart } from "lucide-react";
import { NavItem } from "./nav-item";

export const Sidebar = () => {
  return (
    <div className="w-64 h-full backdrop-blur-2xl bg-gradient-to-b from-white/10 to-white/5 border-r border-white/10 flex flex-col overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-wider">
            Localify
          </span>
        </div>

        <div className="space-y-2 mb-8">
          <NavItem icon={<Home />} label="Home" isActive />
          <NavItem icon={<Search />} label="Search" />
          <NavItem icon={<Library />} label="Your Library" />
        </div>

        <div className="space-y-2">
          <button className="w-full px-4 py-3 rounded-xl transition-all duration-300 text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 flex items-center gap-2">
            <PlusCircle size={20} />
            <span className="font-medium">Create Playlist</span>
          </button>
          <button className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl border border-white/10 flex items-center gap-2">
            <Heart size={20} className="text-red-500 fill-red-500" />
            <span className="font-medium text-white">Liked Songs</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1 p-4">
          <p className="text-white/40 text-sm px-4 mb-4">PLAYLISTS</p>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 cursor-pointer"
            >
              <p className="text-white/70 hover:text-white text-sm">
                My Playlist #{i + 1}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
