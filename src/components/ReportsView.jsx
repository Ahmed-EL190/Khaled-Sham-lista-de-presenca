import { useMemo, useState } from "react";
import { buildSiteSummaries, buildWorkerSummaries } from "../lib/reports";
import { formatMonthLabel, formatDateLong, formatDuration, formatTime, todayKey } from "../lib/format";

export default function ReportsView({ workers, sites, records, canPurge = false, onPurgeWorker }) {
  const [mode, setMode] = useState("worker"); // "worker" | "site"

  const monthKeys = useMemo(() => {
    const set = new Set(records.map((r) => r.dateKey?.slice(0, 7)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [records]);

  const currentMonth = todayKey().slice(0, 7);
  const defaultMonth = monthKeys.includes(currentMonth) ? currentMonth : "all";
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedWorkerId, setSelectedWorkerId] = useState("all");

  const filteredRecords = useMemo(() => {
    if (selectedMonth === "all") return records;
    return records.filter((r) => r.dateKey?.startsWith(selectedMonth));
  }, [records, selectedMonth]);

  const workerSummaries = useMemo(
    () => buildWorkerSummaries(workers, filteredRecords),
    [workers, filteredRecords]
  );
  const siteSummaries = useMemo(
    () => buildSiteSummaries(sites, filteredRecords),
    [sites, filteredRecords]
  );

  // worker options: current roster + anyone who appears in the records but isn't in the roster anymore
  const workerOptions = useMemo(() => {
    const map = new Map(workers.map((w) => [w.id, w.name]));
    for (const r of filteredRecords) {
      if (r.checkIn && !map.has(r.workerId)) map.set(r.workerId, r.workerName || "عامل سابق");
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name, "ar")
    );
  }, [workers, filteredRecords]);

  const visibleWorkerSummaries =
    selectedWorkerId === "all"
      ? workerSummaries
      : workerSummaries.filter((w) => w.workerId === selectedWorkerId);

  const selectedWorkerDays = useMemo(() => {
    if (selectedWorkerId === "all") return [];
    return filteredRecords
      .filter((r) => r.workerId === selectedWorkerId && r.checkIn)
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  }, [filteredRecords, selectedWorkerId]);

  const hasData =
    mode === "worker" ? visibleWorkerSummaries.length > 0 : siteSummaries.length > 0;

  function handlePurge(workerId, name) {
    const ok = window.confirm(
      `متأكد إنك عايز تمسح "${name}" نهائي؟\nهيتمسح هو (لو لسه موجود) وكل سجلات حضوره وخصوماته من السجل والتقارير والرواتب، ومفيش رجعة بعد كده.`
    );
    if (!ok) return;
    onPurgeWorker(workerId);
    if (selectedWorkerId === workerId) setSelectedWorkerId("all");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex flex-wrap items-center gap-2">
          {mode === "worker" && (
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-steel"
            >
              <option value="all">كل العمال</option>
              {workerOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-steel"
          >
            <option value="all">كل الوقت</option>
            {monthKeys.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasData && (
        <div className="rounded-xl border border-dashed border-line bg-white/60 py-10 text-center text-sm text-out">
          لسه مفيش سجلات حضور تتحسب في الفترة دي
        </div>
      )}

      {mode === "worker" && hasData && (
        <div className="flex flex-col gap-3">
          {visibleWorkerSummaries.map((w) => (
            <div key={w.workerId} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-bold text-ink">{w.name}</p>
                <div className="flex items-center gap-2">
                  <span className="tabular rounded-full bg-mist px-3 py-1 text-sm font-bold text-steel">
                    {w.totalDays} يوم
                  </span>
                  {canPurge && (
                    <button
                      onClick={() => handlePurge(w.workerId, w.name)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      مسح نهائي
                    </button>
                  )}
                </div>
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

              {selectedWorkerId === w.workerId && selectedWorkerDays.length > 0 && (
                <div className="mt-4 divide-y divide-line border-t border-line pt-2">
                  {selectedWorkerDays.map((d) => (
                    <div
                      key={d.dateKey}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{formatDateLong(d.dateKey)}</p>
                        {d.siteName && <p className="text-xs text-steel">{d.siteName}</p>}
                      </div>
                      <div className="tabular flex items-center gap-2 text-xs text-out">
                        <span className="text-in">{formatTime(d.checkIn)}</span>
                        <span>→</span>
                        <span>{formatTime(d.checkOut) || "—"}</span>
                        <span className="rounded-full bg-page px-2 py-0.5 font-medium text-ink-soft">
                          {formatDuration(d.checkIn, d.checkOut)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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