import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Heart, MapPin, Star, Trash2 } from "lucide-react";
import { useItineraries } from "../context/ItineraryContext";
import { useAuth } from "../context/AuthContext";
import { getAverageRating, formatRating } from "../utils/rating";
import { DEFAULT_TRIP_IMAGE, optimizedImageUrl } from "../utils/images";

function ItineraryCard({ itinerary, onDelete, showAuthor = true }) {
  const { toggleFavorite, isFavorited, deleteItinerary } = useItineraries();
  const { isAdmin } = useAuth();
  const [imageFailed, setImageFailed] = useState(false);

  const tripId = itinerary._id || itinerary.id;
  const favorited = isFavorited(tripId);

  const source = itinerary.image || itinerary.imageUrl;
  const hasImage = !!source && source !== DEFAULT_TRIP_IMAGE && !imageFailed;

  const destination =
    itinerary.destination || itinerary.location?.label || "Unknown destination";

  const duration = itinerary.duration || itinerary.days?.length || 0;
  const averageRating = formatRating(getAverageRating(itinerary));
  const author = itinerary.author;
  const copyCount = itinerary.copyCount || 0;

  return (
    <article className="trip-card">
      <div className="trip-card-media">
        {hasImage ? (
          <img
            src={optimizedImageUrl(source, 800)}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="trip-card-fallback">
            <MapPin size={28} />
            <span>{destination}</span>
          </div>
        )}

        {averageRating && (
          <span className="trip-card-rating">
            <Star size={12} fill="currentColor" /> {averageRating}
          </span>
        )}

        <button
          type="button"
          className={`heart-btn ${favorited ? "heart-btn--active" : ""}`}
          onClick={() => toggleFavorite(itinerary)}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={18} fill={favorited ? "var(--favorite)" : "none"} />
        </button>
      </div>

      <div className="trip-card-details">
        <p className="trip-card-destination">{destination}</p>
        <h3>
          <Link to={`/itinerary/${tripId}`} className="trip-card-link">
            {itinerary.title}
          </Link>
        </h3>

        <div className="trip-card-badges">
          {duration > 0 && (
            <span>
              {duration} day{duration !== 1 ? "s" : ""}
            </span>
          )}
          {itinerary.cost > 0 && <span>${Number(itinerary.cost).toLocaleString()}</span>}
          {copyCount > 0 && (
            <span className="icon-text">
              <Copy size={12} /> Copied {copyCount} time{copyCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Makes the whole card clickable for pointers. Keyboards and screen
          readers use the title link instead. */}
      <Link
        to={`/itinerary/${tripId}`}
        className="trip-card-hit"
        tabIndex={-1}
        aria-hidden="true"
      />

      {showAuthor && author?.uid && (
        <p className="card-author trip-card-author">
          by{" "}
          <Link to={`/u/${author.uid}`}>{author.name || "TravelEz traveler"}</Link>
        </p>
      )}

      {isAdmin && (
        <button
          type="button"
          className="btn-admin-delete trip-card-admin"
          onClick={() => {
            if (onDelete) {
              onDelete(tripId);
            } else {
              deleteItinerary(tripId);
            }
          }}
        >
          <Trash2 size={15} /> Admin Delete
        </button>
      )}
    </article>
  );
}

export default ItineraryCard;
