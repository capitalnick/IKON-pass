import { Resort } from "@/types";
import { resorts as allResorts } from "@/data/resorts";

export type PassType = "full" | "base";

export interface TripEntry {
  resortId: string;
  days: number;
}

/** Parse a day string like "7", "7 (shared)", "Unlimited", "N/A" → number */
export function parseDayLimit(raw: string): number {
  if (!raw || raw === "N/A") return 0;
  if (raw.toLowerCase().startsWith("unlimited")) return Infinity;
  const match = raw.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Get the allowance for a resort given the pass type */
export function getResortAllowance(resort: Resort, passType: PassType): number {
  const raw = passType === "full" ? resort.fullPassDays : resort.basePassDays;
  return parseDayLimit(raw);
}

/** Is this resort available on the given pass type? */
export function isAvailableOnPass(resort: Resort, passType: PassType): boolean {
  const raw = passType === "full" ? resort.fullPassDays : resort.basePassDays;
  return raw !== "N/A" && raw !== "";
}

export interface SharedBankStatus {
  group: string;
  allowance: number;
  usedDays: number;
  exceeded: boolean;
  resorts: Resort[];
}

export interface ResortStatus {
  resort: Resort;
  days: number;
  allowance: number;
  exceeded: boolean;
  notOnPass: boolean;
}

export interface TripSummary {
  totalDays: number;
  individualResorts: ResortStatus[];
  sharedBanks: SharedBankStatus[];
  hasAnyExceeded: boolean;
}

export function computeTripSummary(
  trip: TripEntry[],
  passType: PassType
): TripSummary {
  const resortMap = new Map<string, Resort>(allResorts.map((r) => [r.id, r]));

  const individualEntries: TripEntry[] = [];
  const sharedBankEntries: Map<string, TripEntry[]> = new Map();

  for (const entry of trip) {
    const resort = resortMap.get(entry.resortId);
    if (!resort) continue;

    if (resort.dayBankGroup) {
      const existing = sharedBankEntries.get(resort.dayBankGroup) ?? [];
      sharedBankEntries.set(resort.dayBankGroup, [...existing, entry]);
    } else {
      individualEntries.push(entry);
    }
  }

  const individualResorts: ResortStatus[] = individualEntries
    .map((entry) => {
      const resort = resortMap.get(entry.resortId)!;
      const allowance = getResortAllowance(resort, passType);
      const notOnPass = !isAvailableOnPass(resort, passType);
      return {
        resort,
        days: entry.days,
        allowance,
        exceeded: !notOnPass && allowance !== Infinity && entry.days > allowance,
        notOnPass,
      };
    })
    .sort((a, b) => a.resort.name.localeCompare(b.resort.name));

  const sharedBanks: SharedBankStatus[] = Array.from(
    sharedBankEntries.entries()
  ).map(([group, entries]) => {
    const groupResorts = entries
      .map((e) => resortMap.get(e.resortId)!)
      .sort((a, b) => a.name.localeCompare(b.name));
    const usedDays = entries.reduce((sum, e) => sum + e.days, 0);
    const allowance = getResortAllowance(groupResorts[0], passType);
    return {
      group,
      allowance,
      usedDays,
      exceeded: allowance !== Infinity && usedDays > allowance,
      resorts: groupResorts,
    };
  });

  const totalDays =
    individualResorts.reduce((s, r) => s + r.days, 0) +
    sharedBanks.reduce((s, b) => s + b.usedDays, 0);

  const hasAnyExceeded =
    individualResorts.some((r) => r.exceeded || r.notOnPass) ||
    sharedBanks.some((b) => b.exceeded);

  return { totalDays, individualResorts, sharedBanks, hasAnyExceeded };
}
