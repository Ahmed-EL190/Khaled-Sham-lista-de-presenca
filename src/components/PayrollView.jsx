import { useMemo, useState } from "react";
import { buildPayrollSummaries } from "../lib/payroll";
import { formatMonthLabel, formatTime, todayKey } from "../lib/format";
import { exportRowsToExcel } from "../lib/excelExport";
import PayslipModal from "./PayslipModal";
import PayrollAllSlipModal from "./PayrollAllSlipModal";

function roundDaily(n) {
  return Math.round((n || 0) * 10) / 10;
}

function money(n) {
  return `${(n || 0).toLocaleString("en-US")} Kz`;
}

// تاريخ + وقت الاستلام لعرضه جنب علامة "اتصرف"
function formatPaidAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
  });
  return `${date} - ${formatTime(iso)}`;
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

  // ---- من استلم مرتبه في الشهر المختار ----
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

  // ---- search + accordion state ----
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | paid | unpaid
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

  // ---- single payslip modal ----
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

  // ---- all-workers payslip modal ----
  const [showAllSlip, setShowAllSlip] = useState(false);

  function exportPayrollExcel() {
    const rows = filteredSummaries.map((s) => ({
      الاسم: s.name,
      "المرتب الشهري": s.monthlyWage,
      اليومية: roundDaily(s.dailyWage),
      "أيام كاملة": s.fullDays,
      الغياب: s.absentDays,
      "أيام في إجازة رسمية اشتغل فيها": s.offDaysWorked,
      "إجازات مدفوعة": s.paidHolidayDays,
      "الإجمالي المستحق": s.gross,
      "بدل الأكل (Almoco)": s.almoco,
      الخصومات: s.deductionsTotal,
      "المصروفات/السلف": s.expensesTotal,
      "الضمان الاجتماعي": s.hasInss ? s.inss : 0,
      الصافي: s.net,
      الحالة: paidMap[s.workerId] ? "اتصرف" : "لسه",
      "تاريخ الاستلام": paidMap[s.workerId]?.paidAt
        ? formatPaidAt(paidMap[s.workerId].paidAt)
        : "",
    }));
    exportRowsToExcel(
      rows,
      `رواتب - ${formatMonthLabel(selectedMonth)}`,
      "الرواتب",
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">مرتبات الشهر</h3>
        <div className="flex items-center gap-2">
          {summaries.length > 0 && (
            <button
              onClick={() => setShowAllSlip(true)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-steel hover:bg-mist"
            >
              كشف كل العمال / PDF
            </button>
          )}
          {filteredSummaries.length > 0 && (
            <button
              onClick={exportPayrollExcel}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-mist"
            >
              تصدير Excel
            </button>
          )}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-steel"
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
        <div className="rounded-xl border border-dashed border-line bg-white/60 py-10 text-center text-sm text-out">
          لسه مفيش بيانات في الشهر ده
        </div>
      )}

      {summaries.length > 0 && (
        <>
          {/* Search bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-out"
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
                className="w-full rounded-lg border border-line bg-white py-2 pl-3 pr-9 text-sm text-ink outline-none focus:border-steel"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-out hover:bg-page hover:text-ink"
                  title="امسح البحث"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-steel outline-none focus:border-steel"
            >
              <option value="all">الكل</option>
              <option value="paid">اتصرف</option>
              <option value="unpaid">لسه ما اتصرفش</option>
            </select>
            <button
              onClick={expandAll}
              className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-steel hover:bg-mist"
            >
              افتح الكل
            </button>
            <button
              onClick={collapseAll}
              className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-steel hover:bg-mist"
            >
              اقفل الكل
            </button>
          </div>

          {/* Summary totals */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-white p-4 sm:grid-cols-6">
            <div>
              <p className="text-[11px] text-out">الإجمالي المستحق</p>
              <p className="tabular mt-0.5 text-base font-bold text-ink">
                {money(totals.gross)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-out">اتصرف</p>
              <p className="tabular mt-0.5 text-base font-bold text-emerald-600">
                {totals.paidCount} / {filteredSummaries.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-out">الخصومات</p>
              <p className="tabular mt-0.5 text-base font-bold text-red-600">
                {totals.deductions > 0 ? `-${money(totals.deductions)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-out">المصروفات/السلف</p>
              <p className="tabular mt-0.5 text-base font-bold text-orange-600">
                {totals.expenses > 0 ? `-${money(totals.expenses)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-out">الضمان الاجتماعي</p>
              <p className="tabular mt-0.5 text-base font-bold text-purple-600">
                {totals.inss > 0 ? `-${money(totals.inss)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-out">الصافي الكلي</p>
              <p className="tabular mt-0.5 text-lg font-black text-ink">
                {money(totals.net)}
              </p>
            </div>
          </div>

          {/* Workers accordion */}
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
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-right"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <svg
                          className={`h-4 w-4 shrink-0 text-out transition-transform ${
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
                        <p className="truncate text-base font-bold text-ink">
                          {s.name}
                        </p>
                        {paidMap[s.workerId] ? (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            اتصرف ✓
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            لسه
                          </span>
                        )}
                      </div>
                      <span className="tabular shrink-0 text-lg font-black text-ink">
                        {money(s.net)}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-line px-4 py-3">
                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          <div className="rounded-lg bg-page px-3 py-2">
                            <p className="text-out">المرتب الشهري</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {money(s.monthlyWage)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-3 py-2">
                            <p className="text-out">اليومية</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {roundDaily(s.dailyWage).toLocaleString("en-US")}{" "}
                              Kz
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-3 py-2">
                            <p className="text-out">أيام كاملة</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {s.fullDays + s.offDaysWorked + s.paidHolidayDays}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-3 py-2">
                            <p className="text-out">منها إجازات مدفوعة</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {s.paidHolidayDays}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-3 py-2">
                            <p className="text-out">الغياب</p>
                            <p className="tabular mt-0.5 font-semibold text-red-600">
                              {s.absentDays}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-3 py-2">
                            <p className="text-out">الإجمالي المستحق</p>
                            <p className="tabular mt-0.5 font-semibold text-ink">
                              {money(s.gross)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-3 py-2">
                            <p className="text-out">الخصومات</p>
                            <p className="tabular mt-0.5 font-semibold text-red-600">
                              {s.deductionsTotal > 0
                                ? `-${money(s.deductionsTotal)}`
                                : "—"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-page px-3 py-2">
                            <p className="text-out">المصروفات/السلف</p>
                            <p className="tabular mt-0.5 font-semibold text-orange-600">
                              {s.expensesTotal > 0
                                ? `-${money(s.expensesTotal)}`
                                : "—"}
                            </p>
                          </div>
                          {s.hasInss && (
                            <div className="rounded-lg bg-page px-3 py-2">
                              <p className="text-out">الضمان الاجتماعي (3%)</p>
                              <p className="tabular mt-0.5 font-semibold text-purple-600">
                                -{money(s.inss)}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setPayslipWorkerId(s.workerId)}
                            className="rounded-lg border border-line py-2 text-xs font-semibold text-steel hover:bg-mist sm:px-6"
                          >
                            كشف / PDF
                          </button>

                          {paidMap[s.workerId] ? (
                            <button
                              onClick={() => togglePaid(s)}
                              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              title="دوس عشان ترجع تعتبره لسه ما استلمش"
                            >
                              اتصرف ✓
                              {paidMap[s.workerId].paidAt && (
                                <span className="font-normal text-emerald-600/80">
                                  ({formatPaidAt(paidMap[s.workerId].paidAt)})
                                </span>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => togglePaid(s)}
                              className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/90"
                            >
                              اتصرف؟ سجّل إنه استلم مرتبه
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
          deductions={payslipDeductions}
          expenses={payslipExpenses}
          onClose={() => setPayslipWorkerId(null)}
        />
      )}

      {showAllSlip && (
        <PayrollAllSlipModal
          summaries={summaries}
          monthLabel={formatMonthLabel(selectedMonth)}
          onClose={() => setShowAllSlip(false)}
        />
      )}
    </div>
  );
}
