import WorkerPicker from "./WorkerPicker";
import { useMemo, useState } from "react";
import { buildSiteDailyReports, buildWorkerSummaries } from "../lib/reports";
import { computeAbsenceDays } from "../lib/payroll";
import { formatMonthLabel, formatDateLong, formatDuration, formatTime } from "../lib/format";

function money(n) {
  return `${(n || 0).toLocaleString("en-US")} Kz`;
}

export default function ReportsView({
  workers,
  sites,
  records,
  deductions = [],
  expenses = [],
  schedule = {},
  canPurge = false,
  onPurgeWorker,
  onRemoveDeduction,
  onRemoveExpense,
}) {
  const [mode, setMode] = useState("worker");
  const [selectedMonth, setSelectedMonth] = useState(null); // null = لسه ما تخترش، هياخد آخر شهر فيه بيانات تلقائي
  const [selectedWorkerId, setSelectedWorkerId] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  const [siteSearch, setSiteSearch] = useState("");

  const monthKeys = useMemo(() => {
    const set = new Set(
      [
        ...records.map((r) => r.dateKey?.slice(0, 7)),
        ...deductions.map((d) => d.dateKey?.slice(0, 7)),
        ...expenses.map((e) => e.dateKey?.slice(0, 7)),
      ].filter(Boolean)
    );
    return Array.from(set).sort().reverse();
  }, [records, deductions, expenses]);

  // بشكل افتراضي بنعرض آخر شهر فيه بيانات بس (أسرع بكتير)، لحد
  // ما المستخدم يختار شهر تاني أو "كل الوقت" بنفسه.
  const effectiveMonth = selectedMonth ?? (monthKeys[0] || "all");

  const filteredRecords = useMemo(() => {
    if (effectiveMonth === "all") return records;
    return records.filter((r) => r.dateKey?.startsWith(effectiveMonth));
  }, [records, effectiveMonth]);

  const filteredDeductions = useMemo(() => {
    if (effectiveMonth === "all") return deductions;
    return deductions.filter((d) => d.dateKey?.startsWith(effectiveMonth));
  }, [deductions, effectiveMonth]);

  const filteredExpenses = useMemo(() => {
    if (effectiveMonth === "all") return expenses;
    return expenses.filter((e) => e.dateKey?.startsWith(effectiveMonth));
  }, [expenses, effectiveMonth]);

  const dayKeys = useMemo(() => {
    const set = new Set(
      [
        ...filteredRecords.map((r) => r.dateKey),
        ...filteredDeductions.map((d) => d.dateKey),
        ...filteredExpenses.map((e) => e.dateKey),
      ].filter(Boolean)
    );
    return Array.from(set).sort().reverse();
  }, [filteredRecords, filteredDeductions, filteredExpenses]);

  const dayFilteredRecords = useMemo(
    () => (selectedDay === "all" ? filteredRecords : filteredRecords.filter((r) => r.dateKey === selectedDay)),
    [filteredRecords, selectedDay]
  );
  const dayFilteredDeductions = useMemo(
    () => (selectedDay === "all" ? filteredDeductions : filteredDeductions.filter((d) => d.dateKey === selectedDay)),
    [filteredDeductions, selectedDay]
  );
  const dayFilteredExpenses = useMemo(
    () => (selectedDay === "all" ? filteredExpenses : filteredExpenses.filter((e) => e.dateKey === selectedDay)),
    [filteredExpenses, selectedDay]
  );

  const workerSummaries = useMemo(
    () => buildWorkerSummaries(workers, dayFilteredRecords),
    [workers, dayFilteredRecords]
  );

  const workerAbsences = useMemo(() => {
    if (effectiveMonth === "all") return {};
    const map = {};
    for (const w of workers) {
      map[w.id] = computeAbsenceDays(w, filteredRecords, schedule, effectiveMonth).absentDays;
    }
    return map;
  }, [workers, filteredRecords, schedule, effectiveMonth]);

  const siteDailyReports = useMemo(
    () => buildSiteDailyReports(sites, dayFilteredRecords, dayFilteredDeductions, dayFilteredExpenses),
    [sites, dayFilteredRecords, dayFilteredDeductions, dayFilteredExpenses]
  );

  const grandTotals = useMemo(
    () =>
      siteDailyReports.reduce(
        (acc, s) => {
          acc.days += s.totalDays;
          acc.deductions += s.totalDeductions;
          acc.expenses += s.totalExpenses;
          return acc;
        },
        { days: 0, deductions: 0, expenses: 0 }
      ),
    [siteDailyReports]
  );

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
    return dayFilteredRecords
      .filter((r) => r.workerId === selectedWorkerId && r.checkIn)
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  }, [dayFilteredRecords, selectedWorkerId]);

  const selectedWorkerDeductions = useMemo(() => {
    if (selectedWorkerId === "all") return [];
    return dayFilteredDeductions.filter((d) => d.workerId === selectedWorkerId);
  }, [dayFilteredDeductions, selectedWorkerId]);

  const selectedWorkerExpenses = useMemo(() => {
    if (selectedWorkerId === "all") return [];
    return dayFilteredExpenses.filter((e) => e.workerId === selectedWorkerId);
  }, [dayFilteredExpenses, selectedWorkerId]);

  function itemsForDay(list, dateKey) {
    return list.filter((x) => x.dateKey === dateKey);
  }

  const visibleSiteReports = useMemo(() => {
    const term = siteSearch.trim();
    if (!term) return siteDailyReports;
    return siteDailyReports.filter((s) => s.name?.includes(term));
  }, [siteDailyReports, siteSearch]);

  const hasData = mode === "worker" ? visibleWorkerSummaries.length > 0 : visibleSiteReports.length > 0;

  const periodLabel = effectiveMonth === "all" ? "كل الوقت" : formatMonthLabel(effectiveMonth);

  async function exportReportExcel() {
    const { exportSheetsToExcel } = await import("../lib/excelExport");
    const attendanceRows = dayFilteredRecords
      .filter((r) => r.checkIn)
      .map((r) => ({
        "العامل": r.workerName || "",
        "الورشة": r.siteName || "",
        "التاريخ": formatDateLong(r.dateKey),
        "حضور": r.checkIn ? formatTime(r.checkIn) : "",
        "انصراف": r.checkOut ? formatTime(r.checkOut) : "",
        "المدة": r.checkIn && r.checkOut ? formatDuration(r.checkIn, r.checkOut) : "",
      }));

    const deductionRows = dayFilteredDeductions.map((d) => ({
      "العامل": d.workerName || "",
      "الورشة": d.siteName || "",
      "التاريخ": formatDateLong(d.dateKey),
      "المبلغ": d.amount || 0,
      "السبب": d.reason || "",
    }));

    const expenseRows = dayFilteredExpenses.map((e) => ({
      "العامل": e.workerName || "",
      "الورشة": e.siteName || "",
      "التاريخ": formatDateLong(e.dateKey),
      "المبلغ": e.amount || 0,
      "السبب": e.reason || "",
    }));

    exportSheetsToExcel(
      [
        { name: "الحضور", rows: attendanceRows },
        { name: "الخصومات", rows: deductionRows },
        { name: "المصروفات", rows: expenseRows },
      ],
      `تقرير - ${periodLabel}`
    );
  }

  function handlePurge(workerId, name) {
    const ok = window.confirm(
      `متأكد إنك عايز تمسح "${name}" نهائي؟\nهيتمسح هو (لو لسه موجود) وكل سجلات حضوره وخصوماته ومصروفاته من السجل والتقارير والرواتب، ومفيش رجعة بعد كده.`
    );
    if (!ok) return;
    onPurgeWorker(workerId);
    if (selectedWorkerId === workerId) setSelectedWorkerId("all");
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {/* Mode toggle */}
        <div className="flex w-full rounded-2xl border border-line/60 bg-white/80 p-1 shadow-sm sm:w-fit">
          <button
            onClick={() => setMode("worker")}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm ${
              mode === "worker"
                ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-md shadow-ink/20"
                : "text-out hover:text-ink hover:bg-mist/50"
            }`}
          >
            👤 حسب العامل
          </button>
          <button
            onClick={() => setMode("site")}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm ${
              mode === "site"
                ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-md shadow-ink/20"
                : "text-out hover:text-ink hover:bg-mist/50"
            }`}
          >
            🏭 حسب الورشة
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {mode === "site" && (
            <div className="w-full sm:w-48">
              <input
                value={siteSearch}
                onChange={(e) => setSiteSearch(e.target.value)}
                placeholder="🔍 ابحث باسم الورشة"
                className="w-full rounded-xl border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
              />
            </div>
          )}
          {mode === "worker" && (
            <div className="w-full sm:w-48">
              <WorkerPicker
                workers={workerOptions}
                value={selectedWorkerId}
                onChange={setSelectedWorkerId}
                allowAll
                allLabel="👥 كل العمال"
                className="w-full rounded-xl border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
              />
            </div>
          )}

          <select
            value={effectiveMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedDay("all");
            }}
            className="rounded-xl border border-line/60 bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
          >
            <option value="all">📅 كل الوقت (أبطأ لو البيانات كتير)</option>
            {monthKeys.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="rounded-xl border border-line/60 bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
          >
            <option value="all">📋 كل أيام الشهر</option>
            {dayKeys.map((d) => (
              <option key={d} value={d}>
                {formatDateLong(d)}
              </option>
            ))}
          </select>

          <button
            onClick={exportReportExcel}
            className="rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-emerald-500/30 sm:px-5"
          >
            📊 تصدير Excel
          </button>
        </div>
      </div>

      {/* Grand totals for site mode */}
      {mode === "site" && siteDailyReports.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line/60 bg-linear-to-br from-white to-gray-50/80 p-3 shadow-sm sm:p-4">
          <span className="text-sm font-bold text-ink">📊 إجمالي كل الورش:</span>
          <span className="tabular rounded-full bg-mist/80 px-3 py-1.5 text-xs font-semibold text-steel sm:px-4 sm:text-sm">
            📅 {grandTotals.days} يوم عمل
          </span>
          <span className="tabular rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 sm:px-4 sm:text-sm">
            💰 مصروفات {money(grandTotals.expenses)}
          </span>
          <span className="tabular rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 sm:px-4 sm:text-sm">
            📉 خصومات {money(grandTotals.deductions)}
          </span>
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="rounded-2xl border border-dashed border-line/60 bg-white/60 py-12 text-center text-sm text-out/70 sm:py-16">
          <span className="block text-4xl mb-3">📭</span>
          لسه مفيش سجلات حضور تتحسب في الفترة دي
        </div>
      )}

      {/* Worker mode */}
      {mode === "worker" && hasData && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {visibleWorkerSummaries.map((w) => (
            <div key={w.workerId} className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-base font-bold text-ink sm:text-lg">{w.name}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular rounded-full bg-mist/80 px-3 py-1.5 text-xs font-bold text-steel sm:px-4 sm:text-sm">
                    📅 {w.totalDays} يوم
                  </span>
                  {effectiveMonth !== "all" && (
                    <span
                      title="عدد أيام الغياب في الشهر ده"
                      className={`tabular rounded-full px-3 py-1.5 text-xs font-bold sm:px-4 sm:text-sm ${
                        workerAbsences[w.workerId] > 0
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      ❌ غياب: {workerAbsences[w.workerId] ?? 0}
                    </span>
                  )}
                  {canPurge && (
                    <button
                      onClick={() => handlePurge(w.workerId, w.name)}
                      className="rounded-xl border border-rose-200/50 px-2.5 py-1.5 text-xs font-medium text-rose-500/70 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                    >
                      🗑 مسح نهائي
                    </button>
                  )}
                </div>
              </div>

              {/* Sites */}
              <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                {Object.entries(w.sites).map(([siteName, days]) => (
                  <span
                    key={siteName}
                    className="tabular inline-flex items-center gap-1.5 rounded-full bg-page/70 px-3 py-1.5 text-xs font-medium text-ink-soft sm:px-4 sm:text-sm"
                  >
                    🏗️ {siteName}
                    <span className="font-bold text-ink">{days}</span>
                  </span>
                ))}
              </div>

              {/* Detailed view for selected worker */}
              {selectedWorkerId === w.workerId && (
                <>
                  {selectedWorkerDays.length > 0 && (
                    <div className="mt-4 divide-y divide-line/60 border-t border-line/60 pt-3">
                      {selectedWorkerDays.map((d) => {
                        const dayDeductions = itemsForDay(selectedWorkerDeductions, d.dateKey);
                        const dayExpenses = itemsForDay(selectedWorkerExpenses, d.dateKey);
                        return (
                          <div key={d.dateKey} className="flex flex-col gap-2 py-3 first:pt-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-ink">
                                  📅 {formatDateLong(d.dateKey)}
                                </p>
                                {d.siteName && (
                                  <p className="text-xs text-steel/70">🏗️ {d.siteName}</p>
                                )}
                              </div>
                              <div className="tabular flex flex-wrap items-center gap-2 text-xs text-out">
                                <span className="text-emerald-600 font-medium">
                                  🟢 {formatTime(d.checkIn)}
                                </span>
                                <span>→</span>
                                <span className={d.checkOut ? "text-rose-600 font-medium" : "text-out"}>
                                  {d.checkOut ? formatTime(d.checkOut) : "..."}
                                </span>
                                <span className="rounded-full bg-mist/60 px-2.5 py-1 font-medium text-ink-soft">
                                  {formatDuration(d.checkIn, d.checkOut)}
                                </span>
                              </div>
                            </div>
                            {(dayDeductions.length > 0 || dayExpenses.length > 0) && (
                              <div className="flex flex-wrap gap-1.5">
                                {dayDeductions.map((item) => (
                                  <span
                                    key={item.id}
                                    className="tabular rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700"
                                  >
                                    📉 خصم {money(item.amount)}
                                    {item.reason ? ` — ${item.reason}` : ""}
                                  </span>
                                ))}
                                {dayExpenses.map((item) => (
                                  <span
                                    key={item.id}
                                    className="tabular rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700"
                                  >
                                    💳 مصروف {money(item.amount)}
                                    {item.reason ? ` — ${item.reason}` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(selectedWorkerDeductions.length > 0 || selectedWorkerExpenses.length > 0) &&
                    selectedWorkerDays.length === 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line/60 pt-3">
                        {selectedWorkerDeductions.map((item) => (
                          <span
                            key={item.id}
                            className="tabular rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700"
                          >
                            📉 خصم {formatDateLong(item.dateKey)} — {money(item.amount)}
                          </span>
                        ))}
                        {selectedWorkerExpenses.map((item) => (
                          <span
                            key={item.id}
                            className="tabular rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700"
                          >
                            💳 مصروف {formatDateLong(item.dateKey)} — {money(item.amount)}
                          </span>
                        ))}
                      </div>
                    )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Site mode */}
      {mode === "site" && hasData && (
        <div className="flex flex-col gap-4">
          {visibleSiteReports.map((s) => (
            <div key={s.siteId} className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-base font-bold text-ink sm:text-lg">🏭 {s.name}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular rounded-full bg-mist/80 px-3 py-1.5 text-xs font-bold text-steel sm:px-4 sm:text-sm">
                    📅 {s.totalDays} يوم عمل
                  </span>
                  {s.totalExpenses > 0 && (
                    <span className="tabular rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 sm:px-4 sm:text-sm">
                      💰 مصروفات {money(s.totalExpenses)}
                    </span>
                  )}
                  {s.totalDeductions > 0 && (
                    <span className="tabular rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 sm:px-4 sm:text-sm">
                      📉 خصومات {money(s.totalDeductions)}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-col divide-y divide-line/60 border-t border-line/60">
                {s.days.map((day) => (
                  <div key={day.dateKey} className="flex flex-col gap-2 py-3 first:pt-3">
                    <p className="text-sm font-semibold text-ink">📅 {formatDateLong(day.dateKey)}</p>

                    {day.workers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {day.workers.map((r) => (
                          <span
                            key={r.workerId}
                            className="tabular inline-flex items-center gap-1.5 rounded-full bg-page/70 px-3 py-1.5 text-xs font-medium text-ink-soft sm:px-4 sm:text-sm"
                          >
                            👤 {r.workerName}
                            <span className="text-out/70">
                              🟢 {formatTime(r.checkIn)} → {r.checkOut ? `🔴 ${formatTime(r.checkOut)}` : "..."}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {(day.deductions.length > 0 || day.expenses.length > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {day.deductions.map((item) => (
                          <span
                            key={item.id}
                            className="tabular inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700"
                          >
                            📉 خصم {item.workerName}: {money(item.amount)}
                            {item.reason ? ` — ${item.reason}` : ""}
                            {onRemoveDeduction && canPurge && (
                              <button
                                onClick={() => {
                                  if (window.confirm("متأكد إنك عايز تمسح الخصم ده؟")) {
                                    onRemoveDeduction(item.id);
                                  }
                                }}
                                className="text-rose-400 transition hover:text-rose-700"
                                title="حذف"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {day.expenses.map((item) => (
                          <span
                            key={item.id}
                            className="tabular inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700"
                          >
                            💳 مصروف {item.workerName}: {money(item.amount)}
                            {item.reason ? ` — ${item.reason}` : ""}
                            {onRemoveExpense && canPurge && (
                              <button
                                onClick={() => {
                                  if (window.confirm("متأكد إنك عايز تمسح المصروف ده؟")) {
                                    onRemoveExpense(item.id);
                                  }
                                }}
                                className="text-orange-400 transition hover:text-orange-700"
                                title="حذف"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}