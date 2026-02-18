/**
 * Fills in remaining resort images using:
 *   1. Direct Wikipedia page lookups with alternative titles
 *   2. Wikimedia Commons image search as fallback
 *
 * Usage: npx tsx scripts/fill-missing-images.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UA = "IkonPassMap/1.0 (resort image fill script)";
const DELAY_MS = 600;

// Alternative Wikipedia page titles for resorts the first pass missed
const WIKI_OVERRIDES: Record<string, string[]> = {
  grandvalira: ["Grandvalira", "Soldeu"],
  megeve: ["Megève", "Megeve ski"],
  "val-gardena": ["Val Gardena", "Selva di Val Gardena"],
  "3-peaks": [
    "Tre Cime di Lavaredo",
    "Three Peaks (Dolomites)",
    "Sesto Dolomites",
  ],
  "val-di-fiemme": ["Val di Fiemme", "Cavalese"],
  "san-martino": [
    "San Martino di Castrozza",
    "Passo Rolle",
    "Pale di San Martino",
  ],
  "rio-pusteria": ["Bressanone", "Plose (mountain)"],
  civetta: ["Monte Civetta", "Alleghe"],
  cervino: ["Breuil-Cervinia", "Cervinia"],
  "la-thuile": ["La Thuile, Aosta Valley", "La Thuile"],
  "mammoth-mountain": ["Mammoth Mountain", "Mammoth Lakes, California"],
  "june-mountain": ["June Mountain ski area", "June Lake, California"],
  "snow-valley": ["Snow Valley Mountain Resort", "Running Springs, California"],
  "sun-valley": ["Sun Valley Resort", "Bald Mountain (Idaho)"],
  "dollar-mountain": ["Sun Valley Resort", "Sun Valley, Idaho"],
  alyeska: ["Alyeska Resort", "Girdwood, Alaska"],
  "crystal-mountain": [
    "Crystal Mountain (Washington)",
    "Crystal Mountain Resort",
  ],
  schweitzer: ["Schweitzer Mountain", "Sandpoint, Idaho"],
  "big-sky": ["Big Sky Resort", "Big Sky, Montana", "Lone Mountain (Montana)"],
  taos: ["Taos Ski Valley, New Mexico", "Taos Ski Valley"],
  "deer-valley": ["Deer Valley", "Deer Valley Resort"],
  alta: ["Alta, Utah", "Alta Ski Area"],
  snowbird: ["Snowbird (ski resort)", "Snowbird, Utah"],
  stratton: [
    "Stratton Mountain Resort",
    "Stratton Mountain (Vermont)",
    "Stratton, Vermont",
  ],
  pico: ["Pico Mountain", "Pico (ski area)", "Killington, Vermont"],
  snowshoe: ["Snowshoe Mountain", "Snowshoe, West Virginia"],
  "sunday-river": [
    "Sunday River (ski resort)",
    "Sunday River",
    "Newry, Maine",
  ],
  sugarloaf: ["Sugarloaf Mountain (Maine)", "Sugarloaf (ski resort)"],
  loon: ["Loon Mountain", "Lincoln, New Hampshire"],
  camelback: ["Camelback Mountain Resort", "Camelback Resort"],
  "lake-louise": [
    "Lake Louise ski resort",
    "Lake Louise, Alberta",
    "Lake Louise",
  ],
  "red-mountain": [
    "Red Mountain Resort",
    "Red Mountain (British Columbia)",
    "Rossland",
  ],
  panorama: [
    "Panorama Mountain Resort",
    "Panorama, British Columbia",
    "Invermere",
  ],
  thredbo: [
    "Thredbo, New South Wales",
    "Thredbo Village",
    "Kosciuszko National Park",
  ],
  arai: ["Lotte Arai Resort", "Myōkō, Niigata"],
  "shiga-kogen": ["Shiga Kogen", "Shiga Highlands"],
  "mt-t": ["Tanigawadake", "Minakami, Gunma"],
  myoko: ["Myōkō, Niigata", "Mount Myōkō"],
  nekoma: ["Nekoma, Fukushima", "Inawashiro, Fukushima"],
  yunding: [
    "National Cross-Country Skiing Centre",
    "Chongli District",
    "Zhangjiakou",
  ],
};

interface ImageResult {
  url: string;
  width: number;
  height: number;
  source: string;
}

/** Try to get an image from a specific Wikipedia page */
async function getWikiPageImage(
  title: string,
): Promise<ImageResult | null> {
  const encoded = encodeURIComponent(title);
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) return null;

  const data = await res.json();
  const img = data.originalimage ?? data.thumbnail;
  if (!img) return null;

  // Skip logos, SVGs, maps, tiny images
  const url: string = img.source;
  if (url.endsWith(".svg") || url.endsWith(".svg.png")) return null;
  if (url.toLowerCase().includes("logo")) return null;
  if (url.toLowerCase().includes("flag")) return null;
  if (url.toLowerCase().includes("coat_of_arms")) return null;
  if (url.toLowerCase().includes("wappen")) return null;
  if (url.toLowerCase().includes("blason")) return null;
  if (url.toLowerCase().includes("posizione")) return null;
  if (url.toLowerCase().includes("location")) return null;
  if (img.width < 400) return null;

  return { url, width: img.width, height: img.height, source: data.title };
}

