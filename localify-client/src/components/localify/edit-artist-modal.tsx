import { useState, useRef, useEffect } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { ImageCropper } from "./image-cropper";
import { useTheme } from "../../contexts/theme-context";

interface EditArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: number;
  initialData: {
    name: string;
    description: string | null;
    hasImage: boolean;
    hasBackgroundImage: boolean;
  };
  onUpdate: (updatedArtist: {
    name: string;
    description: string | null;
    artistId: number;
    hasImage: boolean;
    hasBackgroundImage: boolean;
  }) => void;
}

export const EditArtistModal = ({
  isOpen,
  onClose,
  artistId,
  initialData,
  onUpdate,
}: EditArtistModalProps) => {
  const { gradientFrom, gradientTo } = useTheme();
  const [name, setName] = useState<string>(initialData.name);
  const [description, setDescription] = useState<string>(
    initialData.description ?? ""
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedBackgroundImage, setSelectedBackgroundImage] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData.hasImage ? api.getArtistImageUrl(artistId) : null
  );
  const [previewBackgroundUrl, setPreviewBackgroundUrl] = useState<
    string | null
  >(
    initialData.hasBackgroundImage ? api.getArtistBackgroundUrl(artistId) : null
  );
  const [showCropper, setShowCropper] = useState(false);
  const [showBackgroundCropper, setShowBackgroundCropper] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(initialData.name);
    setDescription(initialData.description ?? "");
    setSelectedImage(null);
    setSelectedBackgroundImage(null);
    setPreviewUrl(
      initialData.hasImage ? api.getArtistImageUrl(artistId) : null
    );
    setPreviewBackgroundUrl(
      initialData.hasBackgroundImage
        ? api.getArtistBackgroundUrl(artistId)
        : null
    );
    setShowCropper(false);
    setShowBackgroundCropper(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = "";
    }
  }, [artistId, initialData]);

  useEffect(() => {
    if (isOpen) {
      // Disable scrolling on the artist page and body
      document.body.style.overflow = "hidden";
      const artistPage = document.querySelector(".artist-page-container");
      if (artistPage) {
        artistPage.classList.add("!overflow-hidden");
      }
    }

    return () => {
      // Re-enable scrolling when modal closes
      document.body.style.overflow = "";
      const artistPage = document.querySelector(".artist-page-container");
      if (artistPage) {
        artistPage.classList.remove("!overflow-hidden");
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowCropper(true);
    }
  };

  const handleBackgroundImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewBackgroundUrl(url);
      setShowBackgroundCropper(true);
    }
  };

  const handleCropComplete = (croppedImage: Blob) => {
    const file = new File([croppedImage], "cropped-image.jpg", {
      type: "image/jpeg",
    });
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCropper(false);
  };

  const handleBackgroundCropComplete = (croppedImage: Blob) => {
    const file = new File([croppedImage], "cropped-background.jpg", {
      type: "image/jpeg",
    });
    setSelectedBackgroundImage(file);
    setPreviewBackgroundUrl(URL.createObjectURL(file));
    setShowBackgroundCropper(false);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveBackgroundImage = () => {
    setSelectedBackgroundImage(null);
    setPreviewBackgroundUrl(null);
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.updateArtist(artistId, {
        name,
        description: description || null,
        image: selectedImage,
        backgroundImage: selectedBackgroundImage,
      });
      onUpdate({
        name,
        description: description || null,
        artistId,
        hasImage: selectedImage ? true : initialData.hasImage,
        hasBackgroundImage: selectedBackgroundImage
          ? true
          : initialData.hasBackgroundImage,
      });
      onClose();
    } catch (error) {
      setError("Failed to update artist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-4 z-[9999] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">Edit Artist</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-${gradientFrom.replace(
                  "from-",
                  ""
                )}/40`}
                placeholder="Artist name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-${gradientFrom.replace(
                  "from-",
                  ""
                )}/40 resize-none`}
                placeholder="Artist description"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Profile Image
              </label>
              <div className="relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 transition-opacity`}
                      >
                        <Upload className="w-5 h-5 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-white/20 rounded-xl text-white/40 hover:text-white/60 hover:border-${gradientFrom.replace(
                      "from-",
                      ""
                    )}/30 transition-colors`}
                  >
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-sm">Upload image</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Background Image (1920x1080)
              </label>
              <div className="relative group">
                <input
                  type="file"
                  ref={backgroundFileInputRef}
                  onChange={handleBackgroundImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {previewBackgroundUrl ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                    <img
                      src={previewBackgroundUrl}
                      alt="Background Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => backgroundFileInputRef.current?.click()}
                        className={`p-2 rounded-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 transition-opacity`}
                      >
                        <Upload className="w-5 h-5 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveBackgroundImage}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => backgroundFileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-white/20 rounded-xl text-white/40 hover:text-white/60 hover:border-${gradientFrom.replace(
                      "from-",
                      ""
                    )}/30 transition-colors`}
                  >
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-sm">Upload background image</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="flex-shrink-0 flex justify-end gap-4 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {showCropper && previewUrl && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl">
          <ImageCropper
            imageUrl={previewUrl}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setShowCropper(false);
              setPreviewUrl(
                initialData.hasImage ? api.getArtistImageUrl(artistId) : null
              );
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          />
        </div>
      )}

      {showBackgroundCropper && previewBackgroundUrl && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl">
          <ImageCropper
            imageUrl={previewBackgroundUrl}
            onCropComplete={handleBackgroundCropComplete}
            onCancel={() => {
              setShowBackgroundCropper(false);
              setPreviewBackgroundUrl(
                initialData.hasBackgroundImage
                  ? api.getArtistBackgroundUrl(artistId)
                  : null
              );
              if (backgroundFileInputRef.current) {
                backgroundFileInputRef.current.value = "";
              }
            }}
            aspectRatio={16 / 9}
          />
        </div>
      )}
    </div>
  );
};
