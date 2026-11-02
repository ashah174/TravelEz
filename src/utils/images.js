const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const imageUploadsEnabled = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export const DEFAULT_TRIP_IMAGE =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

// Shrinks a photo in the browser before upload so we store ~300 KB instead of
// a multi-megabyte camera original.
async function resizeImage(file, maxSize, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
      "image/jpeg",
      quality
    );
  });
}

// Uploads an image file to Cloudinary and resolves with its https URL.
export async function uploadImage(file, { maxSize = 1600 } = {}) {
  if (!imageUploadsEnabled) {
    throw new Error("Image uploads are not configured.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("That image is larger than 15 MB.");
  }

  const resized = await resizeImage(file, maxSize);

  const body = new FormData();
  body.append("file", resized, "upload.jpg");
  body.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Upload failed.");
  }

  return data.secure_url;
}

// Returns a smaller, auto-format version of Cloudinary or Unsplash images for
// display. Other URLs are returned unchanged.
export function optimizedImageUrl(url, width) {
  if (!url) return url;

  if (url.includes("res.cloudinary.com/") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }

  if (url.startsWith("https://images.unsplash.com/") && !url.includes("?")) {
    return `${url}?auto=format&fit=crop&q=75&w=${width}`;
  }

  return url;
}
