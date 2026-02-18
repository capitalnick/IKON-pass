/**
 * Scrapes Powderhounds.com for resort descriptions, pros/cons, and terrain stats.
 * Uses the Wayback Machine as a proxy to avoid Cloudflare protection.
 *
 * Usage: npx tsx scripts/scrape-powderhounds.ts
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

/* ── URL Map: resort id → Powderhounds URL (null = no page) ──────── */

const RESORT_URLS: Record<string, string | null> = {
  // Europe
  grandvalira: "https://www.powderhounds.com/Europe/Andorra/Grandvalira.aspx",
  kitzbuhel: "https://www.powderhounds.com/Europe/Austria/Kitzbuhel.aspx",
  ischgl: "https://www.powderhounds.com/Europe/Austria/Ischgl.aspx",
  chamonix: "https://www.powderhounds.com/Europe/France/Chamonix.aspx",
  megeve: "https://www.powderhounds.com/Europe/France/Megeve.aspx",
  cortina: "https://www.powderhounds.com/Europe/Italy/Cortina.aspx",
  kronplatz: "https://www.powderhounds.com/Europe/Italy/Kronplatz.aspx",
  "alta-badia": "https://www.powderhounds.com/Europe/Italy/Alta-Badia.aspx",
  "val-gardena": "https://www.powderhounds.com/Europe/Italy/Val-Gardena.aspx",
  "val-di-fassa": "https://www.powderhounds.com/Europe/Italy/Val-di-Fassa.aspx",
  arabba: "https://www.powderhounds.com/Europe/Italy/Arabba.aspx",
  "3-peaks": null,
  "val-di-fiemme": null,
  "san-martino": "https://www.powderhounds.com/Europe/Italy/San-Martino.aspx",
  "rio-pusteria": null,
  "alpe-lusia": null,
  civetta: null,
  cervino: "https://www.powderhounds.com/Europe/Italy/Cervinia.aspx",
  courmayeur: "https://www.powderhounds.com/Europe/Italy/Courmayeur.aspx",
  "la-thuile": "https://www.powderhounds.com/Europe/Italy/La-Thuile.aspx",
  monterosa: "https://www.powderhounds.com/Europe/Italy/Monterosa.aspx",
  pila: "https://www.powderhounds.com/Europe/Italy/Pila.aspx",
  zermatt: "https://www.powderhounds.com/Europe/Switzerland/Zermatt.aspx",
  "st-moritz": "https://www.powderhounds.com/Europe/Switzerland/St-Moritz.aspx",

  // USA: West
  "palisades-tahoe":
    "https://www.powderhounds.com/USA/California/Palisades-Tahoe.aspx",
  "sierra-at-tahoe":
    "https://www.powderhounds.com/USA/California/Sierra-at-Tahoe.aspx",
  "mammoth-mountain":
    "https://www.powderhounds.com/USA/California/Mammoth-Mountain.aspx",
  "june-mountain":
    "https://www.powderhounds.com/USA/California/June-Mountain.aspx",
  "bear-mountain":
    "https://www.powderhounds.com/USA/California/Bear-Mountain.aspx",
  "snow-summit":
    "https://www.powderhounds.com/USA/California/Snow-Summit.aspx",
  "snow-valley": null,

  // USA: Pacific NW & Alaska
  "sun-valley": "https://www.powderhounds.com/USA/Idaho/Sun-Valley.aspx",
  "dollar-mountain": null,
  alyeska: "https://www.powderhounds.com/USA/Alaska/Alyeska.aspx",
  "crystal-mountain":
    "https://www.powderhounds.com/USA/Washington/Crystal-Mountain.aspx",
  alpental: "https://www.powderhounds.com/USA/Washington/Alpental.aspx",
  "summit-snoqualmie":
    "https://www.powderhounds.com/USA/Washington/Summit-at-Snoqualmie.aspx",
  "mt-bachelor": "https://www.powderhounds.com/USA/Oregon/Mt-Bachelor.aspx",
  schweitzer: "https://www.powderhounds.com/USA/Idaho/Schweitzer.aspx",

  // USA: Rockies
  "aspen-mountain": "https://www.powderhounds.com/USA/Colorado/Aspen.aspx",
  "aspen-highlands":
    "https://www.powderhounds.com/USA/Colorado/Aspen-Highlands.aspx",
  buttermilk: "https://www.powderhounds.com/USA/Colorado/Buttermilk.aspx",
  snowmass: "https://www.powderhounds.com/USA/Colorado/Snowmass.aspx",
  steamboat: "https://www.powderhounds.com/USA/Colorado/Steamboat.aspx",
  "winter-park": "https://www.powderhounds.com/USA/Colorado/Winter-Park.aspx",
  "copper-mountain":
    "https://www.powderhounds.com/USA/Colorado/Copper-Mountain.aspx",
  "arapahoe-basin":
    "https://www.powderhounds.com/USA/Colorado/Arapahoe-Basin.aspx",
  eldora: "https://www.powderhounds.com/USA/Colorado/Eldora.aspx",
  "jackson-hole":
    "https://www.powderhounds.com/USA/Wyoming/JacksonHole.aspx",
  "big-sky": "https://www.powderhounds.com/USA/Montana/BigSky.aspx",
  taos: "https://www.powderhounds.com/USA/NewMexico/Taos.aspx",
  "deer-valley": "https://www.powderhounds.com/USA/Utah/Deer-Valley.aspx",
  solitude: "https://www.powderhounds.com/USA/Utah/Solitude.aspx",
  brighton: "https://www.powderhounds.com/USA/Utah/Brighton.aspx",
  alta: "https://www.powderhounds.com/USA/Utah/Alta.aspx",
  snowbird: "https://www.powderhounds.com/USA/Utah/Snowbird.aspx",
  snowbasin: "https://www.powderhounds.com/USA/Utah/Snowbasin.aspx",

  // USA: Midwest
  "highlands-mi": null,
  "boyne-mountain": null,

  // USA: East
  stratton: "https://www.powderhounds.com/USA/Vermont/Stratton.aspx",
  sugarbush: "https://www.powderhounds.com/USA/Vermont/Sugarbush.aspx",
  killington: "https://www.powderhounds.com/USA/Vermont/Killington.aspx",
  pico: "https://www.powderhounds.com/USA/Vermont/Pico.aspx",
  snowshoe:
    "https://www.powderhounds.com/USA/WestVirginia/Snowshoe.aspx",
  "sunday-river": "https://www.powderhounds.com/USA/Maine/Sunday-River.aspx",
  sugarloaf: "https://www.powderhounds.com/USA/Maine/Sugarloaf.aspx",
  loon: "https://www.powderhounds.com/USA/NewHampshire/Loon.aspx",
  camelback: null,
  "blue-mountain-pa": null,

  // Canada
  "banff-sunshine":
    "https://www.powderhounds.com/Canada/Banff/Sunshine.aspx",
  "lake-louise":
    "https://www.powderhounds.com/Canada/Banff/Lake-Louise.aspx",
  "mount-norquay":
    "https://www.powderhounds.com/Canada/Banff/Norquay.aspx",
  revelstoke:
    "https://www.powderhounds.com/Canada/BritishColumbia/Revelstoke.aspx",
  cypress:
    "https://www.powderhounds.com/Canada/BritishColumbia/Cypress.aspx",
  "red-mountain":
    "https://www.powderhounds.com/Canada/BritishColumbia/Red-Mountain.aspx",
  panorama:
    "https://www.powderhounds.com/Canada/BritishColumbia/Panorama.aspx",
  "sun-peaks":
    "https://www.powderhounds.com/Canada/BritishColumbia/Sun-Peaks.aspx",
  tremblant: "https://www.powderhounds.com/Canada/Quebec/Tremblant.aspx",
  "le-massif": "https://www.powderhounds.com/Canada/Quebec/Le-Massif.aspx",
  "blue-mountain-on":
    "https://www.powderhounds.com/Canada/Ontario/Blue-Mountain.aspx",

  // South America
  "valle-nevado":
    "https://www.powderhounds.com/SouthAmerica/Chile/Valle-Nevado.aspx",

  // Oceania
  thredbo: "https://www.powderhounds.com/Other/Australia/Thredbo.aspx",
  "mt-buller": "https://www.powderhounds.com/Other/Australia/Mt-Buller.aspx",
  "coronet-peak":
    "https://www.powderhounds.com/NewZealand/Coronet-Peak.aspx",
  remarkables:
    "https://www.powderhounds.com/NewZealand/Remarkables.aspx",
  "mt-hutt": "https://www.powderhounds.com/NewZealand/Mt-Hutt.aspx",

  // Japan
  niseko: "https://www.powderhounds.com/Japan/Hokkaido/Niseko.aspx",
  arai: "https://www.powderhounds.com/Japan/Honshu/Arai.aspx",
  "shiga-kogen":
    "https://www.powderhounds.com/Japan/Honshu/Shiga-Kogen.aspx",
  "mt-t": null,
  myoko:
    "https://www.powderhounds.com/Japan/Honshu/Myoko-Suginohara.aspx",
  appi: null,
  furano: "https://www.powderhounds.com/Japan/Hokkaido/Furano.aspx",
  nekoma: null,
  zao: "https://www.powderhounds.com/Japan/Honshu/Zao-Onsen.aspx",

  // Asia - Other
  yunding: null,
  yongpyong: null,
};

