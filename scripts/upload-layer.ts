/**
 * Uploads resort data as a Felt data layer (replacing elements).
 * Data layers support setLayerFilters and selectFeature via the JS SDK.
 *
 * Usage: FELT_API_TOKEN=... FELT_MAP_ID=... npx tsx scripts/upload-layer.ts
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const FELT_API = "https://felt.com/api/v2";

interface ResortData {
  name: string;
  group: string;
  macroRegion: string;
  country: string;
  colorGroup: string;
  fullPassDays: string;
  basePassDays: string;
  latitude: number;
  longitude: number;
  isNew: boolean;
  notes: string;
}

const resorts: ResortData[] = [
  { name: "Grandvalira Resorts", group: "Grandvalira Resorts", macroRegion: "Europe", country: "Andorra", colorGroup: "Alps - France/Andorra", fullPassDays: "7", basePassDays: "5", latitude: 42.54, longitude: 1.73, isNew: false, notes: "Includes Grandvalira, Ordino Arcalís and Pal Arinsal." },
  { name: "Kitzbühel", group: "Individual", macroRegion: "Europe", country: "Austria", colorGroup: "Alps - Switzerland/Austria", fullPassDays: "7", basePassDays: "5", latitude: 47.44, longitude: 12.39, isNew: false, notes: "Includes Kirchberg and Mittersill areas" },
  { name: "Ischgl", group: "Individual", macroRegion: "Europe", country: "Austria", colorGroup: "Alps - Switzerland/Austria", fullPassDays: "7", basePassDays: "5", latitude: 47.01, longitude: 10.29, isNew: true, notes: "New 25/26" },
  { name: "Chamonix Mont-Blanc Valley", group: "Chamonix Valley", macroRegion: "Europe", country: "France", colorGroup: "Alps - France/Andorra", fullPassDays: "7", basePassDays: "5", latitude: 45.93, longitude: 6.87, isNew: false, notes: "Includes Grands Montets, Brévent-Flégère, Les Houches" },
  { name: "Mégève", group: "Individual", macroRegion: "Europe", country: "France", colorGroup: "Alps - France/Andorra", fullPassDays: "7", basePassDays: "5", latitude: 45.85, longitude: 6.61, isNew: true, notes: "New 25/26" },
  { name: "Cortina d'Ampezzo", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.53, longitude: 12.13, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Kronplatz/Plan de Corones", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.74, longitude: 11.94, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Alta Badia", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.57, longitude: 11.85, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Val Gardena/Alpe di Siusi", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.55, longitude: 11.71, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Val di Fassa/Carezza", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.43, longitude: 11.61, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Arabba/Marmolada", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.5, longitude: 11.88, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "3 Peaks Dolomites", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.62, longitude: 12.25, isNew: false, notes: "Tre Cime area" },
  { name: "Val di Fiemme/Obereggen", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.27, longitude: 11.37, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "San Martino di Castrozza/Rolle Pass", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.26, longitude: 11.8, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Rio Pusteria – Bressanone", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.72, longitude: 11.58, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Alpe Lusia – San Pellegrino", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.26, longitude: 11.66, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Civetta", group: "Dolomiti Superski", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Dolomites)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 46.38, longitude: 12.07, isNew: false, notes: "Dolomiti Superski shared day bank" },
  { name: "Cervino Ski Paradise", group: "Valle d'Aosta", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Valle d'Aosta)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 45.93, longitude: 7.63, isNew: true, notes: "New 25/26. Also known as Cervinia/Valtournenche" },
  { name: "Courmayeur Mont Blanc", group: "Valle d'Aosta", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Valle d'Aosta)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 45.79, longitude: 6.97, isNew: true, notes: "New 25/26" },
  { name: "La Thuile - Espace San Bernardo", group: "Valle d'Aosta", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Valle d'Aosta)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 45.71, longitude: 6.95, isNew: true, notes: "New 25/26" },
  { name: "Monterosa Ski", group: "Valle d'Aosta", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Valle d'Aosta)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 45.84, longitude: 7.82, isNew: true, notes: "New 25/26. 6 interconnected ski areas" },
  { name: "Pila", group: "Valle d'Aosta", macroRegion: "Europe", country: "Italy", colorGroup: "Alps - Italy (Valle d'Aosta)", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 45.69, longitude: 7.31, isNew: true, notes: "New 25/26" },
  { name: "Zermatt Matterhorn", group: "Individual", macroRegion: "Europe", country: "Switzerland", colorGroup: "Alps - Switzerland/Austria", fullPassDays: "7", basePassDays: "5", latitude: 46.02, longitude: 7.74, isNew: false, notes: "" },
  { name: "St. Moritz", group: "Individual", macroRegion: "Europe", country: "Switzerland", colorGroup: "Alps - Switzerland/Austria", fullPassDays: "7", basePassDays: "5", latitude: 46.49, longitude: 9.83, isNew: false, notes: "" },
  { name: "Palisades Tahoe", group: "Alterra Owned", macroRegion: "USA", country: "California", colorGroup: "USA - West", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 39.2, longitude: -120.24, isNew: false, notes: "Combined Squaw Valley and Alpine Meadows" },
  { name: "Sierra-at-Tahoe", group: "Individual", macroRegion: "USA", country: "California", colorGroup: "USA - West", fullPassDays: "7", basePassDays: "5", latitude: 38.89, longitude: -120.08, isNew: false, notes: "" },
  { name: "Mammoth Mountain", group: "Alterra Owned", macroRegion: "USA", country: "California", colorGroup: "USA - West", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 37.63, longitude: -118.95, isNew: false, notes: "" },
  { name: "June Mountain", group: "Alterra Owned", macroRegion: "USA", country: "California", colorGroup: "USA - West", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 37.78, longitude: -119.09, isNew: false, notes: "" },
  { name: "Bear Mountain", group: "Big Bear Mountain Resort", macroRegion: "USA", country: "California", colorGroup: "USA - West", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 34.21, longitude: -116.85, isNew: false, notes: "" },
  { name: "Snow Summit", group: "Big Bear Mountain Resort", macroRegion: "USA", country: "California", colorGroup: "USA - West", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 34.24, longitude: -116.89, isNew: false, notes: "" },
  { name: "Snow Valley", group: "Big Bear Mountain Resort", macroRegion: "USA", country: "California", colorGroup: "USA - West", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 34.22, longitude: -117.03, isNew: false, notes: "" },
  { name: "Sun Valley", group: "Individual", macroRegion: "USA", country: "Idaho", colorGroup: "USA - Pacific NW & Alaska", fullPassDays: "7", basePassDays: "N/A", latitude: 43.7, longitude: -114.35, isNew: false, notes: "Not on Base Pass" },
  { name: "Dollar Mountain", group: "Individual", macroRegion: "USA", country: "Idaho", colorGroup: "USA - Pacific NW & Alaska", fullPassDays: "7", basePassDays: "N/A", latitude: 43.72, longitude: -114.37, isNew: false, notes: "Not on Base Pass" },
  { name: "Alyeska Resort", group: "Individual", macroRegion: "USA", country: "Alaska", colorGroup: "USA - Pacific NW & Alaska", fullPassDays: "7", basePassDays: "5", latitude: 60.97, longitude: -149.09, isNew: false, notes: "" },
  { name: "Crystal Mountain Resort", group: "Alterra Owned", macroRegion: "USA", country: "Washington", colorGroup: "USA - Pacific NW & Alaska", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 46.93, longitude: -121.47, isNew: false, notes: "" },
  { name: "Alpental", group: "Individual", macroRegion: "USA", country: "Washington", colorGroup: "USA - Pacific NW & Alaska", fullPassDays: "7", basePassDays: "5", latitude: 47.42, longitude: -121.42, isNew: false, notes: "" },
  { name: "The Summit at Snoqualmie", group: "Individual", macroRegion: "USA", country: "Washington", colorGroup: "USA - Pacific NW & Alaska", fullPassDays: "7", basePassDays: "5", latitude: 47.43, longitude: -121.41, isNew: false, notes: "" },
  { name: "Mt. Bachelor", group: "Individual", macroRegion: "USA", country: "Oregon", colorGroup: "USA - Pacific NW & Alaska", fullPassDays: "7", basePassDays: "5", latitude: 43.98, longitude: -121.69, isNew: false, notes: "" },
  { name: "Schweitzer", group: "Individual", macroRegion: "USA", country: "Idaho", colorGroup: "USA - Pacific NW & Alaska", fullPassDays: "7", basePassDays: "5", latitude: 48.37, longitude: -116.62, isNew: false, notes: "" },
  { name: "Aspen Mountain", group: "Aspen Snowmass", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "7 (shared)", basePassDays: "N/A", latitude: 39.18, longitude: -106.82, isNew: false, notes: "Not on Base Pass" },
  { name: "Aspen Highlands", group: "Aspen Snowmass", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "7 (shared)", basePassDays: "N/A", latitude: 39.19, longitude: -106.87, isNew: false, notes: "Not on Base Pass" },
  { name: "Buttermilk", group: "Aspen Snowmass", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "7 (shared)", basePassDays: "N/A", latitude: 39.17, longitude: -106.85, isNew: false, notes: "Not on Base Pass" },
  { name: "Snowmass", group: "Aspen Snowmass", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "7 (shared)", basePassDays: "N/A", latitude: 39.21, longitude: -106.94, isNew: false, notes: "Not on Base Pass" },
  { name: "Steamboat", group: "Alterra Owned", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 40.45, longitude: -106.8, isNew: false, notes: "" },
  { name: "Winter Park Resort", group: "Alterra Owned", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 39.89, longitude: -105.76, isNew: false, notes: "" },
  { name: "Copper Mountain", group: "Alterra Owned", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 39.5, longitude: -106.15, isNew: false, notes: "" },
  { name: "Arapahoe Basin", group: "Alterra Owned", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 39.64, longitude: -105.87, isNew: false, notes: "" },
  { name: "Eldora Mountain Resort", group: "Alterra Owned", macroRegion: "USA", country: "Colorado", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 39.94, longitude: -105.58, isNew: false, notes: "" },
  { name: "Jackson Hole Mountain Resort", group: "Individual", macroRegion: "USA", country: "Wyoming", colorGroup: "USA - Rockies", fullPassDays: "7", basePassDays: "N/A", latitude: 43.59, longitude: -110.86, isNew: false, notes: "Not on Base Pass" },
  { name: "Big Sky Resort", group: "Alterra Owned", macroRegion: "USA", country: "Montana", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 45.28, longitude: -111.4, isNew: false, notes: "" },
  { name: "Taos Ski Valley", group: "Individual", macroRegion: "USA", country: "New Mexico", colorGroup: "USA - Rockies", fullPassDays: "7", basePassDays: "5", latitude: 36.59, longitude: -105.44, isNew: false, notes: "" },
  { name: "Deer Valley Resort", group: "Alterra Owned", macroRegion: "USA", country: "Utah", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 40.64, longitude: -111.48, isNew: false, notes: "" },
  { name: "Solitude Mountain Resort", group: "Alterra Owned", macroRegion: "USA", country: "Utah", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 40.62, longitude: -111.59, isNew: false, notes: "" },
  { name: "Brighton", group: "Alterra Owned", macroRegion: "USA", country: "Utah", colorGroup: "USA - Rockies", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 40.6, longitude: -111.58, isNew: false, notes: "" },
  { name: "Alta Ski Area", group: "AltaSnowbird", macroRegion: "USA", country: "Utah", colorGroup: "USA - Rockies", fullPassDays: "7 (shared)", basePassDays: "N/A", latitude: 40.59, longitude: -111.64, isNew: false, notes: "Not on Base Pass" },
  { name: "Snowbird", group: "AltaSnowbird", macroRegion: "USA", country: "Utah", colorGroup: "USA - Rockies", fullPassDays: "7 (shared)", basePassDays: "N/A", latitude: 40.58, longitude: -111.65, isNew: false, notes: "Not on Base Pass" },
  { name: "Snowbasin", group: "Individual", macroRegion: "USA", country: "Utah", colorGroup: "USA - Rockies", fullPassDays: "7", basePassDays: "5", latitude: 41.22, longitude: -111.86, isNew: false, notes: "" },
  { name: "The Highlands", group: "Individual", macroRegion: "USA", country: "Michigan", colorGroup: "USA - Midwest", fullPassDays: "7", basePassDays: "5", latitude: 44.9, longitude: -84.91, isNew: false, notes: "Harbor Springs, Michigan" },
  { name: "Boyne Mountain", group: "Individual", macroRegion: "USA", country: "Michigan", colorGroup: "USA - Midwest", fullPassDays: "7", basePassDays: "5", latitude: 45.17, longitude: -84.92, isNew: false, notes: "Boyne Falls, Michigan" },
  { name: "Stratton Mountain", group: "Alterra Owned", macroRegion: "USA", country: "Vermont", colorGroup: "USA - East", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 43.11, longitude: -72.91, isNew: false, notes: "" },
  { name: "Sugarbush Resort", group: "Alterra Owned", macroRegion: "USA", country: "Vermont", colorGroup: "USA - East", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 44.14, longitude: -72.89, isNew: false, notes: "" },
  { name: "Killington Resort", group: "Individual", macroRegion: "USA", country: "Vermont", colorGroup: "USA - East", fullPassDays: "7", basePassDays: "5", latitude: 43.67, longitude: -72.82, isNew: false, notes: "" },
  { name: "Pico Mountain", group: "Individual", macroRegion: "USA", country: "Vermont", colorGroup: "USA - East", fullPassDays: "7", basePassDays: "5", latitude: 43.66, longitude: -72.83, isNew: false, notes: "" },
  { name: "Snowshoe Mountain", group: "Alterra Owned", macroRegion: "USA", country: "West Virginia", colorGroup: "USA - East", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 38.4, longitude: -79.99, isNew: false, notes: "" },
  { name: "Sunday River", group: "Alterra Owned", macroRegion: "USA", country: "Maine", colorGroup: "USA - East", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 44.47, longitude: -70.85, isNew: false, notes: "" },
  { name: "Sugarloaf", group: "Alterra Owned", macroRegion: "USA", country: "Maine", colorGroup: "USA - East", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 45.03, longitude: -70.31, isNew: false, notes: "" },
  { name: "Loon Mountain Resort", group: "Individual", macroRegion: "USA", country: "New Hampshire", colorGroup: "USA - East", fullPassDays: "7", basePassDays: "5", latitude: 44.04, longitude: -71.62, isNew: false, notes: "" },
  { name: "Camelback Resort", group: "Individual", macroRegion: "USA", country: "Pennsylvania", colorGroup: "USA - East", fullPassDays: "7", basePassDays: "5", latitude: 41.04, longitude: -75.35, isNew: false, notes: "" },
  { name: "Blue Mountain Resort", group: "Individual", macroRegion: "USA", country: "Pennsylvania", colorGroup: "USA - East", fullPassDays: "7", basePassDays: "5", latitude: 41.17, longitude: -75.49, isNew: false, notes: "" },
  { name: "Banff Sunshine", group: "SkiBig3", macroRegion: "Canada", country: "Alberta", colorGroup: "Canada - West", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 51.11, longitude: -115.77, isNew: false, notes: "SkiBig3 shared day bank" },
  { name: "Lake Louise Ski Resort", group: "SkiBig3", macroRegion: "Canada", country: "Alberta", colorGroup: "Canada - West", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 51.44, longitude: -116.14, isNew: false, notes: "SkiBig3 shared day bank" },
  { name: "Mount Norquay", group: "SkiBig3", macroRegion: "Canada", country: "Alberta", colorGroup: "Canada - West", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: 51.2, longitude: -115.57, isNew: false, notes: "SkiBig3 shared day bank" },
  { name: "Revelstoke Mountain Resort", group: "Individual", macroRegion: "Canada", country: "British Columbia", colorGroup: "Canada - West", fullPassDays: "7", basePassDays: "5", latitude: 51.01, longitude: -118.17, isNew: false, notes: "" },
  { name: "Cypress Mountain", group: "Individual", macroRegion: "Canada", country: "British Columbia", colorGroup: "Canada - West", fullPassDays: "7", basePassDays: "5", latitude: 49.4, longitude: -123.2, isNew: false, notes: "" },
  { name: "Red Mountain", group: "Individual", macroRegion: "Canada", country: "British Columbia", colorGroup: "Canada - West", fullPassDays: "7", basePassDays: "5", latitude: 49.1, longitude: -117.76, isNew: false, notes: "" },
  { name: "Panorama", group: "Individual", macroRegion: "Canada", country: "British Columbia", colorGroup: "Canada - West", fullPassDays: "7", basePassDays: "5", latitude: 50.46, longitude: -116.24, isNew: false, notes: "" },
  { name: "Sun Peaks Resort", group: "Individual", macroRegion: "Canada", country: "British Columbia", colorGroup: "Canada - West", fullPassDays: "7", basePassDays: "5", latitude: 50.88, longitude: -119.89, isNew: false, notes: "" },
  { name: "Tremblant", group: "Alterra Owned", macroRegion: "Canada", country: "Quebec", colorGroup: "Canada - East", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 46.21, longitude: -74.58, isNew: false, notes: "" },
  { name: "Le Massif de Charlevoix", group: "Individual", macroRegion: "Canada", country: "Quebec", colorGroup: "Canada - East", fullPassDays: "7", basePassDays: "5", latitude: 47.29, longitude: -70.68, isNew: true, notes: "New 25/26" },
  { name: "Blue Mountain (ON)", group: "Alterra Owned", macroRegion: "Canada", country: "Ontario", colorGroup: "Canada - East", fullPassDays: "Unlimited", basePassDays: "Unlimited*", latitude: 44.5, longitude: -80.32, isNew: false, notes: "" },
  { name: "Valle Nevado", group: "Individual", macroRegion: "South America", country: "Chile", colorGroup: "South America", fullPassDays: "7", basePassDays: "5", latitude: -33.35, longitude: -70.29, isNew: false, notes: "Andes, near Santiago" },
  { name: "Thredbo", group: "Individual", macroRegion: "Oceania", country: "Australia", colorGroup: "Australia / New Zealand", fullPassDays: "7", basePassDays: "5", latitude: -36.5, longitude: 148.3, isNew: false, notes: "" },
  { name: "Mt Buller", group: "Individual", macroRegion: "Oceania", country: "Australia", colorGroup: "Australia / New Zealand", fullPassDays: "7", basePassDays: "5", latitude: -37.14, longitude: 146.44, isNew: false, notes: "" },
  { name: "Coronet Peak", group: "NZ Super Pass", macroRegion: "Oceania", country: "New Zealand", colorGroup: "Australia / New Zealand", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: -44.92, longitude: 168.73, isNew: false, notes: "NZ Super Pass shared day bank" },
  { name: "The Remarkables", group: "NZ Super Pass", macroRegion: "Oceania", country: "New Zealand", colorGroup: "Australia / New Zealand", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: -45.05, longitude: 168.81, isNew: false, notes: "NZ Super Pass shared day bank" },
  { name: "Mt Hutt", group: "NZ Super Pass", macroRegion: "Oceania", country: "New Zealand", colorGroup: "Australia / New Zealand", fullPassDays: "7 (shared)", basePassDays: "5 (shared)", latitude: -43.51, longitude: 171.53, isNew: false, notes: "NZ Super Pass shared day bank" },
  { name: "Niseko United", group: "Niseko United", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7", basePassDays: "5", latitude: 42.86, longitude: 140.7, isNew: false, notes: "Includes Grand Hirafu, Hanazono, Niseko Village, Annupuri" },
  { name: "Arai Mountain Resort", group: "Individual", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7", basePassDays: "5", latitude: 38.09, longitude: 138.17, isNew: false, notes: "" },
  { name: "Shiga Kogen Mountain Resort", group: "Individual", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7 (combined)", basePassDays: "5 (combined)", latitude: 36.72, longitude: 138.5, isNew: true, notes: "New 25/26. 18 interconnected areas" },
  { name: "Mt.T", group: "Individual", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7", basePassDays: "5", latitude: 36.84, longitude: 139.19, isNew: true, notes: "New 25/26. By Hoshino Resorts" },
  { name: "Myoko Suginohara Ski Resort", group: "Individual", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7", basePassDays: "5", latitude: 37.0, longitude: 138.08, isNew: true, notes: "New 25/26. 8.5km groomed run" },
  { name: "APPI Resort", group: "Individual", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7", basePassDays: "5", latitude: 39.93, longitude: 141.0, isNew: true, notes: "New 25/26. 10m+ annual snowfall" },
  { name: "Furano Ski Resort", group: "Individual", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7", basePassDays: "5", latitude: 43.36, longitude: 142.38, isNew: true, notes: "New 25/26. Hokkaido" },
  { name: "NEKOMA Mountain", group: "Individual", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7", basePassDays: "5", latitude: 37.46, longitude: 140.14, isNew: true, notes: "New 25/26. Fukushima Prefecture" },
  { name: "Zao Onsen Ski Resort", group: "Individual", macroRegion: "Asia", country: "Japan", colorGroup: "Japan", fullPassDays: "7", basePassDays: "5", latitude: 38.11, longitude: 140.44, isNew: true, notes: "New 25/26. Famous for snow monster juhyo trees" },
  { name: "Yunding Snow Park", group: "Individual", macroRegion: "Asia", country: "China", colorGroup: "Asia - Other", fullPassDays: "7", basePassDays: "5", latitude: 40.43, longitude: 115.44, isNew: true, notes: "New 25/26. 2022 Beijing Winter Olympics venue" },
  { name: "Mona Yongpyong", group: "Individual", macroRegion: "Asia", country: "South Korea", colorGroup: "Asia - Other", fullPassDays: "7", basePassDays: "5", latitude: 37.67, longitude: 128.68, isNew: true, notes: "New 25/26. 2018 Pyeongchang Winter Olympics venue" },
];

async function feltRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = process.env.FELT_API_TOKEN;
  if (!token) throw new Error("FELT_API_TOKEN env var is required");

  const res = await fetch(`${FELT_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Felt API ${res.status}: ${body}`);
  }
  return res;
}

function buildGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: resorts.map((r, i) => ({
      type: "Feature" as const,
      id: i + 1,
      geometry: {
        type: "Point" as const,
        coordinates: [r.longitude, r.latitude],
      },
      properties: {
        name: r.name,
        ikon_group: r.colorGroup,
        macro_region: r.macroRegion,
        group_collective: r.group,
        country: r.country,
        full_pass_days: r.fullPassDays,
        base_pass_days: r.basePassDays,
        new_2526: r.isNew ? "Y" : "N",
        notes: r.notes || "",
      },
    })),
  };
}

async function deleteExistingElements(mapId: string) {
  console.log("  Clearing existing elements...");
  const res = await feltRequest(`/maps/${mapId}/elements`);
  const data = await res.json();
  const features = data?.features ?? [];
  for (const feature of features) {
    const id = feature.properties?.["felt:id"];
    if (id) {
      await feltRequest(`/maps/${mapId}/elements/${id}`, { method: "DELETE" });
    }
  }
  if (features.length > 0) console.log(`  Deleted ${features.length} elements.`);
}

async function main() {
  const mapId = process.env.FELT_MAP_ID || process.env.NEXT_PUBLIC_FELT_MAP_ID;
  if (!mapId) throw new Error("FELT_MAP_ID or NEXT_PUBLIC_FELT_MAP_ID env var is required");

  console.log(`\nUploading data layer to map ${mapId}...\n`);

  // Step 0: Delete existing elements (old approach)
  await deleteExistingElements(mapId);

  // Step 1: Write GeoJSON to a temp file
  const geojson = buildGeoJSON();
  const tmpPath = join(process.cwd(), "tmp-resorts.geojson");
  writeFileSync(tmpPath, JSON.stringify(geojson));
  console.log(`  Wrote ${geojson.features.length} features to ${tmpPath}`);

  // Step 2: Request presigned upload URL
  console.log("  Requesting upload URL...");
  const uploadRes = await feltRequest(`/maps/${mapId}/upload`, {
    method: "POST",
    body: JSON.stringify({ name: "Ikon Resorts" }),
  });
  const uploadData = await uploadRes.json();
  const layerId = uploadData.layer_id;
  const presignedUrl = uploadData.url;
  const presignedAttributes = uploadData.presigned_attributes;

  console.log(`  Layer ID: ${layerId}`);

  // Step 3: Upload the GeoJSON file to S3
  console.log("  Uploading GeoJSON to S3...");
  const fileContent = readFileSync(tmpPath);
  const formData = new FormData();
  for (const [key, value] of Object.entries(presignedAttributes)) {
    formData.append(key, value as string);
  }
  formData.append("file", new Blob([fileContent], { type: "application/geo+json" }), "resorts.geojson");

  const s3Res = await fetch(presignedUrl, {
    method: "POST",
    body: formData,
  });

  if (!s3Res.ok && s3Res.status !== 204) {
    throw new Error(`S3 upload failed: ${s3Res.status} ${await s3Res.text()}`);
  }

  // Step 4: Poll for processing completion
  console.log("  Waiting for processing...");
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusRes = await feltRequest(`/maps/${mapId}/layers/${layerId}`);
    const statusData = await statusRes.json();
    const progress = statusData.progress;
    if (progress === "complete" || progress === 1) {
      console.log("  ✓ Processing complete.");
      break;
    }
    process.stdout.write(`  Progress: ${progress}...\r`);
  }

  // Clean up temp file
  const { unlinkSync } = await import("fs");
  unlinkSync(tmpPath);

  console.log("\n━".repeat(50));
  console.log("\n✅ Data layer uploaded!\n");
  console.log(`Layer ID: ${layerId}`);
  console.log(`\nAdd to .env.local:\n`);
  console.log(`  NEXT_PUBLIC_FELT_LAYER_ID=${layerId}\n`);
  console.log("The map will now support filtering via the sidebar.\n");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
