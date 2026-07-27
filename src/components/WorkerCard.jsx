import { formatDuration, formatTime } from "../lib/format";

const STATUS_STYLES = {
  pending: {
    dot: "bg-pending",
    bar: "bg-pending",
    chip: "bg-pending-soft text-pending",
    label: "لسه ما جاش",
  },
  in: {
    dot: "bg-in pulse-dot",
    bar: "bg-in",
    chip: "bg-in-soft text-in",
    label: "في الورشة",
  },
  out: {
    dot: "bg-out",
    bar: "bg-out",
    chip: "bg-out-soft text-out",
    label: "خرج",
  },
};

export default function WorkerCard({ worker, entry, onPunch, onReset, readOnly = false }) {
  const status = !entry?.checkIn ? "pending" : !entry?.checkOut ? "in" : "out";
  const s = STATUS_STYLES[status];
  const Tag = readOnly ? "div" : "button";

  return (
    <div className="relative">
      {/* lanyard notch */}
      <div className="absolute right-1/2 top-0 z-10 h-3 w-6 -translate-y-1/2 translate-x-1/2 rounded-full bg-page ring-1 ring-line" />

      <Tag
        onClick={readOnly ? undefined : () => onPunch(worker.id)}
        className={`group relative flex w-full flex-col overflow-hidden rounded-xl border border-line bg-white pt-4 text-right shadow-sm transition ${
          readOnly ? "" : "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
        }`}
      >
        <span className={`absolute inset-y-0 right-0 w-1.5 ${s.bar}`} />

        <div className="flex items-center justify-between px-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${s.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
          {status !== "pending" && !readOnly && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onReset(worker.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onReset(worker.id);
                }
              }}
              className="rounded-md px-1.5 py-1 text-[11px] font-medium text-out opacity-0 transition hover:bg-out-soft hover:text-ink group-hover:opacity-100"
            >
              تصحيح
            </span>
          )}
        </div>

        <div className="px-4 pb-3 pt-2">
          <p className="text-base font-bold text-ink">{worker.name}</p>
          {entry?.siteName && (
            <p className="mt-0.5 text-xs font-medium text-steel">{entry.siteName}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
          <div className="bg-white px-4 py-2.5">
            <p className="text-[10px] font-medium text-out">حضور</p>
            <p className="tabular text-sm font-semibold text-ink">
              {formatTime(entry?.checkIn) || "—"}
            </p>
          </div>
          <div className="bg-white px-4 py-2.5">
            <p className="text-[10px] font-medium text-out">انصراف</p>
            <p className="tabular text-sm font-semibold text-ink">
              {formatTime(entry?.checkOut) || "—"}
            </p>
          </div>
        </div>

        {status !== "pending" && (
          <div className="bg-mist px-4 py-1.5 text-center text-[11px] font-medium text-ink-soft">
            {status === "in" ? "من ساعة " : "قعد "}
            <span className="tabular font-semibold">
              {formatDuration(entry?.checkIn, entry?.checkOut)}
            </span>
          </div>
        )}
      </Tag>
    </div>
  );
}
