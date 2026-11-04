import { Link } from "react-router-dom";
import { TRIP_TAGS, tagPath } from "../constants/tags";

// A row of links to every tag's page, optionally highlighting the current one.
function TagLinks({ current }) {
  return (
    <div className="tag-list">
      {TRIP_TAGS.map((tag) => (
        <Link
          key={tag}
          to={tagPath(tag)}
          className={`tag-chip ${tag === current ? "tag-chip--active" : ""}`}
          aria-current={tag === current ? "page" : undefined}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}

export default TagLinks;
