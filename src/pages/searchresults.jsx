import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ItineraryCard from "../components/itinerarycard";
import TagPicker from "../components/tagpicker";
import { searchItineraries } from "../services/api";
import { TRIP_TAGS } from "../constants/tags";

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Favorited" },
  { value: "copied", label: "Most Copied" },
  { value: "cost", label: "Lowest Cost" },
];

const PAGE_SIZE = 12;
const NUMBER_FILTERS = ["minCost", "maxCost", "minDays", "maxDays"];

function readFilters(searchParams) {
  return {
    // `destination` is the old parameter name; keep links using it working.
    q: searchParams.get("q") ?? searchParams.get("destination") ?? "",
    tags: (searchParams.get("tags") || "")
      .split(",")
      .filter((tag) => TRIP_TAGS.includes(tag)),
    minCost: searchParams.get("minCost") || "",
    maxCost: searchParams.get("maxCost") || "",
    minDays: searchParams.get("minDays") || "",
    maxDays: searchParams.get("maxDays") || "",
    sort: searchParams.get("sort") || "recent",
    page: Math.max(Number(searchParams.get("page")) || 1, 1),
  };
}

function toSearchParams(filters) {
  const params = {};
  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.tags.length) params.tags = filters.tags.join(",");
  NUMBER_FILTERS.forEach((key) => {
    if (filters[key] !== "") params[key] = filters[key];
  });
  if (filters.sort !== "recent") params.sort = filters.sort;
  if (filters.page > 1) params.page = String(filters.page);
  return params;
}

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const filterKey = searchParams.toString();

  const [draft, setDraft] = useState(filters);
  const [draftKey, setDraftKey] = useState(filterKey);
  // Start with the filter panel open if the link already has filters in it.
  const [showFilters, setShowFilters] = useState(
    () => filters.tags.length > 0 || NUMBER_FILTERS.some((key) => filters[key] !== "")
  );

  const [data, setData] = useState({ results: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Keep the form in sync when the URL changes (back button, new search).
  if (draftKey !== filterKey) {
    setDraftKey(filterKey);
    setDraft(filters);
  }

  useEffect(() => {
    let ignore = false;
    const current = readFilters(new URLSearchParams(filterKey));

    const fetchResults = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await searchItineraries({
          ...toSearchParams(current),
          page: current.page,
          limit: PAGE_SIZE,
        });
        if (!ignore) setData(response.data);
      } catch (searchError) {
        console.error("Search error:", searchError);
        if (!ignore) {
          setData({ results: [], total: 0, pages: 1 });
          setError("Something went wrong while searching. Please try again.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      ignore = true;
    };
  }, [filterKey]);

  const applyFilters = (next) => {
    setSearchParams(toSearchParams({ ...next, page: 1 }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    applyFilters(draft);
  };

  const handleDraftChange = (e) => {
    setDraft({ ...draft, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    applyFilters({
      q: "",
      tags: [],
      minCost: "",
      maxCost: "",
      minDays: "",
      maxDays: "",
      sort: filters.sort,
    });
  };

  const goToPage = (page) => {
    setSearchParams(toSearchParams({ ...filters, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilterCount =
    filters.tags.length + NUMBER_FILTERS.filter((key) => filters[key] !== "").length;

  const hasFilters =
    filters.q ||
    filters.tags.length > 0 ||
    NUMBER_FILTERS.some((key) => filters[key] !== "");

  return (
    <div className="page">
      <header className="page-head">
        <h1>{hasFilters ? "Search results" : "Explore trips"}</h1>
      </header>

      <form className="search-panel" onSubmit={handleSubmit}>
        <div className="search-panel-row">
          <div className="search-panel-input">
            <Search size={18} />
            <input
              type="text"
              name="q"
              placeholder="Search destinations, titles, or keywords..."
              value={draft.q}
              onChange={handleDraftChange}
            />
          </div>

          <button
            type="button"
            className="search-panel-toggle"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} /> Filters
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </button>

          <button type="submit" className="search-panel-submit">
            Search
          </button>
        </div>

        {showFilters && (
          <div className="search-panel-filters">
            <div className="range-group">
              <span>Budget ($)</span>
              <input
                type="number"
                name="minCost"
                min="0"
                placeholder="Min"
                value={draft.minCost}
                onChange={handleDraftChange}
              />
              <span>to</span>
              <input
                type="number"
                name="maxCost"
                min="0"
                placeholder="Max"
                value={draft.maxCost}
                onChange={handleDraftChange}
              />
            </div>

            <div className="range-group">
              <span>Trip length (days)</span>
              <input
                type="number"
                name="minDays"
                min="1"
                placeholder="Min"
                value={draft.minDays}
                onChange={handleDraftChange}
              />
              <span>to</span>
              <input
                type="number"
                name="maxDays"
                min="1"
                placeholder="Max"
                value={draft.maxDays}
                onChange={handleDraftChange}
              />
            </div>

            <div>
              <span className="filter-label">Tags</span>
              <TagPicker
                selected={draft.tags}
                onChange={(tags) => setDraft({ ...draft, tags })}
              />
            </div>

            <button type="submit" className="search-panel-submit">
              Apply Filters
            </button>
          </div>
        )}
      </form>

      <div className="filters">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={filters.sort === option.value ? "filter-active" : ""}
            onClick={() => applyFilters({ ...filters, sort: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="results-meta">
        {!loading && !error && (
          <p>
            {data.total} trip{data.total === 1 ? "" : "s"}
            {filters.q ? ` matching "${filters.q}"` : ""}
          </p>
        )}

        {hasFilters && (
          <button type="button" className="clear-filters-btn" onClick={clearFilters}>
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <p>Searching...</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : data.results.length > 0 ? (
        <>
          <div className="card-grid">
            {data.results.map((trip) => (
              <ItineraryCard key={trip._id} itinerary={trip} />
            ))}
          </div>

          {data.pages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => goToPage(filters.page - 1)}
              >
                Previous
              </button>
              <span>
                Page {filters.page} of {data.pages}
              </span>
              <button
                type="button"
                disabled={filters.page >= data.pages}
                onClick={() => goToPage(filters.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p>No trips match your search. Try removing a filter.</p>
      )}
    </div>
  );
}

export default SearchResults;
