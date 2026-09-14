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
  onCheckoutAll,
  canUndoCheckoutAll,
  onUndoCheckoutAll,
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
    () =>
      buildPayrollSummaries(
        workers,
        monthRecords,
        monthDeductions,
        monthExpenses,
        schedule,
        currentMonth
      ),
    [workers, monthRecords, monthDeductions, monthExpenses, schedule, currentMonth]
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
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Top stat cards - تصميم محسن */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        <div className="group rounded-2xl border border-line/60 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-steel/30 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-out sm:text-sm">إجمالي العمال</p>
            <span className="text-lg opacity-60">👥</span>
          </div>
          <p className="tabular mt-1.5 text-2xl font-black text-ink sm:text-3xl">
            {workers.length}
          </p>
        </div>

        <button
          onClick={onGoToToday}
          className="group rounded-2xl border border-line/60 bg-white p-4 text-right transition hover:shadow-md hover:border-emerald-300/50 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-out sm:text-sm">حاضر دلوقتي</p>
            <span className="text-lg opacity-60">✅</span>
          </div>
          <p className="tabular mt-1.5 text-2xl font-black text-emerald-600 sm:text-3xl">
            {presentNow}
          </p>
        </button>

        <button
          onClick={onGoToToday}
          className="group rounded-2xl border border-line/60 bg-white p-4 text-right transition hover:shadow-md hover:border-rose-300/50 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-out sm:text-sm">غايبين النهاردة</p>
            <span className="text-lg opacity-60">❌</span>
          </div>
          <p
            className={`tabular mt-1.5 text-2xl font-black sm:text-3xl ${
              absentWorkers.length > 0 ? "text-rose-600" : "text-ink"
            }`}
          >
            {absentWorkers.length}
          </p>
        </button>

        <div className="group rounded-2xl border border-line/60 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-steel/30 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-out sm:text-sm">عدد الورش</p>
            <span className="text-lg opacity-60">🏗️</span>
          </div>
          <p className="tabular mt-1.5 text-2xl font-black text-ink sm:text-3xl">
            {sites.length}
          </p>
        </div>
      </div>

      {/* تراجع فوري لو الانصراف الجماعي حصل بالغلط */}
      {canUndoCheckoutAll && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 shadow-sm sm:p-5">
          <div>
            <p className="text-sm font-bold text-amber-800 sm:text-base">
              ✅ اتسجل انصراف جماعي
            </p>
            {/* <p className="mt-0.5 text-xs text-amber-700/80 sm:text-sm">
              لو ده حصل بالغلط، تقدر ترجّع كل العمال دول لحالة "حاضر" على طول
            </p> */}
          </div>
          <button
            onClick={onUndoCheckoutAll}
            className="shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-800 shadow-sm transition hover:bg-amber-100 sm:px-5 sm:py-3"
          >
            ↩️ تراجع
          </button>
        </div>
      )}

      {/* زرار انصراف جماعي لكل الحاضرين دلوقتي */}
      {presentNow > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4 shadow-sm sm:p-5">
          <div>
            <p className="text-sm font-bold text-emerald-800 sm:text-base">
              {presentNow} عامل لسه حاضر دلوقتي
            </p>
            {/* <p className="mt-0.5 text-xs text-emerald-700/80 sm:text-sm">
              هتسجّل انصراف لكل العمال الحاضرين دفعة واحدة بوقت النهاردة الحالي
            </p> */}
          </div>
          <button
            onClick={() => {
              if (
                window.confirm(
                  `متأكد إنك عايز تسجل انصراف لـ ${presentNow} عامل دفعة واحدة؟`
                )
              ) {
                onCheckoutAll?.();
              }
            }}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:px-5 sm:py-3"
          >
            🔴 انصراف الكل
          </button>
        </div>
      )}

      {/* Payroll summary - تصميم محسن مع تدرج لوني */}
      <div className="rounded-2xl border border-line/60 bg-linear-to-br from-white to-gray-50/80 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-ink sm:text-base">
            📊 مرتبات {formatMonthLabel(currentMonth)}
          </h3>
          <button
            onClick={onGoToPayroll}
            className="flex items-center gap-1 rounded-lg bg-ink/5 px-3 py-1.5 text-xs font-semibold text-steel transition hover:bg-ink/10 hover:text-ink sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
          >
            التفاصيل
            <span className="text-lg">→</span>
          </button>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-line/50 sm:px-4 sm:py-3.5">
            <p className="text-[10px] font-medium text-out sm:text-xs">إجمالي المستحق</p>
            <p className="tabular mt-1 text-base font-bold text-ink sm:text-lg">
              {money(totals.gross)}
            </p>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-line/50 sm:px-4 sm:py-3.5">
            <p className="text-[10px] font-medium text-out sm:text-xs">الخصومات</p>
            <p className="tabular mt-1 text-base font-bold text-rose-600 sm:text-lg">
              {totals.deductions > 0 ? `-${money(totals.deductions)}` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-line/50 sm:px-4 sm:py-3.5">
            <p className="text-[10px] font-medium text-out sm:text-xs">المصروفات/السلف</p>
            <p className="tabular mt-1 text-base font-bold text-amber-600 sm:text-lg">
              {totals.expenses > 0 ? `-${money(totals.expenses)}` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-linear-to-br from-ink to-gray-800 px-3 py-3 shadow-lg shadow-ink/10 sm:px-4 sm:py-3.5">
            <p className="text-[10px] font-medium text-white/70 sm:text-xs">الصافي المطلوب</p>
            <p className="tabular mt-1 text-base font-bold text-white sm:text-lg">
              {money(totals.net)}
            </p>
          </div>
        </div>
      </div>

      {/* Per-site breakdown - تصميم محسن */}
      {sites.length > 0 && (
        <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-3 text-sm font-bold text-ink sm:text-base">
            🏭 الورش دلوقتي
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {siteStats.map((s) => (
              <div
                key={s.id}
                className="group flex items-center justify-between rounded-xl bg-linear-to-br from-gray-50 to-white px-3 py-2.5 transition hover:shadow-md hover:border-steel/30 ring-1 ring-line/50 sm:px-4 sm:py-3"
              >
                <p className="text-sm font-semibold text-ink sm:text-base">
                  {s.name}
                </p>
                <span className={`tabular rounded-full px-2.5 py-1 text-xs font-bold ${
                  s.present > 0 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-mist text-steel"
                } sm:px-3 sm:text-sm`}>
                  {s.present} 👷
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Absent list - تصميم محسن */}
      {absentWorkers.length > 0 && (
        <div className="rounded-2xl border border-rose-200/60 bg-linear-to-br from-rose-50/50 to-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-rose-800 sm:text-base">
              ⚠️ لسه ما جوش النهاردة
            </h3>
            <button
              onClick={onGoToToday}
              className="flex items-center gap-1 rounded-lg bg-rose-100/50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              عرض الكل
              <span className="text-lg">→</span>
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
            {absentWorkers.map((w) => (
              <span
                key={w.id}
                className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 shadow-sm transition hover:shadow-md sm:px-3.5 sm:py-2 sm:text-sm"
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