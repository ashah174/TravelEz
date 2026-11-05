import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import ItineraryCard from "../components/itinerarycard";
import { useAuth } from "../context/AuthContext";
import { useItineraries } from "../context/ItineraryContext";

function Favorites() {
  const { favorites } = useItineraries();
  const { user, authReady, signInWithGoogle } = useAuth();

  return (
    <div className="page">
      <header className="page-head">
        <h1>Favorites</h1>
        <p>All the trips you've hearted, saved in one place.</p>
      </header>

      {!authReady ? null : !user ? (
        <div className="empty-state">
          <Heart size={64} strokeWidth={1.2} />
          <h2>Sign in to see your favorites</h2>
          <p>Trips you heart will be saved here.</p>
          <button type="button" className="btn-signin" onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        </div>
      ) : favorites.length > 0 ? (
        <>
          <p className="public-itineraries-meta">
            {favorites.length} favorite trip{favorites.length === 1 ? "" : "s"}
          </p>
          <div className="card-grid">
            {favorites.map((trip) => (
              <ItineraryCard key={trip._id || trip.id} itinerary={trip} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Heart size={64} strokeWidth={1.2} />
          <h2>No favorites yet</h2>
          <p>Tap the heart on any trip to save it here.</p>
          <Link to="/results" className="submit-itinerary-btn empty-create-btn">
            Explore trips
          </Link>
        </div>
      )}
    </div>
  );
}

export default Favorites;
