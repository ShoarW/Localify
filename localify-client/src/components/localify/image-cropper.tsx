import { useState, useRef } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useTheme } from "../../contexts/theme-context";

export interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const ImageCropper = ({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
}: ImageCropperProps) => {
  const { gradientFrom, gradientTo } = useTheme();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }

  const getCroppedImg = async () => {
    setIsLoading(true);
    try {
      const image = imgRef.current;
      const crop = completedCrop;

      if (!image || !crop) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Calculate the dimensions of the cropped area in the original image
      const croppedWidth = crop.width * scaleX;
      const croppedHeight = crop.height * scaleY;

      // Set canvas dimensions based on image type and size
      if (Math.abs(aspectRatio - 16 / 9) < 0.01) {
        // Background image: only resize if larger than 1920x1080
        if (croppedWidth > 1920 || croppedHeight > 1080) {
          canvas.width = 1920;
          canvas.height = 1080;
        } else {
          canvas.width = Math.round(croppedWidth);
          canvas.height = Math.round(croppedHeight);
        }
      } else {
        // Profile image: only resize if larger than 600x600
        if (croppedWidth > 600 || croppedHeight > 600) {
          canvas.width = 600;
          canvas.height = 600;
        } else {
          canvas.width = Math.round(croppedWidth);
          canvas.height = Math.round(croppedHeight);
        }
      }

      // Use better quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        croppedWidth,
        croppedHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert the canvas to blob with high quality
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
          },
          "image/jpeg",
          0.95 // High quality
        );
      });

      onCropComplete(blob);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-hidden">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">Crop Image</h2>
          <p className="text-sm text-white/60">
            {Math.abs(aspectRatio - 16 / 9) < 0.01
              ? "Select an area for the background image (1920x1080)"
              : "Select a square area for the profile image"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-h-full"
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageUrl}
              className="max-w-full object-contain"
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-4 p-4 border-t border-white/10">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={getCroppedImg}
            disabled={
              !completedCrop?.width || !completedCrop?.height || isLoading
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div
                className={`w-5 h-5 border-2 border-white/20 border-t-${gradientFrom.replace(
                  "from-",
                  ""
                )} rounded-full animate-spin`}
              />
            ) : (
              "Apply Crop"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
