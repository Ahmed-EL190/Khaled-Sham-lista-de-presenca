import { useState } from "react";
import { todayKey } from "../lib/format";

const MODES = [
  { id: "single", label: "تسجيل عامل واحد" },
  { id: "bulk", label: "تسجيل جماعي" },
];

export default function LateAttendanceForm({ workers, onSubmit }) {
  const [mode, setMode] = useState("single");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-3">
      <div className="mx-auto inline-flex w-fit rounded-lg border border-line bg-white p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              mode === m.id ? "bg-ink text-white" : "text-out hover:text-ink"
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
    <div className="rounded-xl border border-line bg-white p-5">
      <h3 className="text-sm font-bold text-ink">تسجيل حضور متأخر</h3>
      

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-out">العامل</label>
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
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
            max={todayKey()}
            onChange={(e) => setDate(e.target.value)}
            className="tabular w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">ساعة الحضور</label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="tabular w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">ساعة الانصراف (اختياري)</label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="tabular w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
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

function BulkForm({ workers, onSubmit }) {
  const [date, setDate] = useState(todayKey());
  const [commonTime, setCommonTime] = useState("08:00");
  const [commonCheckOutTime, setCommonCheckOutTime] = useState("");
  const [selected, setSelected] = useState({});
  const [overrides, setOverrides] = useState({});
  const [search, setSearch] = useState("");
  const [done, setDone] = useState(0);

  const filteredWorkers = workers.filter(
    (w) => !search.trim() || w.name.includes(search.trim())
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
    <div className="rounded-xl border border-line bg-white p-5">
      <h3 className="text-sm font-bold text-ink">تسجيل جماعي </h3>
      

      <form onSubmit={submitAll} className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">التاريخ</label>
            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(e) => setDate(e.target.value)}
              className="tabular w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-out">ساعة الحضور العامة</label>
            <input
              type="time"
              value={commonTime}
              onChange={(e) => setCommonTime(e.target.value)}
              className="tabular w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-out">ساعة الانصراف العامة (اختياري)</label>
          <input
            type="time"
            value={commonCheckOutTime}
            onChange={(e) => setCommonCheckOutTime(e.target.value)}
            className="tabular w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel sm:w-1/2"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="دور على اسم..."
            className="w-full flex-1 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 whitespace-nowrap rounded-lg border border-line px-3 py-2 text-xs font-semibold text-steel hover:bg-mist sm:flex-none"
            >
              اختار الكل
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 whitespace-nowrap rounded-lg border border-line px-3 py-2 text-xs font-semibold text-out hover:bg-page sm:flex-none"
            >
              امسح الاختيار
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-line">
          {filteredWorkers.length === 0 ? (
            <p className="py-6 text-center text-xs text-out">مفيش عمال بالاسم ده</p>
          ) : (
            <ul className="divide-y divide-line">
              {filteredWorkers.map((w) => {
                const isChecked = !!selected[w.id];
                return (
                  <li key={w.id} className="flex flex-col gap-2 px-3 py-2.5">
                    <label className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(w.id)}
                        className="h-5 w-5 accent-ink"
                      />
                      <span className="text-sm font-medium text-ink">{w.name}</span>
                    </label>
                    {isChecked && (
                      <div className="mr-7 grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={overrides[w.id]?.checkIn || commonTime}
                          onChange={(e) => setOverrideTime(w.id, "checkIn", e.target.value)}
                          className="tabular w-full rounded-md border border-line bg-page px-2 py-1 text-xs text-ink outline-none focus:border-steel"
                        />
                        <input
                          type="time"
                          value={overrides[w.id]?.checkOut || commonCheckOutTime}
                          onChange={(e) => setOverrideTime(w.id, "checkOut", e.target.value)}
                          className="tabular w-full rounded-md border border-line bg-page px-2 py-1 text-xs text-ink outline-none focus:border-steel"
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
          className="rounded-lg bg-ink py-2.5 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
        >
          تسجيل الكل ({selectedCount})
        </button>

        {done > 0 && (
          <p className="text-center text-xs font-semibold text-in">اتسجل {done} عامل ✓</p>
        )}
      </form>
    </div>
  );
}