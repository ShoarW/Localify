import { Artist, api } from "../../services/api";
import { ArtistCard } from "./artist-card";
import { InfiniteGridPage } from "./infinite-grid-page";

export const ArtistsPage = () => {
  return (
    <InfiniteGridPage<Artist>
      title="Artists"
      fetchItems={api.getArtists}
      renderItem={(artist) => <ArtistCard artist={artist} />}
    />
  );
};
