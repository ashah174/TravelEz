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
