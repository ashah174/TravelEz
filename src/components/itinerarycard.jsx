import { Link } from "react-router-dom";
import { Copy, Heart, Star, Trash2 } from "lucide-react";
import { useItineraries } from "../context/ItineraryContext";
import { useAuth } from "../context/AuthContext";
import { getAverageRating, formatRating } from "../utils/rating";
import { DEFAULT_TRIP_IMAGE, optimizedImageUrl } from "../utils/images";
import { tagPath } from "../constants/tags";

const MAX_CARD_TAGS = 3;

function ItineraryCard({ itinerary, onDelete, showAuthor = true }) {
  const { toggleFavorite, isFavorited, deleteItinerary } = useItineraries();
  const { isAdmin } = useAuth();

  const tripId = itinerary._id || itinerary.id;
  const favorited = isFavorited(tripId);

  const image = optimizedImageUrl(
    itinerary.image || itinerary.imageUrl || DEFAULT_TRIP_IMAGE,
    640
  );

  const destination =
    itinerary.destination || itinerary.location?.label || "Unknown destination";

  const duration = itinerary.duration || itinerary.days?.length || 0;

  const averageRating = formatRating(getAverageRating(itinerary));
  const author = itinerary.author;
  const tags = itinerary.tags || [];
  const copyCount = itinerary.copyCount || 0;

  return (
    <div className="itinerary-card">
      <div className="card-image-wrap">
        <img src={image} alt={destination} loading="lazy" />

        <button
          className={`heart-btn ${favorited ? "heart-btn--active" : ""}`}
          onClick={() => toggleFavorite(itinerary)}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={18} fill={favorited ? "#e11d48" : "none"} />
        </button>
      </div>

      <div className="card-content">
        <h3>{itinerary.title}</h3>
        <p>{destination}</p>

        {showAuthor && author?.uid && (
          <p className="card-author">
            by{" "}
            <Link to={`/u/${author.uid}`}>{author.name || "TravelEz traveler"}</Link>
          </p>
        )}

        {tags.length > 0 && (
          <div className="tag-list">
            {tags.slice(0, MAX_CARD_TAGS).map((tag) => (
              <Link key={tag} to={tagPath(tag)} className="tag-chip tag-chip--static">
                {tag}
              </Link>
            ))}
            {tags.length > MAX_CARD_TAGS && (
              <span className="tag-chip tag-chip--static">
                +{tags.length - MAX_CARD_TAGS}
              </span>
            )}
          </div>
        )}

        {duration > 0 && (
          <p>
            {duration} day{duration !== 1 ? "s" : ""}
          </p>
        )}

        {itinerary.cost > 0 && (
          <p>Estimated Cost: ${Number(itinerary.cost).toLocaleString()}</p>
        )}

        {averageRating && (
          <p className="icon-text">
            <Star size={15} className="star-icon" fill="#c9a87c" /> {averageRating}
          </p>
        )}

        {copyCount > 0 && (
          <p className="icon-text">
            <Copy size={15} /> Copied {copyCount} time{copyCount !== 1 ? "s" : ""}
          </p>
        )}

        <Link to={`/itinerary/${tripId}`}>
          <button>View Details</button>
        </Link>

        {isAdmin && (
          <button
            className="btn-admin-delete"
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
      </div>
    </div>
  );
}

export default ItineraryCard;
