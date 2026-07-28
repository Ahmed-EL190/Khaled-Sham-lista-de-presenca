import { useState } from "react";
import { todayKey } from "../lib/format";

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export default function LateAttendanceForm({ workers, onSubmit }) {
  const [workerId, setWorkerId] = useState("");
  const [date, setDate] = useState(yesterdayKey());
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [done, setDone] = useState(false);

  function submit(e) {
    e.preventDefault();
    const worker = workers.find((w) => w.id === workerId);
    if (!worker || !date || !checkInTime) return;

    const checkIn = new Date(`${date}T${checkInTime}:00`).toISOString();
    const checkOut = checkOutTime
      ? new Date(`${date}T${checkOutTime}:00`).toISOString()
      : null;

    onSubmit({
      workerId: worker.id,
      workerName: worker.name,
      dateKey: date,
      checkIn,
      checkOut,
    });

    setWorkerId("");
    setCheckOutTime("");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-line bg-white p-5">
      <h3 className="text-sm font-bold text-ink">تسجيل حضور متأخر (يوم فات)</h3>
      <p className="mt-0.5 text-xs text-out">
        لو نسيت تسجل عامل في يوم فات، سجله من هنا. لو فيه تسجيل للعامل ده في نفس اليوم، هيتستبدل بالبيانات الجديدة.
      </p>

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
            max={yesterdayKey()}
            onChange={(e) => setDate(e.target.value)}
            className="tabular rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">ساعة الحضور</label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="tabular rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">ساعة الانصراف (اختياري)</label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="tabular rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!workerId || !date || !checkInTime}
          className="rounded-lg bg-ink py-2.5 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
        >
          تسجيل الحضور
        </button>

        {done && <p className="text-center text-xs font-semibold text-in">تم التسجيل ✓</p>}
      </form>
    </div>
  );
}