import { useEffect } from "react";

// Sets the browser title and meta description while a page is showing, so a
// shared link or search result describes the page rather than the whole site.
export function usePageMeta(title, description) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = description;
    document.head.appendChild(meta);

    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, [title, description]);
}
