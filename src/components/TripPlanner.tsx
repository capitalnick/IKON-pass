"use client";

import { useState } from "react";
import {
  TripEntry,
  PassType,
  computeTripSummary,
  ResortStatus,
  SharedBankStatus,
} from "@/lib/tripUtils";
import { resorts as allResorts } from "@/data/resorts";

interface TripPlannerProps {
  trip: TripEntry[];
  passType: PassType;
  onPassTypeChange: (p: PassType) => void;
  onClearTrip: () => void;
  onSelectResort: (resortId: string) => void;
}

function DayBar({
  used,
  allowance,
  exceeded,
}: {
  used: number;
  allowance: number;
  exceeded: boolean;
}) {
  if (allowance === Infinity) return null;
  const pct = Math.min(100, (used / allowance) * 100);
  return (
    <div className="mt-1 h-1 w-full rounded-full bg-border overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          exceeded ? "bg-red-500" : "bg-ikon"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ExceededBadge() {
  return (
    <span className="flex items-center gap-0.5 rounded bg-red-500/20 px-1 py-0.5 text-[10px] font-semibold text-red-400">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      Over limit
    </span>
  );
}

function NotOnPassBadge() {
  return (
    <span className="flex items-center gap-0.5 rounded bg-amber-500/20 px-1 py-0.5 text-[10px] font-semibold text-amber-400">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      Not on pass
    </span>
  );
}

export function TripPlanner({
  trip,
  passType,
  onPassTypeChange,
  onClearTrip,
  onSelectResort,
}: TripPlannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const summary = computeTripSummary(trip, passType);
  const hasTrip = trip.length > 0;

  return (
    <div className="absolute top-4 right-4 z-20 w-[280px] rounded-xl border border-border bg-surface shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-ikon flex-shrink-0"
        >
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="flex-1 text-sm font-bold text-foreground">
          Trip Planner
        </span>
        {hasTrip && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              summary.hasAnyExceeded
                ? "bg-red-500/20 text-red-400"
                : "bg-ikon/20 text-ikon"
            }`}
          >
            {summary.hasAnyExceeded && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            )}
            {summary.totalDays}d
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="h-6 w-6 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Pass type toggle */}
          <div className="flex gap-1 px-3 py-2.5 border-b border-border">
            <button
              onClick={() => onPassTypeChange("full")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                passType === "full"
                  ? "bg-ikon text-white"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              Full Pass
            </button>
            <button
              onClick={() => onPassTypeChange("base")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                passType === "base"
                  ? "bg-ikon text-white"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              Base Pass
            </button>
          </div>

          {/* Trip entries */}
          <div className="max-h-[420px] overflow-y-auto">
            {!hasTrip ? (
              <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <div className="h-10 w-10 rounded-full bg-surface-hover flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-xs text-muted">
                  Select a resort on the map and tap <strong className="text-foreground">Add to Trip</strong>
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {summary.individualResorts.map((rs) => (
                  <ResortRow
                    key={rs.resort.id}
                    status={rs}
                    onClick={() => onSelectResort(rs.resort.id)}
                  />
                ))}
                {summary.sharedBanks.map((bank) => (
                  <SharedBankRow
                    key={bank.group}
                    bank={bank}
                    tripEntries={trip}
                    onSelectResort={onSelectResort}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {hasTrip && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
              <span className="text-xs text-muted">
                <span className="font-semibold text-foreground">{summary.totalDays}</span> total days
              </span>
              <button
                onClick={onClearTrip}
                className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors font-medium"
              >
                Clear trip
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResortRow({
  status,
  onClick,
}: {
  status: ResortStatus;
  onClick: () => void;
}) {
  const { resort, days, allowance, exceeded, notOnPass } = status;
  const allowanceLabel =
    allowance === Infinity ? "\u221E" : String(allowance);

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 hover:bg-surface-hover transition-colors"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-foreground truncate">
              {resort.name}
            </span>
            {exceeded && <ExceededBadge />}
            {notOnPass && <NotOnPassBadge />}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-[11px] font-semibold tabular-nums ${exceeded || notOnPass ? "text-red-400" : "text-ikon"}`}>
              {days}
            </span>
            <span className="text-[11px] text-muted">
              / {notOnPass ? "N/A" : allowanceLabel} days
            </span>
          </div>
          {allowance !== Infinity && !notOnPass && (
            <DayBar used={days} allowance={allowance} exceeded={exceeded} />
          )}
        </div>
      </div>
    </button>
  );
}

function SharedBankRow({
  bank,
  tripEntries,
  onSelectResort,
}: {
  bank: SharedBankStatus;
  tripEntries: TripEntry[];
  onSelectResort: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const allowanceLabel =
    bank.allowance === Infinity ? "\u221E" : String(bank.allowance);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-4 py-2 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`flex-shrink-0 text-muted transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {bank.group}
              </span>
              {bank.exceeded && (
                <span className="flex items-center gap-0.5 rounded bg-red-500/20 px-1 py-0.5 text-[10px] font-semibold text-red-400">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  Shared bank exceeded
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[11px] font-semibold tabular-nums ${bank.exceeded ? "text-red-400" : "text-ikon"}`}>
                {bank.usedDays}
              </span>
              <span className="text-[11px] text-muted">
                / {allowanceLabel} shared days
              </span>
            </div>
            {bank.allowance !== Infinity && (
              <DayBar
                used={bank.usedDays}
                allowance={bank.allowance}
                exceeded={bank.exceeded}
              />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pl-6 border-l-2 border-border ml-4 mb-1">
          {bank.resorts.map((resort) => {
            const entry = tripEntries.find((e) => e.resortId === resort.id);
            if (!entry) return null;
            return (
              <button
                key={resort.id}
                onClick={() => onSelectResort(resort.id)}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-hover transition-colors rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs text-foreground/80 truncate">
                    {resort.name}
                  </span>
                  <span className="text-xs font-semibold text-ikon tabular-nums">
                    {entry.days}d
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
