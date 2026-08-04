import { useMemo, useState } from "react";
import { buildPayrollSummaries } from "../lib/payroll";
import { formatMonthLabel, formatDateLong, todayKey } from "../lib/format";

function roundDaily(n) {
  return Math.round((n || 0) * 10) / 10;
}

function money(n) {
  return `${(n || 0).toLocaleString("en-US")} Kz`;
}

export default function PayrollView({
  workers,
  records,
  deductions,
  expenses,
  schedule,
  onAddDeduction,
  onRemoveDeduction,
  onUpdateDeduction,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  function startEdit(d) {
    setEditingId(d.id);
    setEditAmount(d.amount);
  }

  function saveEdit(d) {
    const num = Number(editAmount);
    if (!Number.isNaN(num) && num !== Number(d.amount)) {
      onUpdateDeduction(d.id, { amount: num });
    }
    setEditingId(null);
  }
  const monthKeys = useMemo(() => {
    const set = new Set([
      ...records.map((r) => r.dateKey?.slice(0, 7)),
      ...deductions.map((d) => d.dateKey?.slice(0, 7)),
      ...expenses.map((e) => e.dateKey?.slice(0, 7)),
    ].filter(Boolean));
    set.add(todayKey().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [records, deductions, expenses]);

  const [selectedMonth, setSelectedMonth] = useState(todayKey().slice(0, 7));

  const filteredRecords = useMemo(
    () => records.filter((r) => r.dateKey?.startsWith(selectedMonth)),
    [records, selectedMonth]
  );
  const filteredDeductions = useMemo(
    () => deductions.filter((d) => d.dateKey?.startsWith(selectedMonth)),
    [deductions, selectedMonth]
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.dateKey?.startsWith(selectedMonth)),
    [expenses, selectedMonth]
  );

  const summaries = useMemo(
    () => buildPayrollSummaries(workers, filteredRecords, filteredDeductions, filteredExpenses, schedule),
    [workers, filteredRecords, filteredDeductions, filteredExpenses, schedule]
  );

  // ---- add deduction form ----
  const [formWorkerId, setFormWorkerId] = useState(workers[0]?.id || "");
  const [formAmount, setFormAmount] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formDate, setFormDate] = useState(todayKey());

  function submitDeduction(e) {
    e.preventDefault();
    const worker = workers.find((w) => w.id === formWorkerId);
    if (!worker || !formAmount) return;
    onAddDeduction({
      workerId: worker.id,
      workerName: worker.name,
      dateKey: formDate,
      amount: formAmount,
      reason: formReason,
    });
    setFormAmount("");
    setFormReason("");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">مرتبات الشهر</h3>
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

      {summaries.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-white/60 py-10 text-center text-sm text-out">
          لسه مفيش بيانات في الشهر ده
        </div>
      )}

      {/* Mobile: stacked cards */}
      {summaries.length > 0 && (
        <div className="flex flex-col gap-3 sm:hidden">
          {summaries.map((s) => (
            <div key={s.workerId} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-ink">{s.name}</p>
                <span className="tabular text-lg font-black text-ink">{money(s.net)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="text-out">المرتب الشهري</p>
                  <p className="tabular mt-0.5 font-semibold text-ink">{money(s.monthlyWage)}</p>
                </div>
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="text-out">اليومية</p>
                  <p className="tabular mt-0.5 font-semibold text-ink">
                    {roundDaily(s.dailyWage).toLocaleString("en-US")} Kz
                  </p>
                </div>
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="text-out">أيام كاملة</p>
                  <p className="tabular mt-0.5 font-semibold text-ink">
                    {s.fullDays + s.offDaysWorked}
                  </p>
                </div>
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="text-out">نص أيام</p>
                  <p className="tabular mt-0.5 font-semibold text-ink">{s.halfDays}</p>
                </div>
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="text-out">الإجمالي المستحق</p>
                  <p className="tabular mt-0.5 font-semibold text-ink">{money(s.gross)}</p>
                </div>
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="text-out">الخصومات</p>
                  <p className="tabular mt-0.5 font-semibold text-red-600">
                    {s.deductionsTotal > 0 ? `-${money(s.deductionsTotal)}` : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="text-out">المصروفات/السلف</p>
                  <p className="tabular mt-0.5 font-semibold text-orange-600">
                    {s.expensesTotal > 0 ? `-${money(s.expensesTotal)}` : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop / tablet: table */}
      {summaries.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border border-line bg-white sm:block">
          <table className="w-full min-w-160 text-right text-sm">
            <thead>
              <tr className="border-b border-line bg-page text-xs text-out">
                <th className="px-3 py-2 font-semibold">العامل</th>
                <th className="px-3 py-2 font-semibold">المرتب الشهري</th>
                <th className="px-3 py-2 font-semibold">اليومية</th>
                <th className="px-3 py-2 font-semibold">أيام كاملة</th>
                <th className="px-3 py-2 font-semibold">نص أيام</th>
                <th className="px-3 py-2 font-semibold">الإجمالي المستحق</th>
                <th className="px-3 py-2 font-semibold">الخصومات</th>
                <th className="px-3 py-2 font-semibold">المصروفات/السلف</th>
                <th className="px-3 py-2 font-semibold">الصافي</th>
              </tr>
            </thead>
            <tbody className="tabular divide-y divide-line">
              {summaries.map((s) => (
                <tr key={s.workerId}>
                  <td className="px-3 py-2 font-semibold text-ink">{s.name}</td>
                  <td className="px-3 py-2 text-ink-soft">{money(s.monthlyWage)}</td>
                  <td className="px-3 py-2 text-ink-soft">
                    {roundDaily(s.dailyWage).toLocaleString("en-US")} Kz
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{s.fullDays + s.offDaysWorked}</td>
                  <td className="px-3 py-2 text-ink-soft">{s.halfDays}</td>
                  <td className="px-3 py-2 text-ink-soft">{money(s.gross)}</td>
                  <td className="px-3 py-2 text-red-600">
                    {s.deductionsTotal > 0 ? `-${money(s.deductionsTotal)}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-orange-600">
                    {s.expensesTotal > 0 ? `-${money(s.expensesTotal)}` : "—"}
                  </td>
                  <td className="px-3 py-2 font-bold text-in">{money(s.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add deduction */}
      <div className="rounded-xl border border-line bg-white p-4">
        <h3 className="text-sm font-bold text-ink">تسجيل خصم</h3>
        <form onSubmit={submitDeduction} className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2">
          <div className="flex w-full flex-col gap-1 sm:w-44">
            <label className="text-[11px] text-out">العامل</label>
            <select
              value={formWorkerId}
              onChange={(e) => setFormWorkerId(e.target.value)}
              className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-36">
            <label className="text-[11px] text-out">التاريخ</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="tabular w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-24">
            <label className="text-[11px] text-out">المبلغ (Kz)</label>
            <input
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0"
              className="tabular w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
          <div className="flex w-full flex-1 flex-col gap-1 sm:min-w-40">
            <label className="text-[11px] text-out">السبب (اختياري)</label>
            <input
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="مثلاً: تأخير"
              className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft sm:w-auto"
          >
            تسجيل
          </button>
        </form>
      </div>

      {/* Deductions list */}
      {filteredDeductions.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-4">
          <h3 className="text-sm font-bold text-ink">خصومات الشهر ده</h3>
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {filteredDeductions
              .slice()
              .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
              .map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-ink">
                      {d.workerName} <span className="text-out">— {formatDateLong(d.dateKey)}</span>
                    </p>
                    {d.reason && <p className="text-xs text-out">{d.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === d.id ? (
                      <>
                        <input
                          autoFocus
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(d);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="tabular w-20 rounded-lg border border-steel bg-white px-2 py-1 text-sm text-ink outline-none"
                        />
                        <button
                          onClick={() => saveEdit(d)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-in hover:bg-page"
                        >
                          حفظ
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(d)}
                        title="دوس تعدل المبلغ"
                        className="tabular font-bold text-red-600 hover:underline"
                      >
                        -{money(d.amount)}
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveDeduction(d.id)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
                    >
                      حذف
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}