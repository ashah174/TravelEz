import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { imageUploadsEnabled, optimizedImageUrl, uploadImage } from "../utils/images";

export const MAX_DAY_PHOTOS = 6;

// Edits the list of photo URLs for one day.
function DayPhotosEditor({ photos, onChange }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [urlDraft, setUrlDraft] = useState("");

  const remaining = MAX_DAY_PHOTOS - photos.length;

  const handleFiles = async (e) => {
    const files = [...(e.target.files || [])].slice(0, remaining);
    e.target.value = "";
    if (files.length === 0) return;

    setError("");
    setUploading(files.length);

    const uploaded = [];
    for (const file of files) {
      try {
        uploaded.push(await uploadImage(file));
      } catch (uploadError) {
        console.error("Day photo upload failed:", uploadError);
        setError(uploadError.message || "A photo failed to upload.");
      }
      setUploading((count) => count - 1);
    }

    if (uploaded.length) onChange([...photos, ...uploaded].slice(0, MAX_DAY_PHOTOS));
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setError("Paste a full image link starting with https://");
      return;
    }
    setError("");
    setUrlDraft("");
    onChange([...photos, url].slice(0, MAX_DAY_PHOTOS));
  };

  return (
    <div className="day-photos-editor">
      {photos.length > 0 && (
        <div className="day-photo-thumbs">
          {photos.map((url, index) => (
            <div key={url + index} className="day-photo-thumb">
              <img src={optimizedImageUrl(url, 200)} alt={`Photo ${index + 1}`} />
              <button
                type="button"
                onClick={() => onChange(photos.filter((_, i) => i !== index))}
                aria-label={`Remove photo ${index + 1}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 &&
        (imageUploadsEnabled ? (
          <>
            <button
              type="button"
              className="image-upload-btn image-upload-btn--small"
              onClick={() => fileInput.current?.click()}
              disabled={uploading > 0}
            >
              {uploading > 0 ? (
                <>
                  <Loader2 size={16} className="spin" /> Uploading {uploading}...
                </>
              ) : (
                <>
                  <ImagePlus size={16} /> Add photos ({remaining} left)
                </>
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFiles}
            />
          </>
        ) : (
          <div className="inline-add">
            <input
              type="url"
              placeholder="Paste a photo link"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
            />
            <button type="button" onClick={addUrl} aria-label="Add photo link">
              <Plus size={16} />
            </button>
          </div>
        ))}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default DayPhotosEditor;
