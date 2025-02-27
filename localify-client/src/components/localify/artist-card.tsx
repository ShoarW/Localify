import { Artist } from "../../services/api";
import { api } from "../../services/api";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { useTheme } from "../../contexts/theme-context";

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard = ({ artist }: ArtistCardProps) => {
  const { gradientFrom, gradientTo } = useTheme();

  return (
    <Link
      to={`/artists/${artist.id}`}
      className="group relative flex flex-col gap-4 p-4 bg-black/20 hover:bg-black/40 rounded-lg transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <div
          className={`absolute -inset-1 rounded-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-20 blur transition-all duration-300`}
        />
        {artist.hasImage ? (
          <img
            src={api.getArtistImageUrl(artist.id)}
            alt={artist.name}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <User className="w-12 h-12 text-white/40" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-white font-medium truncate">{artist.name}</h3>
        {artist.description && (
          <p className="text-white/40 text-sm line-clamp-2">
            {artist.description}
          </p>
        )}
      </div>
    </Link>
  );
};
