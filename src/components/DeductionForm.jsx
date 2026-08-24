import { useMemo, useState } from "react";
import { formatDateLong, todayKey } from "../lib/format";
import WorkerPicker from "./WorkerPicker";

function money(n) {
  return `${(n || 0).toLocaleString("en-US")} Kz`;
}

export default function DeductionForm({ workers, deductions = [], onSubmit, onRemoveDeduction, onUpdateDeduction }) {
  const [workerId, setWorkerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayKey());
  const [done, setDone] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  function submit(e) {
    e.preventDefault();
    const worker = workers.find((w) => w.id === workerId);
    if (!worker || !amount) return;
    onSubmit({
      workerId: worker.id,
      workerName: worker.name,
      dateKey: date,
      amount,
      reason,
    });
    setWorkerId("");
    setAmount("");
    setReason("");
    setDate(todayKey());
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  function startEdit(d) {
    setEditingId(d.id);
    setEditAmount(d.amount);
  }

  function saveEdit(d) {
    const num = Number(editAmount);
    if (!Number.isNaN(num) && num !== Number(d.amount) && onUpdateDeduction) {
      onUpdateDeduction(d.id, { amount: num });
    }
    setEditingId(null);
  }

  const sortedDeductions = useMemo(
    () => deductions.slice().sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)),
    [deductions]
  );

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="rounded-xl border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">تسجيل خصم على عامل</h3>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">العامل</label>
            <WorkerPicker workers={workers} value={workerId} onChange={setWorkerId} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="tabular rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">المبلغ</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="tabular rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">السبب (اختياري)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثلاً: تأخير"
              className="rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>

          <button
            type="submit"
            disabled={!workerId || !amount}
            className="rounded-lg bg-ink py-2.5 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
          >
            تسجيل الخصم
          </button>

          {done && <p className="text-center text-xs font-semibold text-in">تم تسجيل الخصم ✓</p>}
        </form>
      </div>

      {sortedDeductions.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-5">
          <h3 className="text-sm font-bold text-ink">الخصومات المسجلة</h3>
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {sortedDeductions.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm">
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
                      disabled={!onUpdateDeduction}
                      title="دوس تعدل المبلغ"
                      className="tabular font-bold text-red-600 hover:underline disabled:no-underline"
                    >
                      -{money(d.amount)}
                    </button>
                  )}
                  {onRemoveDeduction && (
                    <button
                      onClick={() => {
                        if (window.confirm("متأكد إنك عايز تمسح الخصم ده؟")) {
                          onRemoveDeduction(d.id);
                        }
                      }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}