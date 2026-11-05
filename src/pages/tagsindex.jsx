import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTagCounts } from "../services/api";
import { TAG_DETAILS, TRIP_TAGS, tagPath } from "../constants/tags";
import { usePageMeta } from "../utils/usePageMeta";

const META_DESCRIPTION = "Browse trips by theme, from food and budget trips to road trips.";

function TagsIndex() {
  const [counts, setCounts] = useState({});

  usePageMeta("Browse Trips by Tag | TravelEz", META_DESCRIPTION);

  useEffect(() => {
    let ignore = false;

    getTagCounts()
      .then((response) => {
        if (!ignore) {
          setCounts(Object.fromEntries(response.data.map(({ tag, count }) => [tag, count])));
        }
      })
      .catch((error) => console.error("Error loading tag counts:", error));

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Browse by Tag</h1>
        <p>{META_DESCRIPTION}</p>
      </header>

      <div className="tag-index-grid">
        {TRIP_TAGS.map((tag) => (
          <Link key={tag} to={tagPath(tag)} className="tag-index-card">
            <h2>{TAG_DETAILS[tag].heading}</h2>
            <p>{TAG_DETAILS[tag].blurb}</p>
            {counts[tag] !== undefined && (
              <small>
                {counts[tag]} trip{counts[tag] !== 1 ? "s" : ""}
              </small>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TagsIndex;
