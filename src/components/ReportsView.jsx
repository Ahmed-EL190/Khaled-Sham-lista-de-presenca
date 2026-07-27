import { useMemo, useState } from "react";
import { buildSiteSummaries, buildWorkerSummaries } from "../lib/reports";

export default function ReportsView({ workers, sites, records }) {
  const [mode, setMode] = useState("worker"); // "worker" | "site"

  const workerSummaries = useMemo(
    () => buildWorkerSummaries(workers, records),
    [workers, records]
  );
  const siteSummaries = useMemo(
    () => buildSiteSummaries(sites, records),
    [sites, records]
  );

  const hasData = mode === "worker" ? workerSummaries.length > 0 : siteSummaries.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-lg border border-line bg-white p-1">
        <button
          onClick={() => setMode("worker")}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            mode === "worker" ? "bg-ink text-white" : "text-out hover:text-ink"
          }`}
        >
          حسب العامل
        </button>
        <button
          onClick={() => setMode("site")}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            mode === "site" ? "bg-ink text-white" : "text-out hover:text-ink"
          }`}
        >
          حسب الورشة
        </button>
      </div>

      {!hasData && (
        <div className="rounded-xl border border-dashed border-line bg-white/60 py-10 text-center text-sm text-out">
          لسه مفيش سجلات حضور تتحسب
        </div>
      )}

      {mode === "worker" && hasData && (
        <div className="flex flex-col gap-3">
          {workerSummaries.map((w) => (
            <div key={w.workerId} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-ink">{w.name}</p>
                <span className="tabular rounded-full bg-mist px-3 py-1 text-sm font-bold text-steel">
                  {w.totalDays} يوم
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(w.sites).map(([siteName, days]) => (
                  <span
                    key={siteName}
                    className="tabular inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-xs font-medium text-ink-soft"
                  >
                    {siteName}
                    <span className="font-bold text-ink">{days}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "site" && hasData && (
        <div className="flex flex-col gap-3">
          {siteSummaries.map((s) => (
            <div key={s.siteId} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-ink">{s.name}</p>
                <span className="tabular rounded-full bg-mist px-3 py-1 text-sm font-bold text-steel">
                  {s.totalDays} يوم عمل
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(s.workers).map(([workerName, days]) => (
                  <span
                    key={workerName}
                    className="tabular inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-xs font-medium text-ink-soft"
                  >
                    {workerName}
                    <span className="font-bold text-ink">{days}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
