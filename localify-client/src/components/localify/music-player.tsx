import {
  Heart,
  Shuffle,
  SkipBack,
  Pause,
  Play,
  SkipForward,
  RepeatIcon,
  VolumeX,
  Volume1,
  Volume2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, Track } from "../../services/api";

// Add these props to the MusicPlayer component
interface MusicPlayerProps {
  playlist: Track[];
  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

export const MusicPlayer = ({
  playlist,
  currentTrackIndex,
  setCurrentTrackIndex,
  isPlaying,
  setIsPlaying,
}: MusicPlayerProps) => {
  const audioRef = useRef(new Audio());

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isChangingTrack, setIsChangingTrack] = useState(false);

  // Add new state for tracking drag
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Add new state for tracking seek drag
  const [isDraggingTime, setIsDraggingTime] = useState(false);

  // Add state to track temporary time while dragging
  const [tempTime, setTempTime] = useState(0);

  // Add new state for dislike
  const [isDisliked, setIsDisliked] = useState(false);

  // Add new state for tracking current byte position
  const [currentByte, setCurrentByte] = useState(0);

  const currentTrack = playlist[currentTrackIndex];

  // Handle track changes
  useEffect(() => {
    const loadTrack = async () => {
      if (!currentTrack) return;

      setIsLoading(true);
      setIsChangingTrack(true);

      try {
        // Reset byte position for new track
        setCurrentByte(0);
        audioRef.current.src = api.getTrackStreamUrl(currentTrack.id);
        await audioRef.current.load();

        // Add progress event listener to handle chunked loading
        audioRef.current.addEventListener("progress", async () => {
          const buffered = audioRef.current.buffered;
          if (buffered.length > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            const duration = audioRef.current.duration;

            // If we're close to the end of the buffer, load next chunk
            if (duration - bufferedEnd < 10) {
              try {
                const response = await api.streamTrack(
                  currentTrack.id,
                  currentByte
                );
                const contentRange = response.headers.get("Content-Range");
                if (contentRange) {
                  const [, totalSize] = contentRange.split("/");
                  const nextByte = currentByte + 1 * 1024 * 1024;
                  if (nextByte < parseInt(totalSize)) {
                    setCurrentByte(nextByte);
                  }
                }
              } catch (error) {
                console.error("Error loading next chunk:", error);
              }
            }
          }
        });

        // Set media session metadata
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album,
            artwork: [
              {
                src: currentTrack.cover || "/api/placeholder/56/56",
                sizes: "56x56",
                type: "image/png",
              },
            ],
          });

          // Add media session action handlers
          navigator.mediaSession.setActionHandler("play", togglePlay);
          navigator.mediaSession.setActionHandler("pause", togglePlay);
          navigator.mediaSession.setActionHandler(
            "previoustrack",
            handlePrevious
          );
          navigator.mediaSession.setActionHandler("nexttrack", handleNext);
        }

        if (isPlaying) {
          try {
            await audioRef.current.play();
          } catch (error) {
            console.log("Autoplay prevented:", error);
            setIsPlaying(false);
          }
        }
      } catch (error) {
        console.error("Error loading track:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsChangingTrack(false), 300);
      }
    };

