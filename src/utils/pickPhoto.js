import { DEFAULT_TRIP_IMAGE, optimizedImageUrl } from "./images";

const THUMB_WIDTH = 200;
const MIN_FULL_WIDTH = 800; // for links we can't get a resized copy of
const SAMPLE_SIZE = 48;
const LOAD_TIMEOUT_MS = 3000;
const MAX_CANDIDATES = 24;
// A day photo must clearly beat the cover, which is the default.
const BEAT_COVER_BY = 1.1;

// A trip's own photos: its cover first (unless it's the stock image), then day
// photos, without duplicates.
export function getTripPhotos(trip) {
  const cover = trip?.image && trip.image !== DEFAULT_TRIP_IMAGE ? [trip.image] : [];
  const dayPhotos = (trip?.days || []).flatMap((day) => day.photos || []);
  return [...new Set([...cover, ...dayPhotos])].slice(0, MAX_CANDIDATES);
}

// Scores RGB pixel data ([r, g, b, a, ...]): colorful, high-contrast images
// score higher, and nearly black or washed-out ones lower.
export function scorePixels(data) {
  let count = 0;
  let sumRg = 0;
  let sumYb = 0;
  let sumRg2 = 0;
  let sumYb2 = 0;
  let sumLum = 0;
  let sumLum2 = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const rg = r - g;
    const yb = 0.5 * (r + g) - b;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    count += 1;
    sumRg += rg;
    sumYb += yb;
    sumRg2 += rg * rg;
    sumYb2 += yb * yb;
    sumLum += lum;
    sumLum2 += lum * lum;
  }

  if (count === 0) return 0;

  const spread = (sum, sum2) => Math.sqrt(Math.max(sum2 / count - (sum / count) ** 2, 0));
  const meanRg = sumRg / count;
  const meanYb = sumYb / count;
  const meanLum = sumLum / count;

  // Colorfulness measure from Hasler and Süsstrunk (2003), plus overall contrast.
  const colorfulness =
    Math.hypot(spread(sumRg, sumRg2), spread(sumYb, sumYb2)) + 0.3 * Math.hypot(meanRg, meanYb);
  const contrast = spread(sumLum, sumLum2);
  const exposure = meanLum < 35 || meanLum > 220 ? 0.6 : 1;

  return (colorfulness + 0.5 * contrast) * exposure;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => reject(new Error("Timed out")), LOAD_TIMEOUT_MS);
    image.crossOrigin = "anonymous";
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Failed to load"));
    };
    image.src = src;
  });
}

// Resolves with a photo's score, or null if it can't be read or is too small.
async function scorePhoto(url) {
  try {
    const thumb = optimizedImageUrl(url, THUMB_WIDTH);
    const image = await loadImage(thumb);
    const minWidth = thumb === url ? MIN_FULL_WIDTH : THUMB_WIDTH;
    if (image.naturalWidth < minWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    // The hero is wide, so portrait photos crop badly on desktop.
    const portrait = image.naturalWidth < image.naturalHeight ? 0.8 : 1;
    return scorePixels(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data) * portrait;
  } catch {
    return null;
  }
}

// Picks the most striking of a trip's photos, where photos[0] is the fallback.
// Any photo that can't be read is skipped.
export async function pickMostStrikingPhoto(photos, hasCover = true) {
  const scores = await Promise.all(photos.map(scorePhoto));

  let best = 0;
  let bestScore = hasCover ? (scores[0] ?? 0) * BEAT_COVER_BY : (scores[0] ?? 0);
  scores.forEach((score, index) => {
    if (index > 0 && score !== null && score > bestScore) {
      best = index;
      bestScore = score;
    }
  });

  return photos[best];
}
