import WorkerPicker from "./WorkerPicker";
import { useMemo, useState } from "react";
import { buildSiteDailyReports, buildWorkerSummaries } from "../lib/reports";
import { computeAbsenceDays } from "../lib/payroll";
import { formatMonthLabel, formatDateLong, formatDuration, formatTime, todayKey } from "../lib/format";
import { exportSheetsToExcel } from "../lib/excelExport";

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
  const [mode, setMode] = useState("worker"); // "worker" | "site"

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

  const currentMonth = todayKey().slice(0, 7);
  const defaultMonth = monthKeys.includes(currentMonth) ? currentMonth : "all";
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedWorkerId, setSelectedWorkerId] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  const [siteSearch, setSiteSearch] = useState("");

  const filteredRecords = useMemo(() => {
    if (selectedMonth === "all") return records;
    return records.filter((r) => r.dateKey?.startsWith(selectedMonth));
  }, [records, selectedMonth]);

  const filteredDeductions = useMemo(() => {
    if (selectedMonth === "all") return deductions;
    return deductions.filter((d) => d.dateKey?.startsWith(selectedMonth));
  }, [deductions, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;
    return expenses.filter((e) => e.dateKey?.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  // list of individual days available inside the selected month, for the "يوم بيوم" filter
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

  // عدد أيام الغياب لكل عامل — بيتحسب على شهر كامل (مش على فلتر اليوم)، وبيظهر
  // بس لما يكون فيه شهر محدد (مش "كل الوقت")
  const workerAbsences = useMemo(() => {
    if (selectedMonth === "all") return {};
    const map = {};
    for (const w of workers) {
      map[w.id] = computeAbsenceDays(w, filteredRecords, schedule, selectedMonth).absentDays;
    }
    return map;
  }, [workers, filteredRecords, schedule, selectedMonth]);
  const siteDailyReports = useMemo(
    () => buildSiteDailyReports(sites, dayFilteredRecords, dayFilteredDeductions, dayFilteredExpenses),
    [sites, dayFilteredRecords, dayFilteredDeductions, dayFilteredExpenses]
  );

  // grand totals across all workshops shown here — this is the "الإدارة/كل الورش" view
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

  const periodLabel = selectedMonth === "all" ? "كل الوقت" : formatMonthLabel(selectedMonth);

  function exportReportExcel() {
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
          {mode === "site" && (
            <div className="w-48">
              <input
                value={siteSearch}
                onChange={(e) => setSiteSearch(e.target.value)}
                placeholder="ابحث باسم الورشة"
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-steel"
              />
            </div>
          )}
          {mode === "worker" && (
            <div className="w-48">
              <WorkerPicker
                workers={workerOptions}
                value={selectedWorkerId}
                onChange={setSelectedWorkerId}
                allowAll
                allLabel="كل العمال"
              />
            </div>
          )}

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedDay("all");
            }}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-steel"
          >
            <option value="all">كل الوقت</option>
            {monthKeys.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-steel"
          >
            <option value="all">كل أيام الشهر</option>
            {dayKeys.map((d) => (
              <option key={d} value={d}>
                {formatDateLong(d)}
              </option>
            ))}
          </select>

          <button
            onClick={exportReportExcel}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-mist"
          >
            تصدير Excel
          </button>
        </div>
      </div>

      {mode === "site" && siteDailyReports.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-white p-3 text-xs">
          <span className="font-bold text-ink">إجمالي كل الورش:</span>
          <span className="tabular rounded-full bg-mist px-3 py-1 font-semibold text-steel">
            {grandTotals.days} يوم عمل
          </span>
          <span className="tabular rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-700">
            مصروفات {money(grandTotals.expenses)}
          </span>
          <span className="tabular rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">
            خصومات {money(grandTotals.deductions)}
          </span>
        </div>
      )}

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
                  {selectedMonth !== "all" && (
                    <span
                      title="عدد أيام الغياب في الشهر ده"
                      className={`tabular rounded-full px-3 py-1 text-sm font-bold ${
                        workerAbsences[w.workerId] > 0
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      غياب: {workerAbsences[w.workerId] ?? 0}
                    </span>
                  )}
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

              {selectedWorkerId === w.workerId && (
                <>
                  {selectedWorkerDays.length > 0 && (
                    <div className="mt-4 divide-y divide-line border-t border-line pt-2">
                      {selectedWorkerDays.map((d) => {
                        const dayDeductions = itemsForDay(selectedWorkerDeductions, d.dateKey);
                        const dayExpenses = itemsForDay(selectedWorkerExpenses, d.dateKey);
                        return (
                          <div key={d.dateKey} className="flex flex-col gap-1.5 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
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
                            {(dayDeductions.length > 0 || dayExpenses.length > 0) && (
                              <div className="flex flex-wrap gap-1.5">
                                {dayDeductions.map((item) => (
                                  <span
                                    key={item.id}
                                    className="tabular rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700"
                                  >
                                    خصم {money(item.amount)}
                                    {item.reason ? ` — ${item.reason}` : ""}
                                  </span>
                                ))}
                                {dayExpenses.map((item) => (
                                  <span
                                    key={item.id}
                                    className="tabular rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700"
                                  >
                                    مصروف {money(item.amount)}
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
                  {selectedWorkerDays.length === 0 &&
                    (selectedWorkerDeductions.length > 0 || selectedWorkerExpenses.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                        {selectedWorkerDeductions.map((item) => (
                          <span
                            key={item.id}
                            className="tabular rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700"
                          >
                            خصم {formatDateLong(item.dateKey)} — {money(item.amount)}
                          </span>
                        ))}
                        {selectedWorkerExpenses.map((item) => (
                          <span
                            key={item.id}
                            className="tabular rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700"
                          >
                            مصروف {formatDateLong(item.dateKey)} — {money(item.amount)}
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

      {mode === "site" && hasData && (
        <div className="flex flex-col gap-4">
          {visibleSiteReports.map((s) => (
            <div key={s.siteId} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-bold text-ink">{s.name}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular rounded-full bg-mist px-3 py-1 text-xs font-bold text-steel">
                    {s.totalDays} يوم عمل
                  </span>
                  {s.totalExpenses > 0 && (
                    <span className="tabular rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                      مصروفات {money(s.totalExpenses)}
                    </span>
                  )}
                  {s.totalDeductions > 0 && (
                    <span className="tabular rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                      خصومات {money(s.totalDeductions)}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-col divide-y divide-line border-t border-line">
                {s.days.map((day) => (
                  <div key={day.dateKey} className="flex flex-col gap-2 py-3">
                    <p className="text-sm font-semibold text-ink">{formatDateLong(day.dateKey)}</p>

                    {day.workers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {day.workers.map((r) => (
                          <span
                            key={r.workerId}
                            className="tabular inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-xs font-medium text-ink-soft"
                          >
                            {r.workerName}
                            <span className="text-out">
                              {formatTime(r.checkIn)} → {formatTime(r.checkOut) || "—"}
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
                            className="tabular inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700"
                          >
                            خصم {item.workerName}: {money(item.amount)}
                            {item.reason ? ` — ${item.reason}` : ""}
                            {onRemoveDeduction && canPurge && (
                              <button
                                onClick={() => {
                                  if (window.confirm("متأكد إنك عايز تمسح الخصم ده؟")) {
                                    onRemoveDeduction(item.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-700"
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
                            مصروف {item.workerName}: {money(item.amount)}
                            {item.reason ? ` — ${item.reason}` : ""}
                            {onRemoveExpense && canPurge && (
                              <button
                                onClick={() => {
                                  if (window.confirm("متأكد إنك عايز تمسح المصروف ده؟")) {
                                    onRemoveExpense(item.id);
                                  }
                                }}
                                className="text-orange-400 hover:text-orange-700"
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