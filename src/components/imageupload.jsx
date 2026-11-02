import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { imageUploadsEnabled, uploadImage } from "../utils/images";

// Lets the user upload a photo (Cloudinary) or paste an image URL.
// When uploads aren't configured, only the URL field is shown.
function ImageUpload({ value, onChange, maxSize = 1600, label = "Cover photo" }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlField, setShowUrlField] = useState(!imageUploadsEnabled);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      onChange(await uploadImage(file, { maxSize }));
    } catch (uploadError) {
      console.error("Image upload failed:", uploadError);
      setError(uploadError.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <span className="image-upload-label">{label}</span>

      {value && (
        <div className="image-upload-preview">
          <img src={value} alt="Selected" referrerPolicy="no-referrer" />
          <button
            type="button"
            className="image-upload-remove"
            onClick={() => onChange("")}
            aria-label="Remove photo"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {imageUploadsEnabled && (
        <div className="image-upload-actions">
          <button
            type="button"
            className="image-upload-btn"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="spin" /> Uploading...
              </>
            ) : (
              <>
                <ImagePlus size={18} /> {value ? "Replace photo" : "Upload photo"}
              </>
            )}
          </button>

          {!showUrlField && (
            <button
              type="button"
              className="image-upload-link"
              onClick={() => setShowUrlField(true)}
            >
              <Link2 size={15} /> Use an image URL instead
            </button>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
        </div>
      )}

      {showUrlField && (
        <input
          type="url"
          placeholder="Paste an image URL (optional)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default ImageUpload;