/* ── Terrain stat shape ──────────────────────────────────────────── */

interface TerrainStats {
  runs: string | null;
  longestRun: string | null;
  season: string | null;
  beginner: string | null;
  intermediate: string | null;
  advanced: string | null;
  lifts: string | null;
  vertical: string | null;
  snowfall: string | null;
}

interface PowderhoundsData {
  rating: string | null;
  description: string;
  pros: string[];
  cons: string[];
  proOrCon: string[];
  terrainStats: TerrainStats;
  sourceUrl: string;
  scrapedAt: string;
}

/* ── Fetch via Wayback Machine ───────────────────────────────────── */

async function fetchPage(url: string): Promise<string | null> {
  const waybackUrl = `https://web.archive.org/web/2024/${url}`;

  try {
    const res = await fetch(waybackUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) IkonPassMap/1.0",
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      // Try direct fetch as fallback
      const directRes = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (!directRes.ok) {
        console.warn(`  ✗ ${res.status} (wayback) / ${directRes.status} (direct)`);
        return null;
      }
      return await directRes.text();
    }

    return await res.text();
  } catch (err) {
    console.warn(`  ✗ Fetch error: ${(err as Error).message}`);
    return null;
  }
}

/* ── Parse HTML ──────────────────────────────────────────────────── */

