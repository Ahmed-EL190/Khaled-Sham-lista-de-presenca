import { useState } from "react";
import { todayKey } from "../lib/format";

export default function DeductionForm({ workers, onSubmit }) {
  const [workerId, setWorkerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayKey());
  const [done, setDone] = useState(false);

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

  return (
    <div className="mx-auto max-w-md rounded-xl border border-line bg-white p-5">
      <h3 className="text-sm font-bold text-ink">تسجيل خصم على عامل</h3>
      

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-out">العامل</label>
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
          >
            <option value="">اختار العامل</option>
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
  );
}