"use client";

import { FileText, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CreditGauge from "@/components/landing/CreditGauge";
import {
  creditProfileFor,
  ratingFor,
  SCORE_MAX,
  SCORE_MIN,
} from "@/lib/credit-score";

const GAUGE_MIN = 300;
const GAUGE_MAX = 850;
const REVEAL_MS = 1200;
const PULL_MS = 1100;

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

/**
 * Post-purchase credit dashboard card. The score is derived from `seed` (the
 * buyer's email), so it's stable — refreshing or revisiting never changes it.
 * On load it shows a brief "pulling your report" state, then animates the gauge
 * counting up to the score.
 */
export default function CreditScoreCard({ seed }: { seed: string }) {
  const { bureaus } = creditProfileFor(seed);
  const [active, setActive] = useState(0);
  const current = bureaus[active];
  const target = current.score;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState<string | null>(null);
  const [displayScore, setDisplayScore] = useState(GAUGE_MIN);
  const [revealKey, setRevealKey] = useState(0);
  const displayRef = useRef(GAUGE_MIN);

  // Initial "pulling your latest report" gate (also stamps the date on the
  // client to avoid a hydration mismatch).
  useEffect(() => {
    setUpdated(formatDate(new Date()));
    const t = setTimeout(() => setLoading(false), PULL_MS);
    return () => clearTimeout(t);
  }, []);

  // Count-up tween toward the target whenever it's revealed, the bureau
  // changes, or a refresh re-triggers it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: revealKey is a manual re-trigger for the refresh sweep
  useEffect(() => {
    if (loading) return;
    const from = displayRef.current;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / REVEAL_MS);
      const eased = 1 - (1 - p) ** 3; // easeOutCubic
      const val = Math.round(from + (target - from) * eased);
      displayRef.current = val;
      setDisplayScore(val);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loading, target, revealKey]);

  const rating = ratingFor(displayScore);

  function refresh() {
    if (refreshing || loading) return;
    setRefreshing(true);
    // Sweep from the bottom again — the score itself never changes.
    displayRef.current = GAUGE_MIN;
    setDisplayScore(GAUGE_MIN);
    setTimeout(() => {
      setUpdated(formatDate(new Date()));
      setRefreshing(false);
      setRevealKey((k) => k + 1);
    }, 650);
  }

  const busy = loading || refreshing;
  const trackerFraction = Math.min(
    1,
    Math.max(0, (displayScore - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)),
  );

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_24px_60px_-30px_rgba(11,18,32,0.35)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/8 px-6 py-4">
        <p className="font-display text-lg font-bold text-ink">Credit Score</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-meter-excellent/12 px-2.5 py-1 text-xs font-semibold text-meter-excellent">
          <span className="h-1.5 w-1.5 rounded-full bg-meter-excellent" />
          Monitoring on
        </span>
      </div>

      <div className="px-6 pt-5 pb-6">
        {/* Bureau + updated */}
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-bold text-ink">
            {current.bureau}
            <span className="align-super text-xs text-ink-soft">®</span>
          </p>
          <p className="text-sm text-ink-soft">
            {updated ? `Updated ${updated}` : "Updating…"}
          </p>
        </div>

        {/* Gauge / loading */}
        <div className="mt-3 flex h-[208px] items-center justify-center">
          {loading ? (
            <div className="flex h-[208px] w-[208px] flex-col items-center justify-center rounded-full border-2 border-dashed border-ink/10">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              <p className="mt-3 max-w-[10rem] text-center text-xs font-medium text-ink-soft">
                Pulling your latest report…
              </p>
            </div>
          ) : (
            <CreditGauge
              score={displayScore}
              label={rating.label}
              size={208}
              className="text-ink"
            />
          )}
        </div>

        {/* Bureau dots */}
        <div className="mt-1 flex items-center justify-center gap-2">
          {bureaus.map((b, i) => (
            <button
              key={b.bureau}
              type="button"
              aria-label={`Show ${b.bureau} score`}
              disabled={busy}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all disabled:opacity-50 ${
                i === active ? "w-6 bg-ink" : "w-2 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <a
          href="/account"
          className="press mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          <FileText className="h-4 w-4" />
          View Latest Report
        </a>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="press mt-3 flex w-full flex-col items-center rounded-2xl border border-brand-200 bg-brand-50/60 px-5 py-2.5 text-brand-700 hover:bg-brand-50 disabled:opacity-70"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : "Refresh Report"}
          </span>
          <span className="text-[0.7rem] text-brand-700/70">
            {updated ? `Last updated ${updated}` : "—"}
          </span>
        </button>

        {/* Score tracker */}
        <div className="mt-6 border-t border-ink/8 pt-5">
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              Score Tracker
            </p>
            <span
              className="font-display text-lg font-bold tabular-nums"
              style={{ color: rating.color }}
            >
              {loading ? "—" : displayScore}
            </span>
          </div>
          <div className="relative mt-3 h-2.5 rounded-full bg-gradient-to-r from-meter-poor via-meter-fair to-meter-excellent">
            {!loading && (
              <span
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow"
                style={{
                  left: `${trackerFraction * 100}%`,
                  boxShadow: `0 0 0 3px ${rating.color}`,
                }}
              />
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-soft">
            <span>{GAUGE_MIN}</span>
            <span>
              Range {SCORE_MIN}–{SCORE_MAX}
            </span>
            <span>{GAUGE_MAX}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
