import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Tag } from "lucide-react";
import ItineraryCard from "../components/itinerarycard";
import TagLinks from "../components/taglinks";
import { searchItineraries } from "../services/api";
import { useItineraries } from "../context/ItineraryContext";
import { TAG_DETAILS, tagFromSlug } from "../constants/tags";
import { usePageMeta } from "../utils/usePageMeta";

const PAGE_SIZE = 12;

function TagResults({ tag }) {
  const { heading, blurb } = TAG_DETAILS[tag];
  const { deleteItinerary } = useItineraries();

  const [trips, setTrips] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  usePageMeta(`${heading} | TravelEz`, blurb);

  useEffect(() => {
    let ignore = false;

    const loadPage = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await searchItineraries({
          tags: tag,
          sort: "rating",
          page,
          limit: PAGE_SIZE,
        });
        if (ignore) return;

        const { results, total: resultTotal, pages: pageCount } = response.data;
        setTrips((current) => (page === 1 ? results : [...current, ...results]));
        setTotal(resultTotal);
        setPages(pageCount);
      } catch (loadError) {
        console.error("Error loading tag page:", loadError);
        if (!ignore) setError("Couldn't load these trips. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadPage();

    return () => {
      ignore = true;
    };
  }, [tag, page]);

  const handleAdminDelete = async (id) => {
    await deleteItinerary(id);
    setTrips((current) => current.filter((trip) => String(trip._id) !== String(id)));
    setTotal((count) => count - 1);
  };

  return (
    <div className="page">
      <section className="hero exciting-hero" style={{ marginBottom: "36px" }}>
        <Tag size={48} className="hero-icon" />
        <h1>{heading}</h1>
        <p>{blurb}</p>
      </section>

      <TagLinks current={tag} />

      {!loading && !error && (
        <p className="public-itineraries-meta">
          {total} public trip{total !== 1 ? "s" : ""} tagged {tag}
        </p>
      )}

      {trips.length > 0 && (
        <div className="card-grid">
          {trips.map((trip) => (
            <ItineraryCard key={trip._id} itinerary={trip} onDelete={handleAdminDelete} />
          ))}
        </div>
      )}

      {loading && <p>Loading trips...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && total === 0 && (
        <p className="public-hint">
          No {tag} trips yet. <Link to="/create">Create one</Link> and share it
          to see it here.
        </p>
      )}

      {!loading && !error && page < pages && (
        <button
          type="button"
          className="load-more-btn"
          onClick={() => setPage((current) => current + 1)}
        >
          Load more trips
        </button>
      )}
    </div>
  );
}

function TagPage() {
  const { slug } = useParams();
  const tag = tagFromSlug(slug);

  if (!tag) {
    return (
      <div className="page">
        <div className="detail-card">
          <h1>Tag not found</h1>
          <p>
            <Link to="/tags">See all tags</Link>
          </p>
        </div>
      </div>
    );
  }

  // Keyed so moving between tags starts from a clean list.
  return <TagResults key={tag} tag={tag} />;
}

export default TagPage;
