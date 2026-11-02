import { Link } from "react-router-dom";
import { Heart, Star, Trash2 } from "lucide-react";
import { useItineraries } from "../context/ItineraryContext";
import { useAuth } from "../context/AuthContext";
import { getAverageRating, formatRating } from "../utils/rating";

function ItineraryCard({ itinerary, onDelete }) {
  const { toggleFavorite, isFavorited, deleteItinerary } = useItineraries();
  const { isAdmin } = useAuth();

  const tripId = itinerary._id || itinerary.id;
  const favorited = isFavorited(tripId);

  const image =
    itinerary.image ||
    itinerary.imageUrl ||
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1";

  const destination =
    itinerary.destination || itinerary.location || "Unknown destination";

  const duration = itinerary.duration || itinerary.days?.length || 0;

  const averageRating = formatRating(getAverageRating(itinerary));

  return (
    <div className="itinerary-card">
      <div className="card-image-wrap">
        <img src={image} alt={destination} />

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