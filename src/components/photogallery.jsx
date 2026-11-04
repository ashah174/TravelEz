import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { optimizedImageUrl } from "../utils/images";

// Grid of thumbnails; clicking one opens a full-screen viewer.
function PhotoGallery({ photos = [], label }) {
  const [openIndex, setOpenIndex] = useState(null);
  const isOpen = openIndex !== null;

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i - 1 + photos.length) % photos.length);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="photo-gallery">
        {photos.map((url, index) => (
          <button
            key={url + index}
            type="button"
            className="photo-gallery-item"
            onClick={() => setOpenIndex(index)}
            aria-label={`Open ${label} photo ${index + 1}`}
          >
            <img src={optimizedImageUrl(url, 400)} alt={`${label} photo ${index + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${label} photos`}
          onClick={() => setOpenIndex(null)}
        >
          <button type="button" className="lightbox-close" aria-label="Close" onClick={() => setOpenIndex(null)}>
            <X size={26} />
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-nav--prev"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) => (i - 1 + photos.length) % photos.length);
              }}
            >
              <ChevronLeft size={30} />
            </button>
          )}

          <img
            src={optimizedImageUrl(photos[openIndex], 1600)}
            alt={`${label} photo ${openIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-nav--next"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) => (i + 1) % photos.length);
              }}
            >
              <ChevronRight size={30} />
            </button>
          )}

          <p className="lightbox-count">
            {openIndex + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}

export default PhotoGallery;
