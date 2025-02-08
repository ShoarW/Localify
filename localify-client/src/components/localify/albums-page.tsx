import { Album, api } from "../../services/api";
import { AlbumCard } from "./album-card";
import { InfiniteGridPage } from "./infinite-grid-page";

interface AlbumsPageProps {
  onPlayAlbum?: (albumId: number) => void;
}

export const AlbumsPage = ({ onPlayAlbum }: AlbumsPageProps) => {
  return (
    <InfiniteGridPage<Album>
      title="Albums"
      fetchItems={api.getAlbums}
      renderItem={(album) => (
        <AlbumCard
          album={album}
          onPlay={onPlayAlbum ? () => onPlayAlbum(album.id) : undefined}
        />
      )}
    />
  );
};
