import { User, Music } from "lucide-react";
import { api } from "../../services/api";
import { useEffect, useState } from "react";

type ImageType = "artist" | "album";
type ImageSize = "sm" | "md" | "lg" | "xl";

interface PlaceholderImageProps {
  type: ImageType;
  id?: number;
  size?: ImageSize;
  rounded?: "none" | "md" | "lg" | "full";
  className?: string;
  hasImage?: boolean;
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

export const PlaceholderImage = ({
  type,
  id,
  size = "md",
  rounded = "md",
  className = "",
  hasImage = false,
}: PlaceholderImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());

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
    </div>
  );
};
