/**
 * Transform a full-resolution Wikimedia Commons / Wikipedia image URL
 * into a resized thumbnail URL.
 *
 * Wikipedia serves on-the-fly thumbnails via their /thumb/ path:
 *   Original:  .../wikipedia/commons/a/ab/File.jpg
 *   Thumb:     .../wikipedia/commons/thumb/a/ab/File.jpg/800px-File.jpg
 *
 * This avoids downloading multi-MB originals for small UI thumbnails.
 */
export function wikiThumb(url: string, width: number): string {
  // Only transform upload.wikimedia.org URLs
  if (!url.includes("upload.wikimedia.org")) return url;

  // Already a thumbnail URL — replace the existing width
  if (url.includes("/thumb/")) {
    return url.replace(/\/\d+px-/, `/${width}px-`);
  }

  // Transform: insert /thumb/ and append /{width}px-{filename}
  // Pattern: .../wikipedia/{project}/{hash_a}/{hash_ab}/Filename.ext
  //       →  .../wikipedia/{project}/thumb/{hash_a}/{hash_ab}/Filename.ext/{width}px-Filename.ext
  const match = url.match(
    /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/([a-f0-9]\/[a-f0-9]{2})\/(.+)$/,
  );
  if (!match) return url;

  const [, base, hashPath, filename] = match;
  return `${base}/thumb/${hashPath}/${filename}/${width}px-${filename}`;
}
