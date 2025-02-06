import { useEffect, useState } from "react";
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
import { api, Track } from "./services/api";

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
    <div className="relative h-screen bg-black flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      <div
        className="relative flex flex-1 overflow-hidden"
        style={{ fontFamily: "'Josefin Sans', sans-serif" }}
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
          <Route path="/albums" element={<AlbumsPage />} />
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
        </Routes>
      </div>
      <MusicPlayer
        playlist={currentPlaylist}
        currentTrackIndex={currentTrackIndex === -1 ? 0 : currentTrackIndex}
        setCurrentTrackIndex={handleTrackChange}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <link
        href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap"
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
