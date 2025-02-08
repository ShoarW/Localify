import { Link, Outlet, useLocation } from "react-router-dom";
import { Database, Disc, User, Music } from "lucide-react";

const tabs = [
  {
    label: "Tracks",
    icon: <Music className="w-4 h-4" />,
    path: "/admin/tracks",
  },
  {
    label: "Artists",
    icon: <User className="w-4 h-4" />,
    path: "/admin/artists",
  },
  {
    label: "Albums",
    icon: <Disc className="w-4 h-4" />,
    path: "/admin/albums",
  },
  {
    label: "Users",
    icon: <Database className="w-4 h-4" />,
    path: "/admin/users",
  },
];

export const AdminLayout = () => {
  const location = useLocation();

  return (
    <div className="flex-1 h-full overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>

        <div className="flex items-center gap-2 mb-8 bg-white/5 p-1 rounded-xl">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>

        <Outlet />
      </div>
    </div>
  );
};
