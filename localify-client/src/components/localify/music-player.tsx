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
  ListMusic,
  X,
  Music,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, Track } from "../../services/api";
import { Link } from "react-router-dom";
import { usePlayer } from "../../hooks/use-player";

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
  const { volume: savedVolume, setVolume: setSavedVolume } = usePlayer();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(savedVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isChangingTrack, setIsChangingTrack] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);

  // Add new state for tracking drag
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Add new state for tracking seek drag
  const [isDraggingTime, setIsDraggingTime] = useState(false);

  // Add state to track temporary time while dragging
  const [tempTime, setTempTime] = useState(0);

  const [showQueue, setShowQueue] = useState(false);
  const queueRef = useRef<HTMLDivElement>(null);
  const queueButtonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside for queue
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !queueRef.current?.contains(event.target as Node) &&
        !queueButtonRef.current?.contains(event.target as Node)
      ) {
        setShowQueue(false);
      }
    };

    if (showQueue) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showQueue]);

  const currentTrack = playlist[currentTrackIndex];

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
    if (isLoading || playlist.length === 0) return;

    let nextIndex: number;
    if (isShuffle) {
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentTrackIndex && playlist.length > 1);
    } else {
      nextIndex = (currentTrackIndex + 1) % playlist.length;
    }
    setCurrentTrackIndex(nextIndex);
  };

  const handlePrevious = () => {
    if (isLoading || playlist.length === 0) return;

    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      const prevIndex =
        currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
    }
  };

  // Handle track changes
  useEffect(() => {
    const loadTrack = async () => {
      if (!currentTrack) return;

      setIsLoading(true);
      setIsChangingTrack(true);

      try {
        audioRef.current.src = api.getTrackStreamUrl(currentTrack.id);
        await audioRef.current.load();

        // Set media session metadata
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album,
            artwork: currentTrack.albumId
              ? [
                  {
                    src: api.getAlbumCoverUrl(currentTrack.albumId),
                    sizes: "96x96",
                    type: "image/jpeg",
                  },
                  {
                    src: api.getAlbumCoverUrl(currentTrack.albumId),
                    sizes: "128x128",
                    type: "image/jpeg",
                  },
                  {
                    src: api.getAlbumCoverUrl(currentTrack.albumId),
                    sizes: "192x192",
                    type: "image/jpeg",
                  },
                  {
                    src: api.getAlbumCoverUrl(currentTrack.albumId),
                    sizes: "256x256",
                    type: "image/jpeg",
                  },
                  {
                    src: api.getAlbumCoverUrl(currentTrack.albumId),
                    sizes: "384x384",
                    type: "image/jpeg",
                  },
                  {
                    src: api.getAlbumCoverUrl(currentTrack.albumId),
                    sizes: "512x512",
                    type: "image/jpeg",
                  },
                ]
              : [],
          });

          // Add media session action handlers
          navigator.mediaSession.setActionHandler("play", () => {
            audioRef.current.play();
            setIsPlaying(true);
          });
          navigator.mediaSession.setActionHandler("pause", () => {
            audioRef.current.pause();
            setIsPlaying(false);
          });
          navigator.mediaSession.setActionHandler(
            "previoustrack",
            handlePrevious
          );
          navigator.mediaSession.setActionHandler("nexttrack", handleNext);
          navigator.mediaSession.setActionHandler("seekto", (details) => {
            if (details.seekTime) {
              audioRef.current.currentTime = details.seekTime;
            }
          });
          navigator.mediaSession.setActionHandler("seekbackward", (details) => {
            const skipTime = details.seekOffset || 10;
            audioRef.current.currentTime = Math.max(
              audioRef.current.currentTime - skipTime,
              0
            );
          });
          navigator.mediaSession.setActionHandler("seekforward", (details) => {
            const skipTime = details.seekOffset || 10;
            audioRef.current.currentTime = Math.min(
              audioRef.current.currentTime + skipTime,
              audioRef.current.duration
            );
          });
        }

        if (isPlaying) {
          try {
            await audioRef.current.play();
          } catch (error) {
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
    const handleEnded = () => {
      if (repeatMode === 2) {
        // Single track repeat
        audio.currentTime = 0;
        audio.play();
      } else if (currentTrackIndex < playlist.length - 1) {
        // Not the last track, go to next
        handleNext();
      } else if (repeatMode === 1) {
        // Last track but playlist repeat is on
        setCurrentTrackIndex(0);
      } else {
        // Last track and no repeat
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrackIndex, playlist.length, repeatMode, handleNext]);

  // Time formatting
  const formatTime = (time: number) => {
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

  // Update reaction states when track changes
  useEffect(() => {
    if (!currentTrack) return;
    setIsLiked(currentTrack.reaction === "like");
    setIsDisliked(currentTrack.reaction === "dislike");
  }, [currentTrack]);

  // Add reaction handlers
  const handleReaction = async (type: "like" | "dislike") => {
    if (!currentTrack || reactionLoading) return;

    setReactionLoading(true);
    try {
      const newType =
        type === "like"
          ? isLiked
            ? null
            : "like"
          : isDisliked
          ? null
          : "dislike";

      const { reaction } = await api.setReaction(currentTrack.id, newType);

      // Update the reaction in the current track
      currentTrack.reaction = reaction;
      setIsLiked(reaction === "like");
      setIsDisliked(reaction === "dislike");
    } catch (error) {
      console.error("Error setting reaction:", error);
    } finally {
      setReactionLoading(false);
    }
  };

  // Add effect to update window title
  useEffect(() => {
    const currentTrack = playlist[currentTrackIndex];
    if (currentTrack && isPlaying) {
      document.title = `${currentTrack.title} - ${currentTrack.album} - Localify`;
    } else {
      document.title = "Localify";
    }
  }, [currentTrackIndex, playlist, isPlaying]);

  // Update audio volume when volume state changes
  useEffect(() => {
    audioRef.current.volume = volume / 100;
    setSavedVolume(volume);
  }, [volume, setSavedVolume]);

  return (
    <div className="h-24 bg-black/30 backdrop-blur-xl border-t border-white/10 flex items-center px-4 relative">
      {/* Track Info Section */}
      <div className="flex items-center gap-4 w-[30%] min-w-[180px] md:w-[30%]">
        {currentTrack ? (
          <>
            <Link
              to={`/albums/${currentTrack.albumId}`}
              className={`relative group transition-transform duration-300 ${
                isChangingTrack
                  ? "scale-90 opacity-50"
                  : "scale-100 opacity-100"
              }`}
            >
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
              <div className="relative w-14 h-14 rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
                {currentTrack.albumId ? (
                  <img
                    src={api.getAlbumCoverUrl(currentTrack.albumId)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement?.classList.add(
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                      const icon = document.createElement("div");
                      icon.innerHTML =
                        '<svg class="w-6 h-6 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
                      target.parentElement?.appendChild(icon);
                    }}
                  />
                ) : (
                  <Music className="w-6 h-6 text-white/40" />
                )}
              </div>
            </Link>
            <div
              className={`min-w-0 transition-opacity duration-300 ${
                isChangingTrack ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentTrack.title}
                </p>
                <Link
                  to={`/artists/${currentTrack.artistId}`}
                  className="text-sm text-white/60 truncate hover:text-white transition-colors"
                >
                  {currentTrack.artistName}
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <ThumbsUp
                className={`w-5 h-5 cursor-pointer transition-all duration-300 hover:scale-110 ${
                  isLiked ? "text-green-500 fill-green-500" : "text-white/60"
                } ${reactionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleReaction("like")}
              />
              <ThumbsDown
                className={`w-5 h-5 cursor-pointer transition-all duration-300 hover:scale-110 ${
                  isDisliked ? "text-red-500 fill-red-500" : "text-white/60"
                } ${reactionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleReaction("dislike")}
              />
            </div>
          </>
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <Music className="w-6 h-6 text-white/40" />
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center gap-6">
          <Shuffle
            className={`w-5 h-5 cursor-pointer transition-all duration-300 hidden md:block ${
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
              <Pause className="w-4 h-4 text-white" fill="white" />
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
            className={`w-5 h-5 cursor-pointer transition-all duration-300 hidden md:block ${
              repeatMode === 0
                ? "text-white/60 hover:text-white"
                : repeatMode === 1
                ? "text-red-500 scale-110"
                : "text-red-500 scale-110"
            }`}
            onClick={() => setRepeatMode((prev) => (prev + 1) % 3)}
          />
        </div>
        <div className="flex items-center gap-2 w-full max-w-md px-2">
          <span className="text-xs text-white/40 hidden md:block">
            {formatTime(currentTime)}
          </span>
          <div
            className="group relative py-4 -my-4 flex-1"
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
          <span className="text-xs text-white/40 hidden md:block">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume Section */}
      <div className="w-[30%] hidden md:flex justify-end">
        <div className="flex items-center gap-2">
          <button
            ref={queueButtonRef}
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
              showQueue ? "bg-white/10" : ""
            }`}
            title="Show queue"
          >
            <ListMusic className="w-5 h-5 text-white/60" />
          </button>
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
              e.preventDefault();

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

      {/* Queue Overlay */}
      {showQueue && (
        <>
          <div
            ref={queueRef}
            className="absolute right-2 bottom-full mb-2 w-96 max-h-[70vh] bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-xl rounded-t-xl border border-white/10 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-medium">Queue</h3>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-4rem)]">
              <div className="p-2 space-y-1">
                {playlist.map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors ${
                      index === currentTrackIndex ? "bg-white/10" : ""
                    }`}
                    onClick={() => setCurrentTrackIndex(index)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 shrink-0 overflow-hidden flex items-center justify-center">
                      {track.albumId ? (
                        <img
                          src={api.getAlbumCoverUrl(track.albumId)}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement?.classList.add(
                              "flex",
                              "items-center",
                              "justify-center"
                            );
                            const icon = document.createElement("div");
                            icon.innerHTML =
                              '<svg class="w-5 h-5 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
                            target.parentElement?.appendChild(icon);
                          }}
                        />
                      ) : (
                        <Music className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          index === currentTrackIndex
                            ? "text-red-500"
                            : "text-white"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-sm text-white/60 truncate">
                        {track.artistName}
                      </p>
                    </div>
                    {index === currentTrackIndex && isPlaying && (
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Glossy Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5" />
      </div>
    </div>
  );
};
