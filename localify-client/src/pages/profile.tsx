import { useEffect, useState } from "react";
import { getUser } from "../utils/auth";
import { api, Track } from "../services/api";
import { User, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { ThemePicker } from "../components/localify/theme-picker";
import { useTheme } from "../contexts/theme-context";

interface UserProfile {
  id: number;
  username: string;
  isAdmin: boolean;
  role: string;
}

interface IndexingResults {
  message: string;
  added: Track[];
  removed: Track[];
  unchanged: Track[];
}

interface IndexingProgress {
  type: "scanning" | "processing" | "cleanup";
  total?: number;
  current: number;
  currentFile?: string;
  added: number;
  removed: number;
  unchanged: number;
  status: "progress" | "complete";
}

export const ProfilePage = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingError, setIndexingError] = useState<string | null>(null);
  const [indexingResults, setIndexingResults] =
    useState<IndexingResults | null>(null);
  const [indexingProgress, setIndexingProgress] =
    useState<IndexingProgress | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    added: boolean;
    removed: boolean;
    unchanged: boolean;
  }>({
    added: true,
    removed: false,
    unchanged: false,
  });
  const { gradientFrom, gradientTo } = useTheme();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      if (userData) {
        setUser({
          id: userData.id,
          username: userData.username,
          isAdmin: userData.isAdmin,
          role: userData.isAdmin ? "Administrator" : "User",
        });
      }
    };
    loadUser();
  }, []);

  const handleForceIndex = async () => {
    setIsIndexing(true);
    setIndexingError(null);
    setIndexingResults(null);
    setIndexingProgress(null);

    try {
      await api.forceIndex((update) => {
        setIndexingProgress(update);

        if (
          update.status === "complete" &&
          update.addedTracks &&
          update.removedTracks &&
          update.unchangedTracks
        ) {
          setIndexingResults({
            message: update.message || "Indexing complete",
            added: update.addedTracks,
            removed: update.removedTracks,
            unchanged: update.unchangedTracks,
          });
          setIsIndexing(false);
        }
      });
    } catch (error) {
      console.error("Error:", error);
      setIndexingError("Failed to complete indexing. Please try again.");
      setIsIndexing(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const renderTrackList = (
    tracks: Track[],
    section: keyof typeof expandedSections
  ) => {
    if (!tracks.length) return null;

    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(section)}
          className="flex items-center gap-2 text-white font-medium mb-2 hover:text-white/80 transition-colors"
        >
          {expandedSections[section] ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="capitalize">{section}</span>
          <span className="text-white/60">({tracks.length})</span>
        </button>

        {expandedSections[section] && (
          <div className="space-y-2 ml-6">
            {tracks.map((track) => (
              <div key={track.id} className="bg-white/5 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">
                      {track.title}
                    </p>
                    <p className="text-white/60 truncate">{track.artistName}</p>
                  </div>
                  <span className="text-white/40 shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-2 truncate">
                  {track.albumName}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProgress = () => {
    if (!indexingProgress) return null;

    let progressText = "";
    let progressPercentage = 0;
    let statusColor = "";

    switch (indexingProgress.type) {
      case "scanning":
        progressText = "Scanning music directory...";
        progressPercentage = 0;
        statusColor = `text-${gradientFrom.replace("from-", "")}`;
        break;
      case "processing":
        progressText = `Processing files (${indexingProgress.current}/${indexingProgress.total})`;
        progressPercentage = indexingProgress.total
          ? (indexingProgress.current / indexingProgress.total) * 100
          : 0;
        statusColor = `text-${gradientFrom.replace("from-", "")}`;
        break;
      case "cleanup":
        progressText = `Cleaning up library (${indexingProgress.current}/${indexingProgress.total})`;
        progressPercentage = indexingProgress.total
          ? (indexingProgress.current / indexingProgress.total) * 100
          : 0;
        statusColor = `text-${gradientFrom.replace("from-", "")}`;
        break;
    }

    return (
      <div className="mt-4 space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${statusColor}`}>
                {indexingProgress.type.charAt(0).toUpperCase() +
                  indexingProgress.type.slice(1)}
              </span>
              <span className="text-white/60">{progressText}</span>
            </div>
            <span className="text-white/60">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} transition-all duration-300`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {indexingProgress.currentFile && (
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-sm text-white/60 mb-1">Current File</p>
            <p className="text-sm text-white font-medium truncate">
              {indexingProgress.currentFile}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div
            className={`bg-${gradientFrom.replace(
              "from-",
              ""
            )}/10 rounded-lg p-3`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2 h-2 rounded-full bg-${gradientFrom.replace(
                  "from-",
                  ""
                )}`}
              />
              <p
                className={`text-${gradientFrom.replace(
                  "from-",
                  ""
                )} font-medium`}
              >
                Added
              </p>
            </div>
            <p className="text-2xl text-white">{indexingProgress.added}</p>
          </div>
          <div
            className={`bg-${gradientFrom.replace(
              "from-",
              ""
            )}/10 rounded-lg p-3`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2 h-2 rounded-full bg-${gradientFrom.replace(
                  "from-",
                  ""
                )}`}
              />
              <p
                className={`text-${gradientFrom.replace(
                  "from-",
                  ""
                )} font-medium`}
              >
                Removed
              </p>
            </div>
            <p className="text-2xl text-white">{indexingProgress.removed}</p>
          </div>
          <div
            className={`bg-${gradientFrom.replace(
              "from-",
              ""
            )}/10 rounded-lg p-3`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2 h-2 rounded-full bg-${gradientFrom.replace(
                  "from-",
                  ""
                )}`}
              />
              <p
                className={`text-${gradientFrom.replace(
                  "from-",
                  ""
                )} font-medium`}
              >
                Unchanged
              </p>
            </div>
            <p className="text-2xl text-white">{indexingProgress.unchanged}</p>
          </div>
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

        {/* User Info Panel */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-6">
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center`}
            >
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {user.username}
              </h2>
              <div className="flex flex-col gap-2">
                <span className="text-white/60">ID: {user.id}</span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    user.isAdmin
                      ? `bg-${gradientFrom.replace(
                          "from-",
                          ""
                        )}/10 text-${gradientFrom.replace("from-", "")}`
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Panel */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
          <ThemePicker />
        </div>

        {/* Admin Panel */}
        {user.isAdmin && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Admin Controls
            </h3>

            <div className="space-y-8">
              <div>
                <h4 className="text-white/60 mb-2">Library Indexing</h4>
                <button
                  onClick={handleForceIndex}
                  disabled={isIndexing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isIndexing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Indexing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Force Index</span>
                    </>
                  )}
                </button>

                {indexingError && (
                  <p className="mt-2 text-red-500 text-sm">{indexingError}</p>
                )}

                {isIndexing && renderProgress()}

                {indexingResults && !isIndexing && (
                  <div className="mt-6 bg-white/5 rounded-xl p-6">
                    <p className="text-white font-medium mb-6">
                      {indexingResults.message}
                    </p>
                    {renderTrackList(indexingResults.added, "added")}
                    {renderTrackList(indexingResults.removed, "removed")}
                    {renderTrackList(indexingResults.unchanged, "unchanged")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
