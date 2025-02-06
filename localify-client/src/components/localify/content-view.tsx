import { Play } from "lucide-react";
import { Track } from "../../services/api";
import { TrackItem } from "./track-item";

interface ContentViewProps {
  title: string;
  subtitle: string;
  coverImage: string;
  artist: string;
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onTrackSelect: (index: number) => void;
}

export const ContentView = ({
  title,
  subtitle,
  coverImage,
  artist,
  tracks,
  currentTrackIndex,
  isPlaying,
  onTrackSelect,
}: ContentViewProps) => {
  return (
    <div className="flex-1 overflow-y-auto backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-end gap-6 mb-8">
          <div className="relative group">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
            <img
              src={coverImage}
              alt={title}
              className="relative w-60 h-60 rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
              <button
                className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                onClick={() => {
                  if (tracks.length > 0) {
                    onTrackSelect(0);
                  }
                }}
              >
                <Play className="w-8 h-8 text-white" fill="white" />
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 opacity-5 blur-2xl" />
            <div className="relative">
              <p className="text-white/60 text-sm font-medium mb-2">
                {subtitle}
              </p>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 mb-6">
                {title}
              </h1>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <img
                  src={coverImage}
                  alt={artist}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-white font-medium">{artist}</span>
                <span>• {tracks.length} songs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-1">
          {tracks.map((track, index) => (
            <TrackItem
              key={track.id}
              title={track.title}
              artist={track.artist}
              duration={Math.floor(track.duration)}
              isActive={currentTrackIndex === index}
              isPlaying={currentTrackIndex === index && isPlaying}
              onClick={() => onTrackSelect(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
