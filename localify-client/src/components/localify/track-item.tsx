import { Play, Pause, ThumbsUp, ThumbsDown } from "lucide-react";
import { ReactionType } from "../../services/api";

interface TrackItemProps {
  title: string;
  artist: string;
  duration: number;
  isPlaying?: boolean;
  isActive?: boolean;
  reaction: ReactionType;
  onClick?: () => void;
}

export const TrackItem = ({
  title,
  artist,
  duration,
  isPlaying,
  isActive,
  reaction,
  onClick,
}: TrackItemProps) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`group px-4 py-3 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 hover:backdrop-blur-xl cursor-pointer ${
        isActive ? "bg-white/10 border-white/10" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 flex items-center justify-center">
          {isActive ? (
            isPlaying ? (
              <div className="w-4 h-4 rounded-sm bg-gradient-to-r from-red-500 to-rose-600 animate-pulse" />
            ) : (
              <Pause className="w-4 h-4 text-white" fill="white" />
            )
          ) : (
            <Play
              className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              fill="white"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              isActive
                ? "text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600"
                : "text-white"
            }`}
          >
            {title}
          </p>
          <p className="text-sm text-white/60 truncate">{artist}</p>
        </div>
        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {reaction === "like" && (
            <ThumbsUp className="w-4 h-4 text-green-500 fill-green-500" />
          )}
          {reaction === "dislike" && (
            <ThumbsDown className="w-4 h-4 text-red-500 fill-red-500" />
          )}
          <span className="text-sm text-white/60 w-12 text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
