import { useMemo, useState } from "react";
import { buildPayrollSummaries } from "../lib/payroll";
import { formatMonthLabel, formatDateLong, todayKey } from "../lib/format";

export default function PayrollView({
  workers,
  records,
  deductions,
  schedule,
  onAddDeduction,
  onRemoveDeduction,
}) {
  const monthKeys = useMemo(() => {
    const set = new Set([
      ...records.map((r) => r.dateKey?.slice(0, 7)),
      ...deductions.map((d) => d.dateKey?.slice(0, 7)),
    ].filter(Boolean));
    set.add(todayKey().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [records, deductions]);

  const [selectedMonth, setSelectedMonth] = useState(todayKey().slice(0, 7));

  const filteredRecords = useMemo(
    () => records.filter((r) => r.dateKey?.startsWith(selectedMonth)),
    [records, selectedMonth]
  );
  const filteredDeductions = useMemo(
    () => deductions.filter((d) => d.dateKey?.startsWith(selectedMonth)),
    [deductions, selectedMonth]
  );

  const summaries = useMemo(
    () => buildPayrollSummaries(workers, filteredRecords, filteredDeductions, schedule),
    [workers, filteredRecords, filteredDeductions, schedule]
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

      {/* Summary table */}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-160 text-right text-sm">
          <thead>
            <tr className="border-b border-line bg-page text-xs text-out">
              <th className="px-3 py-2 font-semibold">العامل</th>
              <th className="px-3 py-2 font-semibold">اليومية</th>
              <th className="px-3 py-2 font-semibold">أيام كاملة</th>
              <th className="px-3 py-2 font-semibold">نص أيام</th>
              <th className="px-3 py-2 font-semibold">الإجمالي</th>
              <th className="px-3 py-2 font-semibold">الخصومات</th>
              <th className="px-3 py-2 font-semibold">الصافي</th>
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-line">
            {summaries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-xs text-out">
                  لسه مفيش بيانات في الشهر ده
                </td>
              </tr>
            )}
            {summaries.map((s) => (
              <tr key={s.workerId}>
                <td className="px-3 py-2 font-semibold text-ink">{s.name}</td>
                <td className="px-3 py-2 text-ink-soft">{s.wage}</td>
                <td className="px-3 py-2 text-ink-soft">{s.fullDays + s.offDaysWorked}</td>
                <td className="px-3 py-2 text-ink-soft">{s.halfDays}</td>
                <td className="px-3 py-2 text-ink-soft">{s.gross.toLocaleString("ar-EG")}</td>
                <td className="px-3 py-2 text-red-600">
                  {s.deductionsTotal > 0 ? `-${s.deductionsTotal.toLocaleString("ar-EG")}` : "—"}
                </td>
                <td className="px-3 py-2 font-bold text-in">{s.net.toLocaleString("ar-EG")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add deduction */}
      <div className="rounded-xl border border-line bg-white p-4">
        <h3 className="text-sm font-bold text-ink">تسجيل خصم</h3>
        <form onSubmit={submitDeduction} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">العامل</label>
            <select
              value={formWorkerId}
              onChange={(e) => setFormWorkerId(e.target.value)}
              className="rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">التاريخ</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="tabular rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">المبلغ</label>
            <input
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0"
              className="tabular w-24 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
          <div className="flex flex-1 min-w-40 flex-col gap-1">
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
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
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
                  <div className="flex items-center gap-3">
                    <span className="tabular font-bold text-red-600">-{d.amount}</span>
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
