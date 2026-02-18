export interface Resort {
  id: string;
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
  reservationRequired: boolean;
  blackoutDates: string;
  fullPassOnly: boolean;
  powderhoundsUrl: string | null;
  imageUrl?: string;
}

export interface Filters {
  macroRegions: string[];
  colorGroups: string[];
  passType: "all" | "full-only" | "base-included";
  newOnly: boolean;
  noBlackouts: boolean;
  search: string;
}

export const COLOR_MAP: Record<string, string> = {
  "Alps - France/Andorra": "#4361EE",
  "Alps - Switzerland/Austria": "#E63946",
  "Alps - Italy (Dolomites)": "#2EC4B6",
  "Alps - Italy (Valle d'Aosta)": "#57CC99",
  "USA - West": "#F4A261",
  "USA - Pacific NW & Alaska": "#9B5DE5",
  "USA - Rockies": "#3A86FF",
  "USA - Midwest": "#FB8500",
  "USA - East": "#00B4D8",
  "Canada - West": "#FF006E",
  "Canada - East": "#C77DFF",
  "South America": "#80B918",
  "Australia / New Zealand": "#06D6A0",
  Japan: "#EF476F",
  "Asia - Other": "#FFD166",
};

export const MACRO_REGIONS = [
  "Europe",
  "USA",
  "Canada",
  "South America",
  "Oceania",
  "Asia",
] as const;
