import { Album } from "../../services/api";
import { api } from "../../services/api";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { PlaceholderImage } from "./placeholder-image";
import { useTheme } from "../../contexts/theme-context";

interface AlbumCardProps {
  album: Album;
  onPlay?: () => void;
}

export const AlbumCard = ({ album, onPlay }: AlbumCardProps) => {
  const { gradientFrom, gradientTo } = useTheme();

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPlay?.();
  };

  return (
    <Link
      to={`/albums/${album.id}`}
      className="group relative flex flex-col gap-4 p-4 bg-black/20 hover:bg-black/40 rounded-lg transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <div
          className={`absolute -inset-1 rounded-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-20 blur transition-all duration-300`}
        />
        <PlaceholderImage
          type="album"
          id={album.id}
          hasImage={album.hasImage}
          size="xl"
          className="w-full h-full"
        />
        {onPlay && (
          <button
            onClick={handlePlayClick}
            className={`absolute right-2 bottom-2 w-10 h-10 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} hover:opacity-90 flex items-center justify-center transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-xl`}
          >
            <Play className="w-5 h-5 text-white" fill="white" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-white font-medium truncate">{album.title}</h3>
        <p className="text-white/60 text-sm truncate">{album.artist}</p>
        <p className="text-white/40 text-sm">{album.year}</p>
      </div>
    </Link>
  );
};
