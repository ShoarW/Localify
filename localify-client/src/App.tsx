import { useEffect, useState } from "react";
import "./App.css";
import { MainContent } from "./components/localify/main-content";
import { MusicPlayer } from "./components/localify/music-player";
import { Sidebar } from "./components/localify/sidebar";
import { api, Track } from "./services/api";

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch tracks when component mounts
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const fetchedTracks = await api.getTracks();
        setTracks(fetchedTracks);
      } catch (error) {
        console.error("Failed to fetch tracks:", error);
      }
    };

    fetchTracks();
  }, []);

  return (
    <>
      <div className="relative h-screen bg-black flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
        <link
          href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <div
          className="relative flex flex-1 overflow-hidden"
          style={{ fontFamily: "'Josefin Sans', sans-serif" }}
        >
          <Sidebar />
          <MainContent
            tracks={tracks}
            currentTrackIndex={currentTrackIndex}
            isPlaying={isPlaying}
            onTrackSelect={(index: number) => {
              setCurrentTrackIndex(index);
              setIsPlaying(true);
            }}
          />
        </div>
        <MusicPlayer
          playlist={tracks}
          currentTrackIndex={currentTrackIndex}
          setCurrentTrackIndex={setCurrentTrackIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      </div>
    </>
  );
}

export default App;
