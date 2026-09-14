import { useState } from "react";
import { todayKey } from "../lib/format";
import WorkerPicker from "./WorkerPicker";

const MODES = [
  { id: "single", label: "تسجيل عامل واحد" },
  { id: "bulk", label: "تسجيل جماعي" },
];

export default function LateAttendanceForm({ workers, onSubmit }) {
  const [mode, setMode] = useState("single");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:gap-5">
      {/* أزرار تبديل الوضع */}
      <div className="mx-auto flex w-full rounded-2xl border border-line/60 bg-white/80 p-1 shadow-sm sm:w-fit">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm ${
              mode === m.id 
                ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-md shadow-ink/20"
                : "text-out hover:text-ink hover:bg-mist/50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <SingleForm workers={workers} onSubmit={onSubmit} />
      ) : (
        <BulkForm workers={workers} onSubmit={onSubmit} />
      )}
    </div>
  );
}

function SingleForm({ workers, onSubmit }) {
  const [workerId, setWorkerId] = useState("");
  const [date, setDate] = useState(todayKey());
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
    <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <span className="text-xl">⏰</span>
        <h3 className="text-sm font-bold text-ink sm:text-base">تسجيل حضور متأخر</h3>
      </div>
      <p className="mt-2 text-xs text-out/80 sm:text-sm">
        لو نسيت تسجل عامل — سواء النهاردة أو في يوم فات — سجله من هنا بساعة الحضور الصح. لو فيه تسجيل للعامل ده في نفس اليوم، هيتستبدل بالبيانات الجديدة.
      </p>

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
            max={todayKey()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-out sm:text-xs">ساعة الحضور *</label>
          <input
            type="time"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-out sm:text-xs">ساعة الانصراف (اختياري)</label>
          <input
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!workerId || !date || !checkInTime}
            className="w-full rounded-xl bg-linear-to-r from-ink to-gray-800 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-40 disabled:hover:shadow-none sm:py-3.5 sm:text-base"
          >
            تسجيل الحضور
          </button>
        </div>

        {done && (
          <div className="sm:col-span-2">
            <p className="rounded-xl bg-emerald-50 py-2.5 text-center text-xs font-semibold text-emerald-700 sm:text-sm">
              ✅ تم التسجيل بنجاح
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function BulkForm({ workers, onSubmit }) {
  const [date, setDate] = useState(todayKey());
  const [commonTime, setCommonTime] = useState("08:00");
  const [commonCheckOutTime, setCommonCheckOutTime] = useState("");
  const [selected, setSelected] = useState({});
  const [overrides, setOverrides] = useState({});
  const [search, setSearch] = useState("");
  const [done, setDone] = useState(0);

  const filteredWorkers = workers.filter(
    (w) => !search.trim() || w.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const selectedCount = selectedIds.length;

  function toggle(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAll() {
    const next = {};
    for (const w of filteredWorkers) next[w.id] = true;
    setSelected((prev) => ({ ...prev, ...next }));
  }

  function clearAll() {
    setSelected({});
  }

  function setOverrideTime(id, field, value) {
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function submitAll(e) {
    e.preventDefault();
    if (!date || !commonTime || selectedCount === 0) return;

    for (const id of selectedIds) {
      const worker = workers.find((w) => w.id === id);
      if (!worker) continue;
      const timeIn = overrides[id]?.checkIn || commonTime;
      const timeOut = overrides[id]?.checkOut || commonCheckOutTime;
      const checkIn = new Date(`${date}T${timeIn}:00`).toISOString();
      const checkOut = timeOut ? new Date(`${date}T${timeOut}:00`).toISOString() : null;
      onSubmit({
        workerId: worker.id,
        workerName: worker.name,
        dateKey: date,
        checkIn,
        checkOut,
      });
    }

    setDone(selectedCount);
    setSelected({});
    setOverrides({});
    setTimeout(() => setDone(0), 3000);
  }

  return (
    <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <span className="text-xl">👥</span>
        <h3 className="text-sm font-bold text-ink sm:text-base">تسجيل جماعي (يوم مفيش فيه نت)</h3>
      </div>
      <p className="mt-2 text-xs text-out/80 sm:text-sm">
        اختار التاريخ وساعة الحضور العامة، وحدد كل اللي حضروا من القايمة تحت. لو حد جه بوقت مختلف عدّل ساعته لوحده. وفي الآخر دوس "تسجيل الكل".
      </p>

      <form onSubmit={submitAll} className="mt-4 flex flex-col gap-3 sm:gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-out sm:text-xs">التاريخ *</label>
            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-out sm:text-xs">ساعة الحضور العامة *</label>
            <input
              type="time"
              value={commonTime}
              onChange={(e) => setCommonTime(e.target.value)}
              className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-out sm:text-xs">ساعة الانصراف العامة (اختياري)</label>
          <input
            type="time"
            value={commonCheckOutTime}
            onChange={(e) => setCommonCheckOutTime(e.target.value)}
            className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:max-w-sm sm:py-3"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="دور على اسم..."
            className="w-full flex-1 rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 rounded-xl border border-line/60 px-3 py-2 text-xs font-semibold text-steel transition hover:bg-mist/50 sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
            >
              اختار الكل
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 rounded-xl border border-line/60 px-3 py-2 text-xs font-semibold text-out transition hover:bg-page sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
            >
              امسح الاختيار
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-xl border border-line/60">
          {filteredWorkers.length === 0 ? (
            <p className="py-8 text-center text-xs text-out sm:py-12 sm:text-sm">
              مفيش عمال بالاسم ده
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {filteredWorkers.map((w) => {
                const isChecked = !!selected[w.id];
                return (
                  <li key={w.id} className="flex flex-col gap-2 px-3 py-2.5 transition hover:bg-mist/20 sm:px-4 sm:py-3">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(w.id)}
                        className="h-5 w-5 rounded border-line/60 text-ink focus:ring-2 focus:ring-steel/20 sm:h-5 sm:w-5"
                      />
                      <span className="text-sm font-medium text-ink sm:text-base">{w.name}</span>
                    </label>
                    {isChecked && (
                      <div className="mr-7 grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={overrides[w.id]?.checkIn || commonTime}
                          onChange={(e) => setOverrideTime(w.id, "checkIn", e.target.value)}
                          className="w-full rounded-lg border border-line/60 bg-page px-2 py-1.5 text-xs text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:text-sm"
                        />
                        <input
                          type="time"
                          value={overrides[w.id]?.checkOut || commonCheckOutTime}
                          onChange={(e) => setOverrideTime(w.id, "checkOut", e.target.value)}
                          className="w-full rounded-lg border border-line/60 bg-page px-2 py-1.5 text-xs text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:text-sm"
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={!date || !commonTime || selectedCount === 0}
          className="w-full rounded-xl bg-linear-to-r from-ink to-gray-800 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-40 disabled:hover:shadow-none sm:py-3.5 sm:text-base"
        >
          تسجيل الكل ({selectedCount})
        </button>

        {done > 0 && (
          <p className="rounded-xl bg-emerald-50 py-2.5 text-center text-xs font-semibold text-emerald-700 sm:text-sm">
            ✅ اتسجل {done} عامل بنجاح
          </p>
        )}
      </form>
    </div>
  );
}