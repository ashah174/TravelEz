// Average of a trip's review ratings, or null when it has no reviews.
export function getAverageRating(trip) {
  const comments = trip?.comments || [];
  if (comments.length === 0) return null;

  const total = comments.reduce((sum, comment) => sum + Number(comment.rating || 0), 0);
  return total / comments.length;
}

export function formatRating(rating) {
  return rating == null ? null : rating.toFixed(1);
}

function createdTime(trip) {
  const time = new Date(trip?.createdAt || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortTrips(trips, sortBy) {
  return [...trips].sort((a, b) => {
    if (sortBy === "rating") {
      const diff = (getAverageRating(b) ?? -1) - (getAverageRating(a) ?? -1);
      if (diff !== 0) return diff;
    } else if (sortBy === "cost") {
      const diff = (a.cost || 0) - (b.cost || 0);
      if (diff !== 0) return diff;
    }
    return createdTime(b) - createdTime(a);
  });
}
