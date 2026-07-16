import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import ItineraryCard from "../components/itinerarycard";
import { useItineraries } from "../context/ItineraryContext";

function Favorites() {
  const { favorites } = useItineraries();

  return (
    <div className="page">
      <section className="hero exciting-hero">
        <Heart size={48} className="hero-icon" />
        <h1>
          Favorite <span>Itineraries</span>
        </h1>
        <p>All the trips you've hearted, saved in one place.</p>
      </section>

      {favorites.length > 0 ? (
        <>
          <p className="public-itineraries-meta">
            {favorites.length} favorited itinerar{favorites.length === 1 ? "y" : "ies"}
          </p>
          <div className="card-grid">
            {favorites.map((trip) => (
              <ItineraryCard key={trip.id} itinerary={trip} />
              ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Heart size={64} strokeWidth={1.2} />
          <h2>No favorites yet</h2>
          <p>Tap the heart on any itinerary to save it here.</p>
          <Link to="/public" className="submit-itinerary-btn empty-create-btn">
            Browse Itineraries
          </Link>
        </div>
      )}
    </div>
  );
}

export default Favorites;
