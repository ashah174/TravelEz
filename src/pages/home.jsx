import { useEffect, useState } from "react";
import ItineraryCard from "../components/itinerarycard";
import { Link } from "react-router-dom";
import { PlusCircle, Search, Heart, Sparkles } from "lucide-react";
import logo from "../images/travelezlogo.jpg";
import { getPublicItineraries } from "../services/api";
import { sortTrips } from "../utils/rating";

const RECOMMENDED_COUNT = 6;


function Home() {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadRecommended = async () => {
      try {
        const response = await getPublicItineraries();
        if (!ignore) {
          setRecommended(
            sortTrips(response.data || [], "rating").slice(0, RECOMMENDED_COUNT)
          );
        }
      } catch (error) {
        console.error("Error loading recommended itineraries:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadRecommended();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="page">
      <section className="hero exciting-hero">

        <img
          src={logo}
          alt="TravelEz logo"
          className="hero-logo"
        />

        <h1>
          Find and Share <span>Itineraries</span>
        </h1>

        <p>
          Discover amazing travel plans, create your own adventures,
          and share them with other travelers.
        </p>

        <div className="hero-actions">

          <Link to="/create" className="hero-btn primary">
            <PlusCircle size={28} />
            <div>
              <strong>Create Your Own Itinerary</strong>
              <small>Plan Your Next Adventure</small>
            </div>
          </Link>

          <Link to="/search" className="hero-btn secondary">
            <Search size={28} />
            <div>
              <strong>Find an Itinerary</strong>
              <small>Explore Travel Plans</small>
            </div>
          </Link>

          <Link to="/favorites" className="hero-btn favorite">
            <Heart size={28} />
            <div>
              <strong>View Favorite Itineraries</strong>
              <small>View Your Saved Trips</small>
            </div>
          </Link>

        </div>
      </section>

      <h2 className="section-heading">
        <Sparkles size={22} className="star-icon" /> Recommended Itineraries
      </h2>

      {loading ? (
        <p>Loading itineraries...</p>
      ) : recommended.length > 0 ? (
        <div className="card-grid">
          {recommended.map((trip) => (
            <ItineraryCard key={trip._id} itinerary={trip} />
          ))}
        </div>
      ) : (
        <p className="public-hint">
          No public itineraries yet. <Link to="/create">Create one</Link> and
          share it to see it here.
        </p>
      )}
    </div>
  );
}

export default Home;