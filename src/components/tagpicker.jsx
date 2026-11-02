import { TRIP_TAGS } from "../constants/tags";

function TagPicker({ selected, onChange }) {
  const toggle = (tag) => {
    onChange(
      selected.includes(tag)
        ? selected.filter((item) => item !== tag)
        : [...selected, tag]
    );
  };

  return (
    <div className="tag-picker">
      {TRIP_TAGS.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            className={`tag-chip ${active ? "tag-chip--active" : ""}`}
            aria-pressed={active}
            onClick={() => toggle(tag)}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

export default TagPicker;
