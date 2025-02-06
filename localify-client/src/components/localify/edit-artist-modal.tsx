import { useState, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { ImageCropper } from "./image-cropper";

interface EditArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: number;
  initialData: {
    name: string;
    description: string | null;
    hasImage: boolean;
  };
  onUpdate: (updatedArtist: {
    name: string;
    description: string | null;
    artistId: number;
    hasImage: boolean;
  }) => void;
}

export const EditArtistModal = ({
  isOpen,
  onClose,
  artistId,
  initialData,
  onUpdate,
}: EditArtistModalProps) => {
  const [name, setName] = useState<string>(initialData.name);
  const [description, setDescription] = useState<string>(
    initialData.description ?? ""
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData.hasImage ? api.getArtistImageUrl(artistId) : null
  );
  const [showCropper, setShowCropper] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCropComplete = (croppedImage: Blob) => {
    const file = new File([croppedImage], "cropped-image.jpg", {
      type: "image/jpeg",
    });
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCropper(false);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      });
      onUpdate({
        name,
        description: description || null,
        artistId,
        hasImage: selectedImage ? true : initialData.hasImage,
      });
      onClose();
    } catch (error) {
      setError("Failed to update artist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-white">Edit Artist</h2>
            <p className="text-sm text-white/60">
              Update the artist's information
            </p>
          </div>

          <div className="space-y-4">
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
                className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/40"
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
                className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
                placeholder="Artist description"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Image
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
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
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
                    className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-white/20 rounded-xl text-white/40 hover:text-white/60 hover:border-white/30 transition-colors"
                  >
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-sm">Upload image</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      {showCropper && previewUrl && (
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
      )}
    </div>
  );
};