/** Search Wikimedia Commons for an image */
async function searchCommons(query: string): Promise<ImageResult | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: `${query} ski snow mountain`,
    srnamespace: "6", // File namespace
    srlimit: "10",
    format: "json",
    utf8: "1",
  });

  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) return null;

  const data = await res.json();
  const results = data?.query?.search ?? [];

  for (const result of results) {
    const fileTitle: string = result.title;

    // Skip obviously bad files
    const lower = fileTitle.toLowerCase();
    if (lower.includes("logo")) continue;
    if (lower.includes("flag")) continue;
    if (lower.includes("map")) continue;
    if (lower.includes("diagram")) continue;
    if (lower.includes("icon")) continue;
    if (lower.endsWith(".svg")) continue;

    // Get actual image info
    const infoParams = new URLSearchParams({
      action: "query",
      titles: fileTitle,
      prop: "imageinfo",
      iiprop: "url|size|mime",
      format: "json",
    });

    const infoRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?${infoParams}`,
      { headers: { "User-Agent": UA } },
    );
    if (!infoRes.ok) continue;

    const infoData = await infoRes.json();
    const pages = infoData?.query?.pages ?? {};
    const page = Object.values(pages)[0] as {
      imageinfo?: Array<{
        url: string;
        width: number;
        height: number;
        mime: string;
      }>;
    };
    const info = page?.imageinfo?.[0];
    if (!info) continue;

    // Validate
    if (!info.mime.startsWith("image/")) continue;
    if (info.mime === "image/svg+xml") continue;
    if (info.width < 400) continue;

    return {
      url: info.url,
      width: info.width,
      height: info.height,
      source: `Commons: ${fileTitle}`,
    };
  }

  return null;
}

/** Find image for a resort using all strategies */
async function findImage(
  id: string,
  name: string,
): Promise<ImageResult | null> {
  // Strategy 1: Try override Wikipedia page titles
  const overrides = WIKI_OVERRIDES[id] ?? [];
  for (const title of overrides) {
    const img = await getWikiPageImage(title);
    if (img) return img;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  // Strategy 2: Search Wikimedia Commons
  const img = await searchCommons(name);
  if (img) return img;

  return null;
}

async function main() {
  const resortsPath = path.join(__dirname, "../src/data/resorts.ts");
  let source = fs.readFileSync(resortsPath, "utf-8");

  // Find resorts without imageUrl
  const idNameRegex = /id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"/g;
  const missing: Array<{ id: string; name: string }> = [];
  let match;
  while ((match = idNameRegex.exec(source)) !== null) {
    const id = match[1];
    const idIdx = source.indexOf(`id: "${id}"`);
    const blockEnd = source.indexOf("\n  },", idIdx);
    const block = source.slice(idIdx, blockEnd);
    if (!block.includes("imageUrl:")) {
      missing.push({ id, name: match[2] });
    }
  }

  console.log(`\nFilling ${missing.length} missing resort images\n`);

  const imageMap: Record<string, string> = {};
  let found = 0;

  for (let i = 0; i < missing.length; i++) {
    const { id, name } = missing[i];
    console.log(`[${i + 1}/${missing.length}] ${name}`);

    const img = await findImage(id, name);
    if (img) {
      console.log(
        `  Found: ${img.width}x${img.height} from "${img.source}"`,
      );
      imageMap[id] = img.url;
      found++;
    } else {
      console.log(`  No image found`);
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\nResults: ${found} / ${missing.length} filled\n`);

  if (found === 0) {
    console.log("No new images to write.\n");
    return;
  }

  // Inject into resorts.ts
  let updated = fs.readFileSync(resortsPath, "utf-8");
  for (const [id, url] of Object.entries(imageMap)) {
    const idIndex = updated.indexOf(`id: "${id}"`);
    if (idIndex === -1) continue;
    const blockEnd = updated.indexOf("\n  },", idIndex);
    if (blockEnd === -1) continue;
    const block = updated.slice(idIndex, blockEnd);
    if (block.includes("imageUrl:")) continue;

    const safeUrl = url.replace(/"/g, '\\"');
    updated =
      updated.slice(0, blockEnd) +
      `\n    imageUrl: "${safeUrl}",` +
      updated.slice(blockEnd);
  }

  fs.writeFileSync(resortsPath, updated, "utf-8");
  console.log("resorts.ts updated\n");

  // Update manifest
  const manifestPath = path.join(__dirname, "../resort-images.json");
  let manifest: Record<string, string> = {};
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  }
  Object.assign(manifest, imageMap);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`Manifest updated (${Object.keys(manifest).length} total)\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