function parsePage(
  html: string,
  sourceUrl: string
): PowderhoundsData {
  const $ = cheerio.load(html);

  // ── Rating ──
  let rating: string | null = null;
  const ratingEl = $("div.hreview-aggregate").first();
  if (ratingEl.length) {
    const avg = ratingEl.find("span.average").text().trim();
    if (avg) rating = avg;
  }

  // ── Description (paragraphs before Pros & Cons h2) ──
  const content = $("div#collapse-overview");
  const descParts: string[] = [];
  let foundFirstH2 = false;

  content.children().each((_i, el) => {
    const tag = (el as cheerio.Element).tagName;
    const text = $(el).text().trim();

    if (tag === "h2") {
      if (!foundFirstH2) {
        foundFirstH2 = true;
        return; // skip title h2
      }
      return false; // stop at "Pros & Cons" h2
    }

    if (foundFirstH2 && tag === "p" && text) {
      descParts.push(text);
    }
  });

  const description = descParts.slice(0, 3).join("\n\n");

  // ── Pros, Cons, Pro or Con ──
  const prosH3 = content
    .find("h3")
    .filter((_i, el) => $(el).text().trim() === "Pros");
  const consH3 = content
    .find("h3")
    .filter((_i, el) => $(el).text().trim() === "Cons");
  const proOrConH3 = content
    .find("h3")
    .filter((_i, el) => $(el).text().includes("Pro or Con"));

  const pros = prosH3
    .next("ul")
    .find("li")
    .map((_i, el) => $(el).text().trim())
    .get();
  const cons = consH3
    .next("ul")
    .find("li")
    .map((_i, el) => $(el).text().trim())
    .get();
  const proOrCon = proOrConH3
    .next("ul")
    .find("li")
    .map((_i, el) => $(el).text().trim())
    .get();

  // ── Terrain Stats ──
  const terrain = parseTerrainStats($);

  return {
    rating,
    description,
    pros,
    cons,
    proOrCon,
    terrainStats: terrain,
    sourceUrl,
    scrapedAt: new Date().toISOString(),
  };
}

