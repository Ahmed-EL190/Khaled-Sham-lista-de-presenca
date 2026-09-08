import { useMemo, useState } from "react";
import { buildPayrollSummaries, buildSiteCostAllocation } from "../lib/payroll";
import { buildSiteSummaries } from "../lib/reports";
import { formatMonthLabel, formatTime, todayKey } from "../lib/format";
import { exportRowsToExcel } from "../lib/excelExport";
import PayslipModal from "./PayslipModal";
import PayrollAllSlipModal from "./PayrollAllSlipModal";
import SiteCostModal from "./SiteCostModal";
import SiteSummaryModal from "./SiteSummaryModal";

function roundDaily(n) {
  return Math.round((n || 0) * 10) / 10;
}

function money(n) {
  return `${(n || 0).toLocaleString("en-US")} Kz`;
}

function formatPaidAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
  });
  return `${date} - ${formatTime(iso)}`;
}

function sumBy(arr, key) {
  return arr.reduce((sum, item) => sum + (item[key] || 0), 0);
}

export default function PayrollView({
  workers,
  records,
  deductions,
  expenses,
  schedule,
  payments = [],
  onMarkPaid,
  onMarkUnpaid,
  onUpdateWorker,
  onAddDeduction,
  onRemoveDeduction,
  onAddExpense,
  onRemoveExpense,
  onAddAttendance,
  onRemoveAttendance,
}) {
  const monthKeys = useMemo(() => {
    const set = new Set(
      [
        ...records.map((r) => r.dateKey?.slice(0, 7)),
        ...deductions.map((d) => d.dateKey?.slice(0, 7)),
        ...expenses.map((e) => e.dateKey?.slice(0, 7)),
      ].filter(Boolean),
    );
    set.add(todayKey().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [records, deductions, expenses]);

  const [selectedMonth, setSelectedMonth] = useState(todayKey().slice(0, 7));

  const filteredRecords = useMemo(
    () => records.filter((r) => r.dateKey?.startsWith(selectedMonth)),
    [records, selectedMonth],
  );
  const filteredDeductions = useMemo(
    () => deductions.filter((d) => d.dateKey?.startsWith(selectedMonth)),
    [deductions, selectedMonth],
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.dateKey?.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );

  const summaries = useMemo(
    () =>
      buildPayrollSummaries(
        workers,
        filteredRecords,
        filteredDeductions,
        filteredExpenses,
        schedule,
        selectedMonth,
      ),
    [
      workers,
      filteredRecords,
      filteredDeductions,
      filteredExpenses,
      schedule,
      selectedMonth,
    ],
  );

  const [costBasis, setCostBasis] = useState("net");

  const siteAllocation = useMemo(
    () =>
      buildSiteCostAllocation(
        workers,
        filteredRecords,
        schedule,
        summaries,
        selectedMonth,
        costBasis,
      ),
    [workers, filteredRecords, schedule, summaries, selectedMonth, costBasis],
  );

  const siteAttendanceSummary = useMemo(
    () => buildSiteSummaries([], filteredRecords),
    [filteredRecords],
  );

  const [showSiteCost, setShowSiteCost] = useState(false);
  const [showSiteSummary, setShowSiteSummary] = useState(false);

  const paidMap = useMemo(() => {
    const map = {};
    for (const p of payments) {
      if (p.monthKey === selectedMonth) map[p.workerId] = p;
    }
    return map;
  }, [payments, selectedMonth]);

  function togglePaid(s) {
    const existing = paidMap[s.workerId];
    if (existing) {
      onMarkUnpaid?.({ monthKey: selectedMonth, workerId: s.workerId });
    } else {
      onMarkPaid?.({
        monthKey: selectedMonth,
        workerId: s.workerId,
        workerName: s.name,
        amount: s.net,
      });
    }
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());

  function toggleWorker(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredSummaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summaries
      .filter((s) => !q || (s.name || "").toLowerCase().includes(q))
      .filter((s) => {
        if (statusFilter === "paid") return !!paidMap[s.workerId];
        if (statusFilter === "unpaid") return !paidMap[s.workerId];
        return true;
      });
  }, [summaries, search, statusFilter, paidMap]);

  function expandAll() {
    setExpandedIds(new Set(filteredSummaries.map((s) => s.workerId)));
  }
  function collapseAll() {
    setExpandedIds(new Set());
  }

  const totals = useMemo(
    () =>
      filteredSummaries.reduce(
        (acc, s) => {
          acc.gross += s.gross || 0;
          acc.deductions += s.deductionsTotal || 0;
          acc.expenses += s.expensesTotal || 0;
          acc.inss += s.hasInss ? s.inss || 0 : 0;
          acc.net += s.net || 0;
          if (paidMap[s.workerId]) {
            acc.paidCount += 1;
            acc.paidNet += s.net || 0;
          } else {
            acc.unpaidCount += 1;
          }
          return acc;
        },
        {
          gross: 0,
          deductions: 0,
          expenses: 0,
          inss: 0,
          net: 0,
          paidCount: 0,
          paidNet: 0,
          unpaidCount: 0,
        },
      ),
    [filteredSummaries, paidMap],
  );

  const [payslipWorkerId, setPayslipWorkerId] = useState(null);
  const payslipSummary =
    summaries.find((s) => s.workerId === payslipWorkerId) || null;
  const payslipDeductions = filteredDeductions
    .filter((d) => d.workerId === payslipWorkerId)
    .slice()
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  const payslipExpenses = filteredExpenses
    .filter((e) => e.workerId === payslipWorkerId)
    .slice()
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  const payslipAttendance = filteredRecords
    .filter((r) => r.workerId === payslipWorkerId && r.checkIn)
    .slice()
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));

  const [showAllSlip, setShowAllSlip] = useState(false);

  function exportPayrollExcel() {
    const rows = filteredSummaries.map((s, i) => ({
      "#": i + 1,
      العامل: s.name,
      "المرتب الأساسي": s.basicSalary,
      "أيام كاملة": s.fullDays + s.offDaysWorked + s.paidHolidayDays,
      "إجازات مدفوعة": s.paidHolidayDays,
      الغياب: s.absentDays,
      "الأساسي المستحق": s.gross,
      ALMOCO: s.almoco,
      الخصومات: s.deductionsTotal,
      السلف: s.expensesTotal,
      "الضمان الاجتماعي": s.hasInss ? s.inss : 0,
      الصافي: s.net,
      "باقي عليه سلفة": s.debtBalance || 0,
      "الصافي بعد السلفة": s.net - (s.debtBalance || 0),
    }));

    const totalsRow = {
      "#": "",
      العامل: "الإجمالي",
      "المرتب الأساسي": sumBy(filteredSummaries, "basicSalary"),
      "أيام كاملة": "",
      "إجازات مدفوعة": "",
      الغياب: "",
      "الأساسي المستحق": sumBy(filteredSummaries, "gross"),
      ALMOCO: sumBy(filteredSummaries, "almoco"),
      الخصومات: sumBy(filteredSummaries, "deductionsTotal"),
      السلف: sumBy(filteredSummaries, "expensesTotal"),
      "الضمان الاجتماعي": filteredSummaries.reduce(
        (sum, s) => sum + (s.hasInss ? s.inss || 0 : 0),
        0,
      ),
      الصافي: sumBy(filteredSummaries, "net"),
      "باقي عليه سلفة": sumBy(filteredSummaries, "debtBalance"),
      "الصافي بعد السلفة": filteredSummaries.reduce(
        (sum, s) => sum + (s.net || 0) - (s.debtBalance || 0),
        0,
      ),
    };

    exportRowsToExcel(
      [...rows, totalsRow],
      `رواتب - ${formatMonthLabel(selectedMonth)}`,
      "الرواتب",
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header - تحسين للموبايل */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h3 className="text-sm font-bold text-ink sm:text-base">مرتبات الشهر</h3>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {summaries.length > 0 && (
            <button
              onClick={() => setShowAllSlip(true)}
              className="rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-semibold text-steel hover:bg-mist sm:px-3 sm:py-2 sm:text-sm"
            >
              كشف كل العمال
            </button>
          )}
          {siteAllocation.length > 0 && (
            <button
              onClick={() => setShowSiteCost(true)}
              className="rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-semibold text-steel hover:bg-mist sm:px-3 sm:py-2 sm:text-sm"
            >
              توزيع الرواتب
            </button>
          )}
          {siteAttendanceSummary.length > 0 && (
            <button
              onClick={() => setShowSiteSummary(true)}
              className="rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-semibold text-steel hover:bg-mist sm:px-3 sm:py-2 sm:text-sm"
            >
              ملخص الورش
            </button>
          )}
          {filteredSummaries.length > 0 && (
            <button
              onClick={exportPayrollExcel}
              className="rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-semibold text-emerald-700 hover:bg-mist sm:px-3 sm:py-2 sm:text-sm"
            >
              Excel
            </button>
          )}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-medium text-ink outline-none focus:border-steel sm:px-3 sm:py-2 sm:text-sm"
          >
            {monthKeys.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {summaries.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-white/60 py-8 text-center text-sm text-out sm:py-10">
          لسه مفيش بيانات في الشهر ده
        </div>
      )}

      {summaries.length > 0 && (
        <>
          {/* Search bar - تحسين للموبايل */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1">
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-out sm:h-4 sm:w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="دوّر باسم العامل..."
                className="w-full rounded-lg border border-line bg-white py-2 pl-8 pr-8 text-xs text-ink outline-none focus:border-steel sm:pl-3 sm:pr-9 sm:text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-xs text-out hover:bg-page hover:text-ink sm:text-sm"
                  title="امسح البحث"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-semibold text-steel outline-none focus:border-steel sm:flex-none sm:px-3 sm:py-2 sm:text-xs"
              >
                <option value="all">الكل</option>
                <option value="paid">اتصرف</option>
                <option value="unpaid">لسه</option>
              </select>
              <button
                onClick={expandAll}
                className="flex-1 rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-semibold text-steel hover:bg-mist sm:flex-none sm:px-3 sm:py-2 sm:text-xs"
              >
                فتح
              </button>
              <button
                onClick={collapseAll}
                className="flex-1 rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-semibold text-steel hover:bg-mist sm:flex-none sm:px-3 sm:py-2 sm:text-xs"
              >
                غلق
              </button>
            </div>
          </div>

          {/* Summary totals - تحسين للموبايل */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-line bg-white p-3 sm:grid-cols-3 md:grid-cols-6 sm:gap-2 sm:p-4">
            <div className="rounded-lg bg-page/50 px-2 py-1.5 sm:px-3 sm:py-2">
              <p className="text-[9px] text-out sm:text-[11px]">المستحق</p>
              <p className="tabular mt-0.5 text-xs font-bold text-ink sm:text-sm md:text-base">
                {money(totals.gross)}
              </p>
            </div>
            <div className="rounded-lg bg-page/50 px-2 py-1.5 sm:px-3 sm:py-2">
              <p className="text-[9px] text-out sm:text-[11px]">اتصرف</p>
              <p className="tabular mt-0.5 text-xs font-bold text-emerald-600 sm:text-sm md:text-base">
                {totals.paidCount}/{filteredSummaries.length}
              </p>
            </div>
            <div className="rounded-lg bg-page/50 px-2 py-1.5 sm:px-3 sm:py-2">
              <p className="text-[9px] text-out sm:text-[11px]">خصومات</p>
              <p className="tabular mt-0.5 text-xs font-bold text-red-600 sm:text-sm md:text-base">
                {totals.deductions > 0 ? `-${money(totals.deductions)}` : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-page/50 px-2 py-1.5 sm:px-3 sm:py-2">
              <p className="text-[9px] text-out sm:text-[11px]">سلف</p>
              <p className="tabular mt-0.5 text-xs font-bold text-orange-600 sm:text-sm md:text-base">
                {totals.expenses > 0 ? `-${money(totals.expenses)}` : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-page/50 px-2 py-1.5 sm:px-3 sm:py-2">
              <p className="text-[9px] text-out sm:text-[11px]">INSS</p>
              <p className="tabular mt-0.5 text-xs font-bold text-purple-600 sm:text-sm md:text-base">
                {totals.inss > 0 ? `-${money(totals.inss)}` : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-page/50 px-2 py-1.5 sm:px-3 sm:py-2">
              <p className="text-[9px] text-out sm:text-[11px]">الصافي</p>
              <p className="tabular mt-0.5 text-xs font-black text-ink sm:text-sm md:text-lg">
                {money(totals.net)}
              </p>
            </div>
          </div>

          {/* Workers accordion - تحسين للموبايل */}
          {filteredSummaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white/60 py-8 text-center text-sm text-out">
              مفيش عامل بالاسم ده
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSummaries.map((s) => {
                const isOpen = expandedIds.has(s.workerId);
                return (
                  <div
                    key={s.workerId}
                    className="overflow-hidden rounded-xl border border-line bg-white"
                  >
                    <button
                      onClick={() => toggleWorker(s.workerId)}
                      className="flex w-full items-start justify-between gap-1.5 px-3 py-2.5 text-right sm:gap-2 sm:px-4 sm:py-3"
                    >
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 sm:gap-x-2">
                        <svg
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-out transition-transform sm:h-4 sm:w-4 ${
                            isOpen ? "-rotate-90" : ""
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M15 18l-6-6 6-6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="min-w-0 break-words text-sm font-bold text-ink sm:text-base">
                          {s.name}
                        </p>
                        {paidMap[s.workerId] ? (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 sm:px-2 sm:text-[10px]">
                            ✓
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 sm:px-2 sm:text-[10px]">
                            لسه
                          </span>
                        )}
                        {s.debtBalance > 0 && (
                          <span className="shrink-0 rounded-full bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold text-rose-700 sm:px-2 sm:text-[10px]">
                            دين:{money(s.debtBalance)}
                          </span>
                        )}
                      </div>
                      <span className="tabular mt-0.5 shrink-0 text-sm font-black text-ink sm:text-lg">
                        {money(s.net)}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-line px-2 py-2 sm:px-4 sm:py-3">
                        {/* Grid بيانات العامل - 2 columns على الموبايل، 4 على الكبيرة */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:grid-cols-4 sm:gap-2 sm:text-xs">
                          <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                            <p className="text-out">المرتب</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {money(s.monthlyWage)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                            <p className="text-out">اليومية</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {roundDaily(s.dailyWage).toLocaleString("en-US")}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                            <p className="text-out">أيام</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {s.fullDays + s.offDaysWorked + s.paidHolidayDays}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                            <p className="text-out">إجازات</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {s.paidHolidayDays}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                            <p className="text-out">غياب</p>
                            <p className="tabular mt-0.5 font-semibold text-red-600">
                              {s.absentDays}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                            <p className="text-out">المستحق</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {money(s.gross)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                            <p className="text-out">خصومات</p>
                            <p className="tabular mt-0.5 font-semibold text-red-600">
                              {s.deductionsTotal > 0
                                ? `-${money(s.deductionsTotal)}`
                                : "—"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                            <p className="text-out">سلف</p>
                            <p className="tabular mt-0.5 font-semibold text-orange-600">
                              {s.expensesTotal > 0
                                ? `-${money(s.expensesTotal)}`
                                : "—"}
                            </p>
                          </div>
                          {s.hasInss && (
                            <div className="rounded-lg bg-page px-2 py-1.5 sm:px-3 sm:py-2">
                              <p className="text-out">INSS</p>
                              <p className="tabular mt-0.5 font-semibold text-purple-600">
                                -{money(s.inss)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* الأزرار - تحسين للموبايل */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
                          <button
                            onClick={() => setPayslipWorkerId(s.workerId)}
                            className="rounded-lg border border-line px-2 py-1.5 text-[10px] font-semibold text-steel hover:bg-mist sm:px-4 sm:py-2 sm:text-xs"
                          >
                            كشف
                          </button>

                          {paidMap[s.workerId] ? (
                            <button
                              onClick={() => togglePaid(s)}
                              className="flex flex-wrap items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs"
                              title="دوس عشان ترجع تعتبره لسه ما استلمش"
                            >
                              ✓
                              {paidMap[s.workerId].paidAt && (
                                <span className="font-normal text-emerald-600/80">
                                  ({formatPaidAt(paidMap[s.workerId].paidAt)})
                                </span>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => togglePaid(s)}
                              className="rounded-lg bg-ink px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-ink/90 sm:px-3 sm:py-2 sm:text-xs"
                            >
                              سجّل استلام
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {payslipSummary && (
        <PayslipModal
          summary={payslipSummary}
          monthLabel={formatMonthLabel(selectedMonth)}
          monthKey={selectedMonth}
          deductions={payslipDeductions}
          expenses={payslipExpenses}
          attendance={payslipAttendance}
          isPaid={!!paidMap[payslipWorkerId]}
          paidAt={paidMap[payslipWorkerId]?.paidAt || null}
          onTogglePaid={() => togglePaid(payslipSummary)}
          onClose={() => setPayslipWorkerId(null)}
          onUpdateWorker={onUpdateWorker}
          onAddDeduction={onAddDeduction}
          onRemoveDeduction={onRemoveDeduction}
          onAddExpense={onAddExpense}
          onRemoveExpense={onRemoveExpense}
          onAddAttendance={onAddAttendance}
          onRemoveAttendance={onRemoveAttendance}
        />
      )}

      {showAllSlip && (
        <PayrollAllSlipModal
          summaries={summaries}
          monthLabel={formatMonthLabel(selectedMonth)}
          onClose={() => setShowAllSlip(false)}
        />
      )}

      {showSiteCost && (
        <SiteCostModal
          sites={siteAllocation}
          monthLabel={formatMonthLabel(selectedMonth)}
          costBasis={costBasis}
          onChangeCostBasis={setCostBasis}
          onClose={() => setShowSiteCost(false)}
        />
      )}

      {showSiteSummary && (
        <SiteSummaryModal
          sites={siteAttendanceSummary}
          monthLabel={formatMonthLabel(selectedMonth)}
          onClose={() => setShowSiteSummary(false)}
        />
      )}
    </div>
  );
}