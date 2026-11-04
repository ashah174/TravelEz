import { useEffect, useState } from "react";
import ItineraryCard from "../components/itinerarycard";
import { Link } from "react-router-dom";
import { PlusCircle, Search, Heart, Sparkles, Tags, Users } from "lucide-react";
import logo from "../images/travelezlogo.jpg";
import { getFeed, searchItineraries } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TagLinks from "../components/taglinks";

const RECOMMENDED_COUNT = 6;
const FEED_COUNT = 6;


function Home() {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const [feed, setFeed] = useState(null);

  useEffect(() => {
    if (!viewerUid) return;

    let ignore = false;

    getFeed(FEED_COUNT)
      .then((response) => {
        if (!ignore) setFeed(response.data);
      })
      .catch((error) => console.error("Error loading feed:", error));

    return () => {
      ignore = true;
    };
  }, [viewerUid]);

  useEffect(() => {
    let ignore = false;

    const loadRecommended = async () => {
      try {
        const response = await searchItineraries({
          sort: "rating",
          limit: RECOMMENDED_COUNT,
        });
        if (!ignore) setRecommended(response.data.results || []);
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

      {/* Stays hidden until the visitor follows someone. */}
      {viewerUid && feed?.followingCount > 0 && (
        <>
          <h2 className="section-heading">
            <Users size={22} /> From People You Follow
          </h2>

          {feed.results.length > 0 ? (
            <div className="card-grid">
              {feed.results.map((trip) => (
                <ItineraryCard key={trip._id} itinerary={trip} />
              ))}
            </div>
          ) : (
            <p className="public-hint">
              The people you follow haven't shared any public trips yet.
            </p>
          )}
        </>
      )}

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

      <h2 className="section-heading">
        <Tags size={22} /> Browse by Tag
      </h2>
      <TagLinks />
    </div>
  );
}

export default Home;