    loadTrack();
  }, [currentTrackIndex, currentTrack]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => handleTrackEnd();

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Track end handling
  const handleTrackEnd = () => {
    if (repeatMode === 2) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeatMode === 1 || currentTrackIndex < playlist.length - 1) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  // Playback controls with loading states
  const togglePlay = async () => {
    if (isLoading) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const handleNext = () => {
    if (isLoading) return;

    setCurrentTrackIndex((prev) => {
      if (isShuffle) {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * playlist.length);
        } while (newIndex === prev && playlist.length > 1);
        return newIndex;
      }
      return (prev + 1) % playlist.length;
    });
  };

  const handlePrevious = () => {
    if (isLoading) return;

    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      setCurrentTrackIndex((prev) =>
        prev === 0 ? playlist.length - 1 : prev - 1
      );
    }
  };

  // Time formatting
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Update the time dragging effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTime) return;

      const timeBar = document.querySelector("[data-time-bar]");
      if (!timeBar) return;

      const rect = timeBar.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const newTime = (x / rect.width) * duration;

      // Update temp time instead of actual time
      setTempTime(newTime);
    };

    const handleMouseUp = () => {
      // Update actual audio time on mouse up
      if (isDraggingTime) {
        audioRef.current.currentTime = tempTime;
        setCurrentTime(tempTime);
      }
      setIsDraggingTime(false);
    };

    if (isDraggingTime) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingTime, duration, tempTime]);

  // Add useEffect to handle global mouse events for volume dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingVolume) return;

      const volumeBar = document.querySelector("[data-volume-bar]");
      if (!volumeBar) return;

      const rect = volumeBar.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const newVolume = Math.round((x / rect.width) * 100);

      setVolume(Math.max(0, Math.min(100, newVolume)));
      audioRef.current.volume = newVolume / 100;
      setIsMuted(newVolume === 0);
    };

    const handleMouseUp = () => {
      setIsDraggingVolume(false);
    };

    if (isDraggingVolume) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingVolume]);

  return (
    <div className="h-24 bg-black/30 backdrop-blur-xl border-t border-white/10 flex items-center px-4 relative">
      {/* Track Info Section */}
      <div className="flex items-center gap-4 w-[30%]">
        <div
          className={`relative group transition-transform duration-300 ${
            isChangingTrack ? "scale-90 opacity-50" : "scale-100 opacity-100"
          }`}
        >
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
          <img
            src={currentTrack?.cover || "https://iili.io/HlHy9Yx.png"}
            alt={currentTrack?.title || "No track selected"}
            className="relative w-14 h-14 rounded-lg shadow-lg"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div
          className={`min-w-0 transition-opacity duration-300 ${
            isChangingTrack ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="text-white text-sm font-medium truncate">
            {currentTrack?.title || "No track selected"}
          </p>
          <p className="text-white/60 text-sm truncate">
            {currentTrack?.artist || ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsUp
            className={`w-5 h-5 cursor-pointer transition-all duration-300 hover:scale-110 ${
              isLiked ? "text-green-500 fill-green-500" : "text-white/60"
            }`}
            onClick={() => {
              setIsLiked(!isLiked);
              if (isDisliked) setIsDisliked(false);
            }}
          />
          <ThumbsDown
            className={`w-5 h-5 cursor-pointer transition-all duration-300 hover:scale-110 ${
              isDisliked ? "text-red-500 fill-red-500" : "text-white/60"
            }`}
            onClick={() => {
              setIsDisliked(!isDisliked);
              if (isLiked) setIsLiked(false);
            }}
          />
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center gap-6">
          <Shuffle
            className={`w-5 h-5 cursor-pointer transition-all duration-300 ${
              isShuffle
                ? "text-red-500 scale-110"
                : "text-white/60 hover:text-white"
            }`}
            onClick={() => setIsShuffle(!isShuffle)}
          />
          <SkipBack
            className={`w-5 h-5 text-white/60 hover:text-white cursor-pointer transition-all duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
            }`}
            onClick={handlePrevious}
          />
          <button
            className={`w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center transition-all duration-300 ${
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-110 hover:opacity-90"
            }`}
            onClick={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" fill="white" />
            )}
          </button>
          <SkipForward
            className={`w-5 h-5 text-white/60 hover:text-white cursor-pointer transition-all duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
            }`}
            onClick={handleNext}
          />
          <RepeatIcon
            className={`w-5 h-5 cursor-pointer transition-all duration-300 ${
              repeatMode === 0
                ? "text-white/60 hover:text-white"
                : repeatMode === 1
                ? "text-red-500 scale-110"
                : "text-red-500 scale-110"
            }`}
            onClick={() => setRepeatMode((prev) => (prev + 1) % 3)}
          />
        </div>
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-white/40">
            {formatTime(currentTime)}
          </span>
          <div
            className="group relative py-4 px-2 -my-4 flex-1"
            onMouseDown={(e) => {
              e.preventDefault();

              const timeBar = e.currentTarget.querySelector("[data-time-bar]");
              if (!timeBar) return;

              const rect = timeBar.getBoundingClientRect();
              const x = Math.max(
                0,
                Math.min(e.clientX - rect.left, rect.width)
              );
              const newTime = (x / rect.width) * duration;

              // Set initial temp time instead of updating audio
              setTempTime(newTime);
              setIsDraggingTime(true);
            }}
          >
            <div
              data-time-bar
              className="h-1 bg-white/10 rounded-full overflow-visible relative cursor-pointer"
            >
              <div
                className="h-full bg-gradient-to-r from-red-500 to-rose-600"
                style={{
                  width: `${
                    ((isDraggingTime ? tempTime : currentTime) / duration) * 100
                  }%`,
                }}
              />
              <div
                className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: `${
                    ((isDraggingTime ? tempTime : currentTime) / duration) * 100
                  }%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 50,
                  opacity: isDraggingTime ? 1 : undefined,
                }}
              />
            </div>
          </div>
          <span className="text-xs text-white/40">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Section */}
      <div className="w-[30%] flex justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              audioRef.current.volume = isMuted ? volume / 100 : 0;
            }}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-white/60" />
            ) : volume < 50 ? (
              <Volume1 className="w-5 h-5 text-white/60" />
            ) : (
              <Volume2 className="w-5 h-5 text-white/60" />
            )}
          </button>
          <div
            id="volume-bar"
            className="group relative py-4 px-2 -my-4 cursor-pointer"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent text selection

              const volumeBar =
                e.currentTarget.querySelector("[data-volume-bar]");
              if (!volumeBar) return;

              const rect = volumeBar.getBoundingClientRect();
              const x = Math.max(
                0,
                Math.min(e.clientX - rect.left, rect.width)
              );
              const newVolume = Math.round((x / rect.width) * 100);
              setVolume(Math.max(0, Math.min(100, newVolume)));
              audioRef.current.volume = newVolume / 100;
              setIsMuted(newVolume === 0);
              setIsDraggingVolume(true);
            }}
          >
            <div
              data-volume-bar
              className="w-24 h-1 bg-white/10 rounded-full overflow-visible relative"
            >
              <div
                className="h-full bg-gradient-to-r from-red-500 to-rose-600"
                style={{ width: `${isMuted ? 0 : volume}%` }}
              />
              <div
                className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: `${isMuted ? 0 : volume}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 50,
                  opacity: isDraggingVolume ? 1 : undefined,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Glossy Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5" />
      </div>
    </div>
  );
};
