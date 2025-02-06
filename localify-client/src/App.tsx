import { useState } from "react";
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
import { api, Track } from "./services/api";
import { SearchModal } from "./components/localify/search-modal";
import React from "react";
import { ArtistsPage } from "./components/localify/artists-page";
import { ArtistPage } from "./components/localify/artist-page";

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
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          <Sidebar />
          <Routes>
            <Route
              path="/"
              element={
                <MainContent
                  tracks={allTracks}
                  currentTrackIndex={currentTrackIndex}
                  isPlaying={isPlaying}
                  onTrackSelect={(index: number) => {
                    setCurrentPlaylist(allTracks);
                    setCurrentTrackId(allTracks[index].id);
                    setIsPlaying(true);
                  }}
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
                />
              }
            />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route
              path="/playlists/:id"
              element={
                <PlaylistPage
                  currentTrackId={currentTrackId}
                  isPlaying={isPlaying}
                  onPlayTrack={handlePlayTrack}
                />
              }
            />
          </Routes>
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
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap"
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
    </Router>
  );
}

export default App;
