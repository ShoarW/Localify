import { useEffect, useState } from "react";
import { HomeContent, Playlist, Track, api } from "../../services/api";
import { AlbumCard } from "./album-card";
import { TrackItem } from "./track-item";

interface MainContentProps {
  onPlayTrack: (tracks: Track[], startIndex: number) => void;
  playlists: Playlist[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
  currentTrackId: number | null;
  isPlaying: boolean;
}

export const MainContent = ({
  onPlayTrack,
  playlists,
  onPlaylistsChange,
  currentTrackId,
  isPlaying,
}: MainContentProps) => {
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleReactionUpdate = (
    trackId: number,
    newReaction: "like" | "dislike" | null
  ) => {
    if (!homeContent) return;

    setHomeContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        quickPicks: prev.quickPicks.map((track) =>
          track.id === trackId ? { ...track, reaction: newReaction } : track
        ),
        listenAgain: prev.listenAgain.map((track) =>
          track.id === trackId ? { ...track, reaction: newReaction } : track
        ),
      };
    });
  };

  useEffect(() => {
    const fetchHomeContent = async () => {
      try {
        const content = await api.getHomeContent({
          newReleasesLimit: 10,
          quickPicksLimit: 10,
          listenAgainLimit: 10,
        });
        setHomeContent(content);
      } catch (error) {
        console.error("Failed to fetch home content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeContent();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-white/5 rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-white/5 rounded-xl" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!homeContent) return null;

  return (
    <div className="min-h-full backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="p-8 space-y-8 pb-24">
        {/* New Releases Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">New Releases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {homeContent.newReleases.map((release) => (
              <AlbumCard
                key={release.id}
                album={{
                  id: release.id,
                  title: release.title,
                  artist: release.artist || "Various Artists",
                  hasImage: release.hasImage,
                  year: null,
                  artistId: 0,
                  trackCount: 0,
                  createdAt: "",
                  updatedAt: null,
                }}
                onPlay={async () => {
                  try {
                    const albumData = await api.getAlbum(release.id);
                    onPlayTrack(albumData.tracks, 0);
                  } catch (error) {
                    console.error("Failed to play album:", error);
                  }
                }}
              />
            ))}
          </div>
        </section>

        {/* Quick Picks Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Quick Picks</h2>
          <div className="bg-white/5 rounded-xl overflow-hidden">
            {homeContent.quickPicks.map((track, index) => (
              <TrackItem
                key={track.id}
                track={track}
                onClick={() => onPlayTrack(homeContent.quickPicks, index)}
                playlists={playlists}
                onPlaylistsChange={onPlaylistsChange}
                isActive={currentTrackId === track.id}
                isPlaying={isPlaying && currentTrackId === track.id}
                showArt={true}
                onReactionUpdate={handleReactionUpdate}
              />
            ))}
          </div>
        </section>

        {/* Listen Again Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">
            Listen Again
            <span className="text-sm text-white/40 font-normal ml-2">
              Recently played tracks
            </span>
          </h2>
          <div className="space-y-1">
            {homeContent.listenAgain.map((track, index) => (
              <div key={track.id} className="relative">
                <TrackItem
                  track={track}
                  onClick={() => onPlayTrack(homeContent.listenAgain, index)}
                  playlists={playlists}
                  onPlaylistsChange={onPlaylistsChange}
                  isActive={currentTrackId === track.id}
                  isPlaying={isPlaying && currentTrackId === track.id}
                  onReactionUpdate={handleReactionUpdate}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
