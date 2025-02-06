import { useState, useRef } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
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
}: ImageCropperProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
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

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      // Convert the canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
          },
          "image/jpeg",
          0.95
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">Crop Image</h2>
          <p className="text-sm text-white/60">
            Select a square area of the image
          </p>
        </div>

        <div className="p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            className="max-h-[60vh] mx-auto"
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageUrl}
              onLoad={onImageLoad}
              className="max-h-[60vh] mx-auto"
            />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-4 p-4 border-t border-white/10">
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Apply Crop"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
