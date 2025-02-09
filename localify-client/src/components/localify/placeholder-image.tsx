import { User, Music, Play } from "lucide-react";
import { api } from "../../services/api";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/theme-context";

type ImageType = "artist" | "album";
type ImageSize = "sm" | "md" | "lg" | "xl";

interface PlaceholderImageProps {
  type: ImageType;
  id?: number;
  size?: ImageSize;
  rounded?: "none" | "md" | "lg" | "full";
  className?: string;
  hasImage?: boolean;
  showPlayButton?: boolean;
  onPlayClick?: () => void;
  gradient?: string;
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

const roundedMap = {
  none: "rounded-none",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
};

const iconSizeMap = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const playButtonSizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const playIconSizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export const PlaceholderImage = ({
  type,
  id,
  size = "md",
  rounded = "md",
  className = "",
  hasImage = false,
  showPlayButton = false,
  onPlayClick,
  gradient,
}: PlaceholderImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const { gradientFrom, gradientTo } = useTheme();
  const finalGradient = gradient || `${gradientFrom} ${gradientTo}`;

  // Reset error state when id changes
  useEffect(() => {
    setImageError(false);
    setImageKey(Date.now());
  }, [id]);

  const containerClasses = `
    ${sizeMap[size]}
    ${roundedMap[rounded]}
    bg-gradient-to-br from-white/10 to-white/5
    flex items-center justify-center
    overflow-hidden
    aspect-square
    shrink-0
    relative
    group
    ${className}
  `.trim();

  const iconClasses = `${iconSizeMap[size]} text-white/40`;

  if (!hasImage || !id || imageError) {
    return (
      <div className={containerClasses}>
        {type === "artist" ? (
          <User className={iconClasses} />
        ) : (
          <Music className={iconClasses} />
        )}
        {showPlayButton && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
            <button
              className={`${playButtonSizeMap[size]} rounded-full bg-gradient-to-r ${finalGradient} flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300`}
              onClick={onPlayClick}
            >
              <Play className={playIconSizeMap[size]} fill="white" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <img
        key={imageKey}
        src={
          type === "artist"
            ? `${api.getArtistImageUrl(id)}`
            : api.getAlbumCoverUrl(id)
        }
        alt=""
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
      {showPlayButton && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
          <button
            className={`${playButtonSizeMap[size]} rounded-full bg-gradient-to-r ${finalGradient} flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300`}
            onClick={onPlayClick}
          >
            <Play className={playIconSizeMap[size]} fill="white" />
          </button>
        </div>
      )}
    </div>
  );
};
