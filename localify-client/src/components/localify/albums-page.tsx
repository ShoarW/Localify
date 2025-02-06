import { useEffect, useState } from "react";
import { Album, api } from "../../services/api";
import { AlbumCard } from "./album-card";

interface AlbumsPageProps {
  onPlayAlbum?: (albumId: number) => void;
}

export const AlbumsPage = ({ onPlayAlbum }: AlbumsPageProps) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const data = await api.getAlbums();
        setAlbums(data);
      } catch (error) {
        console.error("Failed to fetch albums:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8  overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Albums</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onPlay={onPlayAlbum ? () => onPlayAlbum(album.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
};
