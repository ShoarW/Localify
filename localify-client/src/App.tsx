import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { MainContent } from "./components/localify/main-content";
import { MusicPlayer } from "./components/localify/music-player";
import { Sidebar } from "./components/localify/sidebar";
import { AlbumsPage } from "./components/localify/albums-page";
import { AlbumPage } from "./components/localify/album-page";
import { LoginPage } from "./pages/auth/login";
import { RegisterPage } from "./pages/auth/register";
import { ProfilePage } from "./pages/profile";
import { LikedMusicPage } from "./pages/liked-music";
import { PlaylistsPage } from "./pages/playlists";
import { PlaylistPage } from "./pages/playlist";
import { api, Track, Playlist } from "./services/api";
import { SearchModal } from "./components/localify/search-modal";
import React from "react";
import { ArtistsPage } from "./components/localify/artists-page";
import { ArtistPage } from "./components/localify/artist-page";
import { getUser } from "./utils/auth";
import { PlayerProvider } from "./hooks/use-player";
import { Menu } from "lucide-react";

// Create a context for the search modal
export const SearchContext = React.createContext<{
  openSearch: () => void;
  closeSearch: () => void;
}>({
  openSearch: () => {},
  closeSearch: () => {},
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// App Layout component
const AppLayout = () => {
  // All available tracks
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  // Current playlist being played
  const [currentPlaylist, setCurrentPlaylist] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Add playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Add playlist fetching effect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchPlaylists = async () => {
      try {
        const data = await api.getPlaylists();
        setPlaylists(data);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      } finally {
        setIsPlaylistsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  // Find the current track and its index in the current playlist
  const currentTrackIndex = currentPlaylist.findIndex(
    (track) => track.id === currentTrackId
  );

  // Global playback handlers
  const handlePlayTrack = (newTracks: Track[], startIndex: number) => {
    setCurrentPlaylist(newTracks);
    setCurrentTrackId(newTracks[startIndex].id);
    setIsPlaying(true);
  };

  const handleTrackChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < currentPlaylist.length) {
      setCurrentTrackId(currentPlaylist[newIndex].id);
    }
  };

  return (
    <SearchContext.Provider
      value={{
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
      }}
    >
      <div className="relative h-screen bg-black flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
        <div
          className="relative flex flex-1 overflow-hidden"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {/* Mobile Menu Button */}
          <button
            id="menu-button"
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          <Sidebar
            playlists={playlists}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 relative h-full overflow-hidden md:ml-0">
            <div className="absolute inset-0 overflow-y-auto">
              <Routes>
                <Route
                  path="/"
                  element={
                    <MainContent
                      onPlayTrack={handlePlayTrack}
                      playlists={playlists}
                      onPlaylistsChange={setPlaylists}
                      currentTrackId={currentTrackId}
                      isPlaying={isPlaying}
                    />
                  }
                />
                <Route
                  path="/albums"
                  element={
                    <AlbumsPage
                      onPlayAlbum={async (albumId) => {
                        try {
                          const albumData = await api.getAlbum(albumId);
                          handlePlayTrack(albumData.tracks, 0);
                        } catch (error) {
                          console.error("Failed to play album:", error);
                        }
                      }}
                    />
                  }
                />
                <Route
                  path="/albums/:id"
                  element={
                    <AlbumPage
                      currentTrackId={currentTrackId}
                      isPlaying={isPlaying}
                      onPlayAlbum={handlePlayTrack}
                      playlists={playlists}
                      onPlaylistsChange={setPlaylists}
                    />
                  }
                />
                <Route path="/artists" element={<ArtistsPage />} />
                <Route
                  path="/artists/:id"
                  element={
                    <ArtistPage
                      currentTrackId={currentTrackId}
                      isPlaying={isPlaying}
                      onPlayTrack={handlePlayTrack}
                      playlists={playlists}
                      onPlaylistsChange={setPlaylists}
                    />
                  }
                />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/liked-music"
                  element={
                    <LikedMusicPage
                      currentTrackId={currentTrackId}
                      isPlaying={isPlaying}
                      onPlayTrack={handlePlayTrack}
                      playlists={playlists}
                      onPlaylistsChange={setPlaylists}
                    />
                  }
                />
                <Route
                  path="/playlists"
                  element={
                    <PlaylistsPage
                      playlists={playlists}
                      isLoading={isPlaylistsLoading}
                      onPlaylistsChange={setPlaylists}
                    />
                  }
                />
                <Route
                  path="/playlists/:id"
                  element={
                    <PlaylistPage
                      currentTrackId={currentTrackId}
                      isPlaying={isPlaying}
                      onPlayTrack={handlePlayTrack}
                      playlists={playlists}
                      onPlaylistsChange={setPlaylists}
                    />
                  }
                />
              </Routes>
            </div>
          </div>
        </div>
        <MusicPlayer
          playlist={currentPlaylist}
          currentTrackIndex={currentTrackIndex === -1 ? 0 : currentTrackIndex}
          setCurrentTrackIndex={handleTrackChange}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onPlayTrack={(track) => {
            handlePlayTrack([track], 0);
          }}
        />
      </div>
    </SearchContext.Provider>
  );
};

function App() {
  return (
    <Router>
      <PlayerProvider>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </PlayerProvider>
    </Router>
  );
}

export default App;
