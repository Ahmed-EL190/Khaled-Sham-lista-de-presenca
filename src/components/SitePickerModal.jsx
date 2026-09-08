import { useState } from "react";
import { createPortal } from "react-dom";

export default function SitePickerModal({ sites, defaultSiteId, workerName, onConfirm, onCancel }) {
  const [siteId, setSiteId] = useState(defaultSiteId || sites[0]?.id || "");

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl shadow-ink/20 animate-in fade-in zoom-in duration-200 sm:p-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-ink to-gray-800 text-3xl shadow-lg shadow-ink/20">
            🏗️
          </div>
          <h3 className="text-base font-bold text-ink sm:text-lg">
            {workerName} اشتغل فين النهاردة؟
          </h3>
          <p className="mt-1 text-xs text-out/70 sm:text-sm">
            اختار الورشة اللي اشتغل فيها اليوم
          </p>
        </div>

        {/* Sites list */}
        <div className="mt-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {sites.map((s) => (
            <button
              key={s.id}
              onClick={() => setSiteId(s.id)}
              className={`group flex items-center justify-between rounded-xl border-2 px-4 py-3 text-right text-sm font-semibold transition-all duration-200 ${
                siteId === s.id
                  ? "border-ink bg-linear-to-r from-ink/5 to-ink/10 text-ink shadow-md shadow-ink/5"
                  : "border-line/60 text-ink-soft hover:border-steel/50 hover:bg-mist/30 hover:shadow-sm"
              }`}
            >
              <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">
                {siteId === s.id ? "✅" : "🏭"}
              </span>
              <span className="flex-1 text-right">{s.name}</span>
              {siteId === s.id && (
                <span className="text-xs font-bold text-in">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line/60 px-4 py-2.5 text-sm font-semibold text-out transition hover:bg-page hover:text-ink sm:py-3"
          >
            إلغاء
          </button>
          <button
            onClick={() => onConfirm(siteId)}
            disabled={!siteId}
            className="flex-1 rounded-xl bg-linear-to-r from-ink to-gray-800 px-4 py-2.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-40 disabled:hover:shadow-none sm:py-3"
          >
            تسجيل حضور
          </button>
        </div>

        {/* Footer */}
        <p className="mt-3 text-center text-[10px] text-out/40">
          اختر الورشة المناسبة للعامل
        </p>
      </div>
    </div>,
    document.body
  );
}