function parseTerrainStats(
  $: cheerio.CheerioAPI
): TerrainStats {
  const stats: TerrainStats = {
    runs: null,
    longestRun: null,
    season: null,
    beginner: null,
    intermediate: null,
    advanced: null,
    lifts: null,
    vertical: null,
    snowfall: null,
  };

  const sidebar = $("div.col-left");
  if (!sidebar.length) return stats;

  // Collect all stat headings and values
  const rawStats: Record<string, string> = {};
  sidebar.find("div#TableList li").each((_i, el) => {
    $(el)
      .find("div.text")
      .each((_j, textDiv) => {
        const heading = $(textDiv).find("span.heading").text().trim();
        if (!heading) return;

        const clone = $(textDiv).clone();
        clone.find("span.heading").remove();
        const value = clone.text().trim().replace(/\s+/g, " ");
        if (value) rawStats[heading] = value;
      });
  });

  // Extract structured fields from raw stats
  for (const [key, val] of Object.entries(rawStats)) {
    const keyLower = key.toLowerCase();

    if (keyLower.includes("vertical")) {
      stats.vertical = val.split(/\s{2,}/)[0] || val;
    }

    if (keyLower.includes("average snowfall") || keyLower.includes("snowfall")) {
      stats.snowfall = val;
    }

    if (keyLower.startsWith("lifts")) {
      // "Lifts - Winter (61)" → extract count from heading
      const liftMatch = key.match(/\((\d+)\)/);
      stats.lifts = liftMatch ? liftMatch[1] : val.split(/\s/)[0];
    }

    if (keyLower.includes("opening date")) {
      // Extract season like "Nov to May" or "Dec to Apr"
      const seasonMatch = val.match(
        /(?:Winter\s*[-–]?\s*)?(\w{3,4})\s+to\s+(?:start\s+)?(\w{3,4})/i
      );
      if (seasonMatch) {
        stats.season = `${seasonMatch[1]}–${seasonMatch[2]}`;
      }
    }

    if (keyLower.includes("runs") || keyLower.includes("terrain")) {
      // "Runs - 360km incl. Cervinia" → extract km from heading
      const runsHeadingMatch = key.match(/([\d,]+)\s*km/);
      if (runsHeadingMatch) {
        stats.runs = `${runsHeadingMatch[1]}km`;
      }

      // Value text: "Longest run - 20km" etc.
      const longestMatch = val.match(/longest\s+run\s*[-–]?\s*([\d.]+\s*km)/i);
      if (longestMatch) stats.longestRun = longestMatch[1];

      const beginnerMatch = val.match(/beginner\s*[-–]?\s*(\d+%)/i);
      if (beginnerMatch) stats.beginner = beginnerMatch[1];

      const intermediateMatch = val.match(/intermediate\s*[-–]?\s*(\d+%)/i);
      if (intermediateMatch) stats.intermediate = intermediateMatch[1];

      const advancedMatch = val.match(/advanced\s*[-–]?\s*(\d+%)/i);
      if (advancedMatch) stats.advanced = advancedMatch[1];
    }
  }

  return stats;
}

/* ── Main ────────────────────────────────────────────────────────── */

async function main() {
  const results: Record<string, PowderhoundsData> = {};
  const entries = Object.entries(RESORT_URLS).filter(
    ([, url]) => url !== null
  ) as [string, string][];

  console.log(
    `\nScraping ${entries.length} resorts from Powderhounds (via Wayback Machine)...\n`
  );

  let success = 0;
  let failed = 0;

  for (let i = 0; i < entries.length; i++) {
    const [id, url] = entries[i];
    const progress = `[${i + 1}/${entries.length}]`;
    process.stdout.write(`${progress} ${id}... `);

    const html = await fetchPage(url);
    if (!html) {
      console.log("SKIPPED");
      failed++;
      // Rate limit
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    try {
      const data = parsePage(html, url);
      results[id] = data;
      const parts = [];
      if (data.rating) parts.push(`★${data.rating}`);
      if (data.pros.length) parts.push(`${data.pros.length} pros`);
      if (data.cons.length) parts.push(`${data.cons.length} cons`);
      if (data.description) parts.push(`${data.description.length}ch desc`);
      console.log(`OK (${parts.join(", ")})`);
      success++;
    } catch (err) {
      console.log(`PARSE ERROR: ${(err as Error).message}`);
      failed++;
    }

    // Rate limit between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n✅ ${success} scraped, ${failed} failed/skipped\n`);

  // ── Write output ──
  const outputPath = path.resolve(
    __dirname,
    "../src/data/powderhounds.ts"
  );

  const fileContent = `// AUTO-GENERATED by scripts/scrape-powderhounds.ts — do not edit manually
// Last scraped: ${new Date().toISOString()}

export interface PowderhoundsData {
  rating: string | null;
  description: string;
  pros: string[];
  cons: string[];
  proOrCon: string[];
  terrainStats: {
    runs: string | null;
    longestRun: string | null;
    season: string | null;
    beginner: string | null;
    intermediate: string | null;
    advanced: string | null;
    lifts: string | null;
    vertical: string | null;
    snowfall: string | null;
  };
  sourceUrl: string;
  scrapedAt: string;
}

// Key = resort id from resorts.ts
export const powderhoundsData: Record<string, PowderhoundsData> = ${JSON.stringify(results, null, 2)};
`;

  fs.writeFileSync(outputPath, fileContent, "utf-8");
  console.log(`📁 Written to ${outputPath}\n`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
