import { useEffect, useState, useRef } from "react";
import { getUser } from "../utils/auth";
import { api, Track } from "../services/api";
import {
  User,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalRunningTime, setTotalRunningTime] = useState(0);
  const [averageProcessingTime, setAverageProcessingTime] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState<{
    currentTrack?: {
      id: number;
      title: string;
      path: string;
      album: {
        id: number;
        title: string;
      };
    };
    success: number;
    failed: number;
    total: number;
  } | null>(null);
  const [processedTracks, setProcessedTracks] = useState<
    Array<{
      id: number;
      title: string;
      path: string;
      status: "success" | "failed";
      timestamp: number;
      album: {
        id: number;
        title: string;
      };
    }>
  >([]);
  const [expandedSections, setExpandedSections] = useState<{
    added: boolean;
    removed: boolean;
    unchanged: boolean;
  }>({
    added: true,
    removed: false,
    unchanged: false,
  });
  const [wakeLock, setWakeLock] = useState<any>(null);
  const isAnalyzingRef = useRef(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAnalyzing && startTime && !isPaused) {
      // Update time every second
      intervalId = setInterval(() => {
        const currentRunningTime = Math.floor((Date.now() - startTime) / 1000);
        setTotalRunningTime(currentRunningTime);

        // Update average time if we have processed any tracks
        if (analysisProgress) {
          const totalProcessed =
            analysisProgress.success + analysisProgress.failed;
          if (totalProcessed > 0) {
            setAverageProcessingTime(currentRunningTime / totalProcessed);
          }
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAnalyzing, startTime, isPaused, analysisProgress]);

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

  useEffect(() => {
    const requestWakeLock = async () => {
      if (isAnalyzing && !isPaused) {
        try {
          const wakeLock = await navigator.wakeLock.request("screen");
          setWakeLock(wakeLock);
        } catch (err) {
          console.error("Failed to request wake lock:", err);
        }
      } else if (wakeLock) {
        try {
          await wakeLock.release();
          setWakeLock(null);
        } catch (err) {
          console.error("Failed to release wake lock:", err);
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
    };
  }, [isAnalyzing, isPaused]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isAnalyzing && !isPaused) {
        try {
          const newWakeLock = await navigator.wakeLock.request("screen");
          setWakeLock(newWakeLock);
        } catch (err) {
          console.error("Failed to re-request wake lock:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAnalyzing, isPaused]);

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
                    <p className="text-white/60 truncate">{track.artist}</p>
                  </div>
                  <span className="text-white/40 shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-2 truncate">
                  {track.path}
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
        statusColor = "text-blue-500";
        break;
      case "processing":
        progressText = `Processing files (${indexingProgress.current}/${indexingProgress.total})`;
        progressPercentage = indexingProgress.total
          ? (indexingProgress.current / indexingProgress.total) * 100
          : 0;
        statusColor = "text-amber-500";
        break;
      case "cleanup":
        progressText = `Cleaning up library (${indexingProgress.current}/${indexingProgress.total})`;
        progressPercentage = indexingProgress.total
          ? (indexingProgress.current / indexingProgress.total) * 100
          : 0;
        statusColor = "text-purple-500";
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
              className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-300"
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
          <div className="bg-green-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-green-500 font-medium">Added</p>
            </div>
            <p className="text-2xl text-white">{indexingProgress.added}</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-red-500 font-medium">Removed</p>
            </div>
            <p className="text-2xl text-white">{indexingProgress.removed}</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-blue-500 font-medium">Unchanged</p>
            </div>
            <p className="text-2xl text-white">{indexingProgress.unchanged}</p>
          </div>
        </div>
      </div>
    );
  };

  const processNextBatch = async () => {
    if (!isAnalyzingRef.current || isPaused) return;

    try {
      // Process a batch of 10 tracks
      await api.analyzeBatch((update) => {
        // Update running time
        if (startTime) {
          const currentRunningTime = Math.floor(
            (Date.now() - startTime) / 1000
          );
          setTotalRunningTime(currentRunningTime);

          // Calculate average processing time (in seconds)
          const totalProcessed = update.success + update.failed;
          if (totalProcessed > 0) {
            setAverageProcessingTime(currentRunningTime / totalProcessed);
          }
        }

        setAnalysisProgress({
          currentTrack: update.currentTrack && {
            id: update.currentTrack.id,
            title: update.currentTrack.title,
            path: update.currentTrack.path,
            album: update.currentTrack.album,
          },
          success: update.success,
          failed: update.failed,
          total: update.total,
        });

        if (update.currentTrack) {
          setProcessedTracks((prev) => [
            {
              id: update.currentTrack!.id,
              title: update.currentTrack!.title,
              path: update.currentTrack!.path,
              album: update.currentTrack!.album,
              status: "success",
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        }

        // Clear the table if we've completed all tracks in the current batch
        if (update.success + update.failed === update.total) {
          setTimeout(() => {
            setProcessedTracks([]);
          }, 2000);
        }
      });

      // Start next batch after a short delay
      if (isAnalyzingRef.current && !isPaused) {
        setTimeout(processNextBatch, 1000);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisError("Failed to analyze tracks. Please try again.");
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
      setIsPaused(false);
    }
  };

  // Format time function
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Update the click handler for the Start Analysis button
  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    isAnalyzingRef.current = true;
    setAnalysisError(null);
    setAnalysisProgress(null);
    setProcessedTracks([]);
    setIsPaused(false);
    setStartTime(Date.now());
    setTotalRunningTime(0);
    setAverageProcessingTime(0);
    processNextBatch();
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
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
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {user.isAdmin && (
            <div className="border-t border-white/10 pt-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Admin Controls
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white/60 mb-2">Library Indexing</h4>
                  <button
                    onClick={handleForceIndex}
                    disabled={isIndexing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-white/60 mb-2">Track Analysis</h4>
                  <div className="flex items-center gap-4">
                    {!isAnalyzing ? (
                      <button
                        onClick={handleStartAnalysis}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity"
                      >
                        <Play className="w-5 h-5" />
                        <span>Start Analysis</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const newPausedState = !isPaused;
                          setIsPaused(newPausedState);
                          if (!newPausedState) {
                            processNextBatch();
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity"
                      >
                        {isPaused ? (
                          <>
                            <Play className="w-5 h-5" />
                            <span>Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-5 h-5" />
                            <span>Pause</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {analysisError && (
                    <p className="mt-2 text-red-500 text-sm">{analysisError}</p>
                  )}

                  {analysisProgress && (
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-500 font-medium">
                              Analyzing
                            </span>
                            {analysisProgress.currentTrack && (
                              <span className="text-white/60">
                                {analysisProgress.currentTrack.title}
                              </span>
                            )}
                          </div>
                          <span className="text-white/60">
                            {Math.round(
                              ((analysisProgress.success +
                                analysisProgress.failed) /
                                analysisProgress.total) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
                            style={{
                              width: `${
                                ((analysisProgress.success +
                                  analysisProgress.failed) /
                                  analysisProgress.total) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {analysisProgress.currentTrack && (
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-sm text-white/60 mb-1">
                            Current Track
                          </p>
                          <p className="text-sm text-white font-medium truncate">
                            {analysisProgress.currentTrack.path}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-500/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <p className="text-green-500 font-medium">
                              Successful
                            </p>
                          </div>
                          <p className="text-2xl text-white">
                            {analysisProgress.success}
                          </p>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <p className="text-red-500 font-medium">Failed</p>
                          </div>
                          <p className="text-2xl text-white">
                            {analysisProgress.failed}
                          </p>
                        </div>
                        <div className="bg-blue-500/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <p className="text-blue-500 font-medium">Total</p>
                          </div>
                          <p className="text-2xl text-white">
                            {analysisProgress.total}
                          </p>
                        </div>
                      </div>

                      {/* Add new timing metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-500/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <p className="text-purple-500 font-medium">
                              Total Running Time
                            </p>
                          </div>
                          <p className="text-2xl text-white">
                            {formatTime(totalRunningTime)}
                          </p>
                        </div>
                        <div className="bg-indigo-500/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <p className="text-indigo-500 font-medium">
                              Average Processing Time
                            </p>
                          </div>
                          <p className="text-2xl text-white">
                            {averageProcessingTime.toFixed(2)}s per track
                          </p>
                        </div>
                      </div>

                      {processedTracks.length > 0 && (
                        <div className="mt-6 bg-white/5 rounded-xl p-4">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-left text-white/60 text-sm border-b border-white/10">
                                  <th className="pb-2 font-medium">Status</th>
                                  <th className="pb-2 font-medium">Track</th>
                                  <th className="pb-2 font-medium">Album</th>
                                  <th className="pb-2 font-medium">Time</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm">
                                {processedTracks.map((track) => (
                                  <tr
                                    key={`${track.id}-${track.timestamp}`}
                                    className="border-b border-white/5 last:border-0"
                                  >
                                    <td className="py-2">
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          track.status === "success"
                                            ? "bg-green-500/10 text-green-500"
                                            : "bg-red-500/10 text-red-500"
                                        }`}
                                      >
                                        {track.status === "success"
                                          ? "Success"
                                          : "Failed"}
                                      </span>
                                    </td>
                                    <td className="py-2">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={api.getAlbumCoverUrl(
                                            track.album.id
                                          )}
                                          alt={track.album.title}
                                          className="w-10 h-10 rounded bg-white/5"
                                        />
                                        <span className="text-white">
                                          {track.title}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-2 text-white/60">
                                      {track.album.title}
                                    </td>
                                    <td className="py-2 text-white/60">
                                      {new Date(
                                        track.timestamp
                                      ).toLocaleTimeString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
