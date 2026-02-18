/**
 * Auto-populate resort images via the Wikipedia REST API.
 * No API key needed — uses the free MediaWiki page summary endpoint
 * which returns the article's main image (original + thumbnail).
 *
 * Usage:
 *   npx tsx scripts/populate-resort-images.ts
 *   npx tsx scripts/populate-resort-images.ts --skip-existing
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WIKI_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary";
const WIKI_SEARCH_URL =
  "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&utf8=1";

const MIN_WIDTH = 400;
const DELAY_MS = 800; // Be polite to Wikipedia

interface WikiSummary {
  title: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
}

interface WikiSearchResult {
  title: string;
}

interface ResortEntry {
  id: string;
  name: string;
}

/**
 * Search Wikipedia for the best matching article title.
 * Tries multiple query variations for ski resorts.
 */
async function findWikiTitle(resortName: string): Promise<string | null> {
  const queries = [
    `${resortName} ski resort`,
    `${resortName} ski area`,
    resortName,
  ];

  for (const query of queries) {
    const params = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      srnamespace: "0",
      srlimit: "3",
      format: "json",
      utf8: "1",
    });

    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?${params}`,
      { headers: { "User-Agent": "IkonPassMap/1.0 (resort image script)" } },
    );
    if (!res.ok) continue;

    const data = await res.json();
    const results: WikiSearchResult[] = data?.query?.search ?? [];

    // Look for a result that seems relevant (contains resort name or "ski")
    const nameLower = resortName.toLowerCase();
    const nameWords = nameLower.split(/\s+/).filter((w) => w.length > 3);

    for (const r of results) {
      const titleLower = r.title.toLowerCase();
      // Accept if title contains a significant word from the resort name
      const matched = nameWords.some((w) => titleLower.includes(w));
      if (matched) return r.title;
    }

    // Fall back to first result if it mentions skiing/resort/mountain
    if (results.length > 0) {
      const first = results[0].title.toLowerCase();
      if (
        first.includes("ski") ||
        first.includes("resort") ||
        first.includes("mountain") ||
        first.includes("valley")
      ) {
        return results[0].title;
      }
    }
  }

  return null;
}

/**
 * Get the main image URL from a Wikipedia article.
 */
async function getWikiImage(
  title: string,
): Promise<{ url: string; width: number; height: number } | null> {
  const encoded = encodeURIComponent(title);
  const res = await fetch(`${WIKI_SUMMARY_URL}/${encoded}`, {
    headers: { "User-Agent": "IkonPassMap/1.0 (resort image script)" },
  });

  if (!res.ok) return null;

  const data: WikiSummary = await res.json();

  // Prefer original image, fall back to thumbnail
  const img = data.originalimage ?? data.thumbnail;
  if (!img) return null;

  // Skip SVGs, icons, and tiny images
  if (img.source.endsWith(".svg") || img.width < MIN_WIDTH) return null;

  return { url: img.source, width: img.width, height: img.height };
}

async function main() {
  const resortsPath = path.join(__dirname, "../src/data/resorts.ts");
  const source = fs.readFileSync(resortsPath, "utf-8");

  // Extract resort entries
  const idNameRegex = /id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"/g;
  const entries: ResortEntry[] = [];
  let match;
  while ((match = idNameRegex.exec(source)) !== null) {
    entries.push({ id: match[1], name: match[2] });
  }

  const skipExisting = process.argv.includes("--skip-existing");

  console.log(`\nPopulating resort images (${entries.length} resorts)\n`);

  const imageMap: Record<string, string> = {};
  let found = 0;
  let skipped = 0;
  let notFound = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const progress = `[${i + 1}/${entries.length}]`;

    // Skip if already has imageUrl
    if (skipExisting) {
      const idIdx = source.indexOf(`id: "${entry.id}"`);
      if (idIdx !== -1) {
        const blockEnd = source.indexOf("\n  },", idIdx);
        const block = source.slice(idIdx, blockEnd);
        if (block.includes("imageUrl:")) {
          console.log(`${progress} Skip: ${entry.name} (already has image)`);
          skipped++;
          continue;
        }
      }
    }

    // Search for Wikipedia article
    console.log(`${progress} ${entry.name}`);
    const title = await findWikiTitle(entry.name);

    if (!title) {
      console.log(`  No Wikipedia article found`);
      notFound++;
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    // Get image from the article
    const img = await getWikiImage(title);

    if (img) {
      console.log(
        `  Found: ${img.width}x${img.height} from "${title}"`,
      );
      imageMap[entry.id] = img.url;
      found++;
    } else {
      console.log(`  No usable image on "${title}"`);
      notFound++;
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(
    `\nResults: ${found} images found, ${notFound} not found, ${skipped} skipped\n`,
  );

  if (found === 0) {
    console.log("No images to write.\n");
    return;
  }

  // Inject imageUrl values into resorts.ts
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

    // Check if imageUrl already exists in this block
    const block = updated.slice(idIndex, blockEnd);
    if (block.includes("imageUrl:")) continue;

    // Insert imageUrl before the closing brace
    // Escape any quotes in the URL
    const safeUrl = url.replace(/"/g, '\\"');
    const imageUrlLine = `\n    imageUrl: "${safeUrl}",`;
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
