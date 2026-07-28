import { useState } from "react";

export default function SitePickerModal({ sites, defaultSiteId, workerName, onConfirm, onCancel }) {
  const [siteId, setSiteId] = useState(defaultSiteId || sites[0]?.id || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-lg"
      >
        <h3 className="text-sm font-bold text-ink">{workerName} اشتغل فين النهاردة؟</h3>
        <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {sites.map((s) => (
            <button
              key={s.id}
              onClick={() => setSiteId(s.id)}
              className={`rounded-lg border px-3 py-2 text-right text-sm font-semibold transition ${
                siteId === s.id
                  ? "border-steel bg-mist text-steel"
                  : "border-line text-ink-soft hover:border-steel-light"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-line py-2 text-sm font-semibold text-out hover:bg-page"
          >
            إلغاء
          </button>
          <button
            onClick={() => onConfirm(siteId)}
            disabled={!siteId}
            className="flex-1 rounded-lg bg-ink py-2 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
          >
            تسجيل حضور
          </button>
        </div>
      </div>
    </div>
  );
}
