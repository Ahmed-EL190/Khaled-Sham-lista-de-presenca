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

export default function ScheduleManager({ schedule, onChange }) {
  function stateOf(dayIndex) {
    if (schedule.offDays?.includes(dayIndex)) return "off";
    if (schedule.halfDays?.includes(dayIndex)) return "half";
    return "full";
  }

  function setState(dayIndex, state) {
    const offDays = new Set(schedule.offDays || []);
    const halfDays = new Set(schedule.halfDays || []);
    offDays.delete(dayIndex);
    halfDays.delete(dayIndex);
    if (state === "off") offDays.add(dayIndex);
    if (state === "half") halfDays.add(dayIndex);
    onChange({ offDays: Array.from(offDays), halfDays: Array.from(halfDays) });
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="text-sm font-bold text-ink">إجازات الأسبوع</h3>
      <p className="mt-0.5 text-xs text-out">
        بيتحسب على أساسها الراتب: يوم عادي = يومية كاملة، نص يوم = نص يومية
      </p>

      <div className="mt-3 flex flex-col divide-y divide-line">
        {DAYS.map((day) => {
          const current = stateOf(day.i);
          return (
            <div key={day.i} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-ink">{day.label}</span>
              <div className="inline-flex rounded-lg border border-line bg-page p-0.5">
                {STATES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setState(day.i, s.key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      current === s.key
                        ? "bg-ink text-white"
                        : "text-out hover:text-ink"
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
    </div>
  );
}
