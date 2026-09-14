import { useMemo, useState } from "react";
import { formatDateLong, formatDuration, formatTime } from "../lib/format";

export default function HistoryView({ records, todayKey, onDelete }) {
  const byDate = useMemo(() => {
    const map = {};
    for (const r of records) {
      if (!r.checkIn || r.dateKey === todayKey) continue;
      if (!map[r.dateKey]) map[r.dateKey] = [];
      map[r.dateKey].push(r);
    }
    return map;
  }, [records, todayKey]);

  const dateKeys = useMemo(() => Object.keys(byDate).sort().reverse(), [byDate]);
  const [openDate, setOpenDate] = useState(null);

  if (dateKeys.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line/60 bg-white/60 py-12 text-center text-sm text-out sm:py-16">
        <span className="text-4xl block mb-3">📭</span>
        لسه مفيش أيام سابقة متسجلة
      </div>
    );
  }

  function handleDelete(e, dateKey, workerId, workerName) {
    e.stopPropagation();
    if (!onDelete) return;
    if (window.confirm(`متأكد إنك عايز تمسح تسجيل ${workerName}؟`)) {
      onDelete({ dateKey, workerId });
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {dateKeys.map((dateKey) => {
        const entries = byDate[dateKey];
        const isOpen = openDate === dateKey;

        return (
          <div key={dateKey} className="overflow-hidden rounded-2xl border border-line/60 bg-white shadow-sm transition hover:shadow-md">
            {/* رأس اليوم */}
            <button
              onClick={() => setOpenDate(isOpen ? null : dateKey)}
              className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-mist/30 sm:px-5 sm:py-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{isOpen ? "📂" : "📁"}</span>
                <span className="text-sm font-bold text-ink sm:text-base">
                  {formatDateLong(dateKey)}
                </span>
              </div>
              <span className="flex items-center gap-2 sm:gap-3">
                <span className="tabular rounded-full bg-mist/80 px-2.5 py-1 text-xs font-bold text-steel sm:px-3 sm:text-sm">
                  {entries.length} عامل
                </span>
                <svg
                  className={`h-5 w-5 text-out transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {/* محتوى اليوم */}
            {isOpen && (
              <div className="divide-y divide-line/60 border-t border-line/60">
                {entries.map((e) => (
                  <div
                    key={e.workerId}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:bg-mist/20 sm:px-5 sm:py-3.5"
                  >
                    {/* معلومات العامل */}
                    <div className="flex-1 min-w-30">
                      <p className="text-sm font-semibold text-ink sm:text-base">
                        {e.workerName}
                      </p>
                      {e.siteName && (
                        <p className="text-[10px] font-medium text-steel/80 sm:text-xs">
                          🏗️ {e.siteName}
                        </p>
                      )}
                    </div>

                    {/* معلومات الوقت */}
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-medium">
                          {formatTime(e.checkIn)}
                        </span>
                        <span className="text-out">→</span>
                        <span className={e.checkOut ? "text-rose-600 font-medium" : "text-out"}>
                          {formatTime(e.checkOut) || "..."}
                        </span>
                      </div>
                      
                      <span className="rounded-full bg-mist/60 px-2.5 py-1 text-[10px] font-semibold text-steel sm:text-xs">
                        {formatDuration(e.checkIn, e.checkOut)}
                      </span>

                      {/* زر الحذف */}
                      {onDelete && (
                        <button
                          onClick={(ev) => handleDelete(ev, dateKey, e.workerId, e.workerName)}
                          title="حذف التسجيل"
                          className="rounded-lg border border-line/60 px-2 py-1 text-xs text-out transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:px-2.5"
                        >
                          🗑 حذف
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}