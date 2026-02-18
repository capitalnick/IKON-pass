/**
 * Auto-populate resort images via Google Custom Search JSON API.
 *
 * Prerequisites:
 *   GOOGLE_CSE_API_KEY — https://developers.google.com/custom-search/v1/introduction
 *   GOOGLE_CSE_ID      — https://programmablesearchengine.google.com/
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/populate-resort-images.ts
 *
 * Or set env vars directly:
 *   GOOGLE_CSE_API_KEY=... GOOGLE_CSE_ID=... npx tsx scripts/populate-resort-images.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.GOOGLE_CSE_API_KEY;
const CSE_ID = process.env.GOOGLE_CSE_ID;
const SEARCH_URL = "https://www.googleapis.com/customsearch/v1";

// Minimum image requirements
const MIN_WIDTH = 800;
const MIN_HEIGHT = 450;
const MIN_ASPECT_RATIO = 1.3;
const RESULTS_PER_QUERY = 10;
const DELAY_MS = 1200; // Rate limit: ~1.2s between requests

interface CSEImageResult {
  link: string;
  image: { width: number; height: number };
  mime: string;
}

interface ResortEntry {
  id: string;
  name: string;
  imageUrl?: string;
}

function buildQuery(name: string): string {
  const hasDescriptor = /valley|mountain|resort|park/i.test(name);
  return hasDescriptor
    ? `"${name}" ski winter`
    : `"${name}" ski resort winter landscape`;
}

async function searchImages(query: string): Promise<CSEImageResult[]> {
  const params = new URLSearchParams({
    key: API_KEY!,
    cx: CSE_ID!,
    q: query,
    searchType: "image",
    num: String(RESULTS_PER_QUERY),
    imgSize: "large",
    imgType: "photo",
    safe: "active",
  });

  const res = await fetch(`${SEARCH_URL}?${params}`);
  if (!res.ok) {
    console.error(`  CSE API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  return (data.items ?? []) as CSEImageResult[];
}

function meetsSpecs(img: CSEImageResult): boolean {
  const { width, height } = img.image;
  if (width < MIN_WIDTH || height < MIN_HEIGHT) return false;
  if (width / height < MIN_ASPECT_RATIO) return false;

  // Check file extension or MIME type
  const url = img.link.toLowerCase().split("?")[0];
  const validExts = [".jpg", ".jpeg", ".png", ".webp"];
  const hasValidExt = validExts.some((ext) => url.endsWith(ext));
  if (!hasValidExt) {
    if (!img.mime.startsWith("image/")) return false;
    const mimeType = img.mime.split("/")[1];
    if (!["jpeg", "png", "webp"].includes(mimeType)) return false;
  }

  return true;
}

async function verifyUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    return ct.startsWith("image/");
  } catch {
    return false;
  }
}

async function findImageForResort(
  name: string,
  id: string,
): Promise<string | undefined> {
  const query = buildQuery(name);
  console.log(`  Searching: ${query}`);

  const images = await searchImages(query);

  for (const img of images) {
    if (!meetsSpecs(img)) continue;

    const reachable = await verifyUrl(img.link);
    if (!reachable) {
      console.log(`    Unreachable: ${img.link.slice(0, 80)}...`);
      continue;
    }

    console.log(
      `    Found: ${img.image.width}x${img.image.height} — ${img.link.slice(0, 80)}...`,
    );
    return img.link;
  }

  console.log(`    No image met specs for "${name}"`);
  return undefined;
}

async function main() {
  if (!API_KEY || !CSE_ID) {
    console.error(
      "GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID must be set in environment",
    );
    process.exit(1);
  }

  // Read current resorts file to get the list
  const resortsPath = path.join(__dirname, "../src/data/resorts.ts");
  const source = fs.readFileSync(resortsPath, "utf-8");

  // Extract resort entries (id + name) from the source
  const idNameRegex = /id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"/g;
  const entries: ResortEntry[] = [];
  let match;
  while ((match = idNameRegex.exec(source)) !== null) {
    entries.push({ id: match[1], name: match[2] });
  }

  // Check which already have imageUrl
  const skipExisting = process.argv.includes("--skip-existing");

  console.log(`\nPopulating resort images (${entries.length} resorts)\n`);

  const imageMap: Record<string, string> = {};
  let found = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (skipExisting) {
      // Check if this resort already has an imageUrl in the source
      const idIdx = source.indexOf(`id: "${entry.id}"`);
      if (idIdx !== -1) {
        const blockEnd = source.indexOf("\n  },", idIdx);
        const block = source.slice(idIdx, blockEnd);
        if (block.includes("imageUrl:")) {
          console.log(`  Skipping ${entry.name} (already has imageUrl)`);
          skipped++;
          continue;
        }
      }
    }

    const url = await findImageForResort(entry.name, entry.id);
    if (url) {
      imageMap[entry.id] = url;
      found++;
    } else {
      skipped++;
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\nResults: ${found} images found, ${skipped} skipped\n`);

  // Read the source again and inject imageUrl values
  let updated = fs.readFileSync(resortsPath, "utf-8");

  for (const [id, url] of Object.entries(imageMap)) {
    const idPattern = `id: "${id}"`;
    const idIndex = updated.indexOf(idPattern);
    if (idIndex === -1) {
      console.warn(`  Could not find id "${id}" in resorts.ts`);
      continue;
    }

    // Find the closing of this resort entry
    const blockEnd = updated.indexOf("\n  },", idIndex);
    if (blockEnd === -1) continue;

    // Insert imageUrl before the closing brace
    const imageUrlLine = `\n    imageUrl: "${url}",`;
    updated =
      updated.slice(0, blockEnd) + imageUrlLine + updated.slice(blockEnd);
  }

  fs.writeFileSync(resortsPath, updated, "utf-8");
  console.log("resorts.ts updated with image URLs\n");

  // Write manifest for review
  const manifestPath = path.join(__dirname, "../resort-images.json");
  fs.writeFileSync(manifestPath, JSON.stringify(imageMap, null, 2), "utf-8");
  console.log(
    `Manifest written to resort-images.json (${Object.keys(imageMap).length} entries)\n`,
  );
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
