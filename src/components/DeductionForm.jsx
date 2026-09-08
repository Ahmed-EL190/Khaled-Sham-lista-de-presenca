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
    <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:gap-5">
      {/* نموذج التسجيل */}
      <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 border-b border-line/60 pb-3">
          <span className="text-xl">➖</span>
          <h3 className="text-sm font-bold text-ink sm:text-base">تسجيل خصم على عامل</h3>
        </div>

        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-out sm:text-xs">العامل *</label>
            <WorkerPicker 
              workers={workers} 
              value={workerId} 
              onChange={setWorkerId} 
              className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-out sm:text-xs">التاريخ *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-out sm:text-xs">المبلغ *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-out sm:text-xs">السبب (اختياري)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثلاً: تأخير"
              className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!workerId || !amount}
              className="w-full rounded-xl bg-linear-to-r from-ink to-gray-800 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-40 disabled:hover:shadow-none sm:py-3.5 sm:text-base"
            >
              تسجيل الخصم
            </button>
          </div>

          {done && (
            <div className="sm:col-span-2">
              <p className="rounded-xl bg-emerald-50 py-2.5 text-center text-xs font-semibold text-emerald-700 sm:text-sm">
                ✅ تم تسجيل الخصم بنجاح
              </p>
            </div>
          )}
        </form>
      </div>

      {/* قائمة الخصومات */}
      {sortedDeductions.length > 0 && (
        <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h3 className="text-sm font-bold text-ink sm:text-base">الخصومات المسجلة</h3>
            </div>
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
              {sortedDeductions.length}
            </span>
          </div>

          <ul className="mt-3 divide-y divide-line/60">
            {sortedDeductions.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink sm:text-base">
                    {d.workerName}
                    <span className="mr-2 text-xs font-normal text-out">
                      — {formatDateLong(d.dateKey)}
                    </span>
                  </p>
                  {d.reason && (
                    <p className="mt-0.5 text-xs text-out/70">{d.reason}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                        className="w-24 rounded-lg border border-steel/60 bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-steel focus:ring-2 focus:ring-steel/20"
                      />
                      <button
                        onClick={() => saveEdit(d)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-line/60 px-3 py-1.5 text-xs font-semibold text-out transition hover:bg-page"
                      >
                        إلغاء
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(d)}
                        disabled={!onUpdateDeduction}
                        title="دوس تعدل المبلغ"
                        className="tabular rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 sm:text-base"
                      >
                        -{money(d.amount)}
                      </button>
                      {onRemoveDeduction && (
                        <button
                          onClick={() => {
                            if (window.confirm("متأكد إنك عايز تمسح الخصم ده؟")) {
                              onRemoveDeduction(d.id);
                            }
                          }}
                          className="rounded-lg border border-line/60 px-2.5 py-1.5 text-xs font-medium text-out transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        >
                          حذف
                        </button>
                      )}
                    </>
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