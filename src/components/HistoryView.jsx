import { useMemo, useState } from "react";
import { formatDateLong, formatDuration, formatTime } from "../lib/format";

export default function HistoryView({ records, todayKey }) {
  const byDate = useMemo(() => {
    const map = {};
    for (const r of records) {
      if (!r.checkIn || r.dateKey === todayKey) continue;
      if (!map[r.dateKey]) map[r.dateKey] = [];
      map[r.dateKey].push(r);
    }
    return map;
  }, [records, todayKey]);

  const dateKeys = useMemo(() => Object.keys(byDate).sort().reverse(), [byDate]);
  const [openDate, setOpenDate] = useState(null);

  if (dateKeys.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white/60 py-10 text-center text-sm text-out">
        لسه مفيش أيام سابقة متسجلة
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {dateKeys.map((dateKey) => {
        const entries = byDate[dateKey];
        const isOpen = openDate === dateKey;

        return (
          <div key={dateKey} className="overflow-hidden rounded-xl border border-line bg-white">
            <button
              onClick={() => setOpenDate(isOpen ? null : dateKey)}
              className="flex w-full items-center justify-between px-4 py-3 text-right"
            >
              <span className="font-semibold text-ink">{formatDateLong(dateKey)}</span>
              <span className="flex items-center gap-3">
                <span className="tabular rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-steel">
                  {entries.length} عامل
                </span>
                <span className={`text-out transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  ⌄
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="divide-y divide-line border-t border-line">
                {entries.map((e) => (
                  <div
                    key={e.workerId}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{e.workerName}</p>
                      {e.siteName && (
                        <p className="text-xs font-medium text-steel">{e.siteName}</p>
                      )}
                    </div>
                    <div className="tabular flex items-center gap-3 text-sm">
                      <span className="text-in">{formatTime(e.checkIn)}</span>
                      <span className="text-out">→</span>
                      <span className="text-out">{formatTime(e.checkOut) || "—"}</span>
                      <span className="rounded-full bg-page px-2 py-0.5 text-xs font-medium text-ink-soft">
                        {formatDuration(e.checkIn, e.checkOut)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
