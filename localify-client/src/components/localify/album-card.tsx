import { Album } from "../../services/api";
import { api } from "../../services/api";
import { Link } from "react-router-dom";
import { Music } from "lucide-react";

interface AlbumCardProps {
  album: Album;
}

export const AlbumCard = ({ album }: AlbumCardProps) => {
  return (
    <Link
      to={`/albums/${album.id}`}
      className="group relative flex flex-col gap-4 p-4 bg-black/20 hover:bg-black/40 rounded-lg transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
        {album.coverPath ? (
          <img
            src={api.getAlbumCoverUrl(album.id)}
            alt={album.title}
            loading="lazy"
            className="w-full h-full object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <Music className="w-12 h-12 text-white/40" />
          </div>
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
