const DAYS = [
  { i: 0, label: "الأحد" },
  { i: 1, label: "الإتنين" },
  { i: 2, label: "التلات" },
  { i: 3, label: "الأربع" },
  { i: 4, label: "الخميس" },
  { i: 5, label: "الجمعة" },
  { i: 6, label: "السبت" },
];

const STATES = [
  { key: "full", label: "يوم عادي" },
  { key: "half", label: "نص يوم" },
  { key: "off", label: "إجازة" },
];

export default function ScheduleManager({
  schedule,
  onChange,
}) {
  function stateOf(dayIndex) {
    // السبت دائمًا يوم كامل
    if (dayIndex === 6) {
      return "full";
    }

    if (schedule.offDays?.includes(dayIndex)) {
      return "off";
    }

    if (schedule.halfDays?.includes(dayIndex)) {
      return "half";
    }

    return "full";
  }

  function setState(dayIndex, state) {
    const offDays = new Set(schedule.offDays || []);
    const halfDays = new Set(schedule.halfDays || []);

    // السبت لا يمكن يكون نص يوم أو إجازة
    if (dayIndex === 6) {
      state = "full";
    }

    offDays.delete(dayIndex);
    halfDays.delete(dayIndex);

    if (state === "off") {
      offDays.add(dayIndex);
    }

    if (state === "half") {
      halfDays.add(dayIndex);
    }

    onChange({
      offDays: Array.from(offDays),
      halfDays: Array.from(halfDays),
    });
  }

  return (
    <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <span className="text-xl">📅</span>
        <h3 className="text-sm font-bold text-ink sm:text-base">إجازات الأسبوع</h3>
      </div>

      <p className="mt-2 text-xs text-out/70 sm:text-sm">
        📌 بيتحسب على أساسها الراتب: يوم عادي = يومية كاملة، نص يوم = نص يومية.
        <br />
        <span className="font-semibold text-steel">السبت يوم كامل في الحساب ولا يمكن تغييره.</span>
      </p>

      <div className="mt-3 flex flex-col divide-y divide-line/60">
        {DAYS.map((day) => {
          const current = stateOf(day.i);
          const isSaturday = day.i === 6;

          return (
            <div
              key={day.i}
              className={`flex flex-col gap-2 py-3 first:pt-0 last:pb-0 xs:flex-row xs:items-center xs:justify-between ${
                isSaturday ? "bg-mist/20 rounded-lg px-2 -mx-2" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  isSaturday ? "text-steel" : "text-ink"
                }`}>
                  {day.label}
                </span>
                {isSaturday && (
                  <span className="rounded-full bg-steel/10 px-2 py-0.5 text-[10px] font-bold text-steel">
                    ثابت
                  </span>
                )}
              </div>

              <div className="inline-flex w-full flex-wrap rounded-xl border border-line/60 bg-page/50 p-0.5 xs:w-fit">
                {STATES
                  .filter((s) => day.i !== 6 || s.key === "full")
                  .map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setState(day.i, s.key)}
                      disabled={isSaturday && s.key !== "full"}
                      className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition xs:flex-none sm:px-4 sm:py-2 sm:text-sm ${
                        current === s.key
                          ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-md shadow-ink/20"
                          : "text-out/70 hover:text-ink hover:bg-mist/50"
                      } ${
                        isSaturday && s.key !== "full" ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-page/50 px-3 py-2 text-xs text-out/70 sm:text-sm">
        <span className="font-semibold text-ink">🔑 المفتاح:</span>
        {STATES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                s.key === "full"
                  ? "bg-emerald-500"
                  : s.key === "half"
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            />
            {s.label}
          </span>
        ))}
        <span className="text-out/50">|</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-steel" />
          ثابت (السبت)
        </span>
      </div>
    </div>
  );
}