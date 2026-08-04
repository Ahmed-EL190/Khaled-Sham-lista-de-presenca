import { useMemo } from "react";
import { buildPayrollSummaries } from "../lib/payroll";
import { formatMonthLabel, todayKey } from "../lib/format";

function money(n) {
  return `${Math.round(n || 0).toLocaleString("en-US")} Kz`;
}

export default function DashboardView({
  workers,
  sites,
  todayRecords,
  allRecords,
  deductions,
  expenses,
  schedule,
  onGoToToday,
  onGoToPayroll,
}) {
  const currentMonth = todayKey().slice(0, 7);

  const presentNow = todayRecords.filter((r) => r.checkIn && !r.checkOut).length;

  const absentWorkers = useMemo(
    () => workers.filter((w) => !todayRecords.some((r) => r.workerId === w.id)),
    [workers, todayRecords]
  );

  const siteStats = useMemo(
    () =>
      sites.map((site) => {
        const siteRecords = todayRecords.filter((r) => r.siteId === site.id);
        return {
          id: site.id,
          name: site.name,
          present: siteRecords.filter((r) => r.checkIn && !r.checkOut).length,
          finished: siteRecords.filter((r) => r.checkIn && r.checkOut).length,
        };
      }),
    [sites, todayRecords]
  );

  const monthRecords = useMemo(
    () => allRecords.filter((r) => r.dateKey?.startsWith(currentMonth)),
    [allRecords, currentMonth]
  );
  const monthDeductions = useMemo(
    () => deductions.filter((d) => d.dateKey?.startsWith(currentMonth)),
    [deductions, currentMonth]
  );
  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.dateKey?.startsWith(currentMonth)),
    [expenses, currentMonth]
  );

  const summaries = useMemo(
    () => buildPayrollSummaries(workers, monthRecords, monthDeductions, monthExpenses, schedule),
    [workers, monthRecords, monthDeductions, monthExpenses, schedule]
  );

  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => {
        acc.gross += s.gross;
        acc.deductions += s.deductionsTotal;
        acc.expenses += s.expensesTotal;
        acc.net += s.net;
        return acc;
      },
      { gross: 0, deductions: 0, expenses: 0, net: 0 }
    );
  }, [summaries]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-out">إجمالي العمال</p>
          <p className="tabular mt-1 text-2xl font-black text-ink">{workers.length}</p>
        </div>
        <button
          onClick={onGoToToday}
          className="rounded-xl border border-line bg-white p-4 text-right transition hover:border-steel"
        >
          <p className="text-xs font-medium text-out">حاضر دلوقتي</p>
          <p className="tabular mt-1 text-2xl font-black text-steel">{presentNow}</p>
        </button>
        <button
          onClick={onGoToToday}
          className="rounded-xl border border-line bg-white p-4 text-right transition hover:border-steel"
        >
          <p className="text-xs font-medium text-out">غايبين النهاردة</p>
          <p
            className={`tabular mt-1 text-2xl font-black ${
              absentWorkers.length > 0 ? "text-red-600" : "text-ink"
            }`}
          >
            {absentWorkers.length}
          </p>
        </button>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-out">عدد الورش</p>
          <p className="tabular mt-1 text-2xl font-black text-ink">{sites.length}</p>
        </div>
      </div>

      {/* Payroll summary for the current month */}
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">مرتبات {formatMonthLabel(currentMonth)}</h3>
          <button
            onClick={onGoToPayroll}
            className="text-xs font-semibold text-steel hover:underline"
          >
            التفاصيل ←
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-page px-3 py-3">
            <p className="text-xs text-out">إجمالي المستحق</p>
            <p className="tabular mt-1 text-lg font-bold text-ink">{money(totals.gross)}</p>
          </div>
          <div className="rounded-lg bg-page px-3 py-3">
            <p className="text-xs text-out">الخصومات</p>
            <p className="tabular mt-1 text-lg font-bold text-red-600">
              {totals.deductions > 0 ? `-${money(totals.deductions)}` : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-page px-3 py-3">
            <p className="text-xs text-out">المصروفات/السلف</p>
            <p className="tabular mt-1 text-lg font-bold text-orange-600">
              {totals.expenses > 0 ? `-${money(totals.expenses)}` : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-mist px-3 py-3">
            <p className="text-xs text-steel">الصافي المطلوب صرفه</p>
            <p className="tabular mt-1 text-lg font-black text-steel">{money(totals.net)}</p>
          </div>
        </div>
      </div>

      {/* Per-site breakdown */}
      {sites.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-ink">الورش دلوقتي</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {siteStats.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-page px-3 py-2.5"
              >
                <p className="text-sm font-semibold text-ink">{s.name}</p>
                <span className="tabular rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-steel">
                  {s.present} في الورشة
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Absent list */}
      {absentWorkers.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">لسه ما جوش النهاردة</h3>
            <button onClick={onGoToToday} className="text-xs font-semibold text-steel hover:underline">
              عرض الكل ←
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {absentWorkers.map((w) => (
              <span
                key={w.id}
                className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
              >
                {w.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}