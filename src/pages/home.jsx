import { useEffect, useState } from "react";
import ItineraryCard from "../components/itinerarycard";
import { Link } from "react-router-dom";
import { getFeed, getItineraryById, searchItineraries } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TagLinks from "../components/taglinks";
import HeroCarousel from "../components/herocarousel";
import { FEATURED_TRIP_ID, HERO_TRIP_COUNT } from "../constants/featured";
import { getTripPhotos } from "../utils/pickPhoto";

const RECOMMENDED_COUNT = 6;
const FEED_COUNT = 6;

function Home() {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const [feed, setFeed] = useState(null);
  // undefined while loading; null when no trip is set or it can't be shown.
  const [featured, setFeatured] = useState(FEATURED_TRIP_ID ? undefined : null);

  useEffect(() => {
    if (!FEATURED_TRIP_ID) return;

    let ignore = false;

    getItineraryById(FEATURED_TRIP_ID)
      .then((response) => {
        const trip = response.data;
        if (!ignore) setFeatured(trip.isPublic && getTripPhotos(trip).length > 0 ? trip : null);
      })
      .catch(() => {
        if (!ignore) setFeatured(null);
      });

    return () => {
      ignore = true;
    };
  }, []);
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

  // The featured trip, or else the highest-rated trips with their own photos
  // (results are already sorted by rating). Until they load, the hero shows its
  // solid background.
  const topTrips = recommended
    .filter((trip) => getTripPhotos(trip).length > 0)
    .slice(0, HERO_TRIP_COUNT);
  const heroTrips = featured === undefined ? [] : featured ? [featured] : topTrips;

  return (
    <>
      <HeroCarousel trips={heroTrips}>
        <div className="home-hero-inner">
          <p className="home-hero-eyebrow">Plan · Share · Wander</p>
          <h1>
            Steal a <em>real</em> trip.
            <br />
            Make it yours.
          </h1>
          <p className="home-hero-sub">
            Copy an itinerary from someone who's actually been there, then
            change anything you like.
          </p>

          <div className="home-hero-actions">
            <Link to="/results" className="home-hero-btn home-hero-btn--primary">
              Explore trips
            </Link>
            <Link to="/create" className="home-hero-btn home-hero-btn--secondary">
              Plan your own
            </Link>
          </div>
        </div>

      </HeroCarousel>

      <div className="page home-content">
        {/* Stays hidden until the visitor follows someone. */}
        {viewerUid && feed?.followingCount > 0 && (
          <section className="home-section">
            <div className="home-section-head">
              <h2>From People You Follow</h2>
            </div>

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
          </section>
        )}

        <section className="home-section">
          <div className="home-section-head">
            <h2>Recommended</h2>
            <Link to="/results?sort=rating" className="home-section-link">
              See all →
            </Link>
          </div>

          {loading ? (
            <p>Loading trips...</p>
          ) : recommended.length > 0 ? (
            <div className="card-grid">
              {recommended.map((trip) => (
                <ItineraryCard key={trip._id} itinerary={trip} />
              ))}
            </div>
          ) : (
            <p className="public-hint">
              No public trips yet. <Link to="/create">Create one</Link> and
              share it to see it here.
            </p>
          )}
        </section>
      </div>

      <section className="home-band">
        <div className="home-section-head">
          <h2>Browse by Tag</h2>
          <Link to="/tags" className="home-section-link">
            All tags →
          </Link>
        </div>
        <TagLinks />
      </section>
    </>
  );
}

export default Home;
