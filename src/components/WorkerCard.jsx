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

        <div className="flex items-center justify-between gap-1 px-3 sm:px-4">
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold sm:text-[11px] ${s.chip}`}>
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
              className="shrink-0 rounded-md px-1.5 py-1 text-[10px] font-medium text-out transition hover:bg-out-soft hover:text-ink active:bg-out-soft sm:text-[11px]"
            >
              تصحيح
            </span>
          )}
        </div>

        <div className="px-3 pb-3 pt-2 sm:px-4">
          <p className="wrap-break-words text-sm font-bold text-ink sm:text-base">{worker.name}</p>
          {entry?.siteName && (
            <p className="mt-0.5 text-[11px] font-medium text-steel sm:text-xs">{entry.siteName}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
          <div className="bg-white px-3 py-2.5 sm:px-4">
            <p className="text-[10px] font-medium text-out">حضور</p>
            <p className="tabular text-xs font-semibold text-ink sm:text-sm">
              {formatTime(entry?.checkIn) || "—"}
            </p>
          </div>
                    <div className="bg-white px-3 py-2.5 sm:px-4">
            <p className="text-[10px] font-medium text-out">انصراف</p>
            <p className="tabular text-xs font-semibold text-ink sm:text-sm">
              {formatTime(entry?.checkOut) || "—"}
              {entry?.autoCheckedOut && (
                <span
                  title="اتسجل تلقائي لأن العامل نسي يعمل انصراف"
                  className="mr-1 rounded bg-pending-soft px-1 py-0.5 text-[9px] font-semibold text-pending align-middle"
                >
                  تلقائي
                </span>
              )}
            </p>
          </div>
        </div>

        {status !== "pending" && (
          <div className="bg-mist px-3 py-1.5 text-center text-[10px] font-medium text-ink-soft sm:px-4 sm:text-[11px]">
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