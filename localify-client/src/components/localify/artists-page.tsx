import { useEffect, useState } from "react";
import { Artist, api } from "../../services/api";
import { ArtistCard } from "./artist-card";

export const ArtistsPage = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await api.getArtists();
        setArtists(data);
      } catch (error) {
        console.error("Failed to fetch artists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Artists</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </div>
  );
};
