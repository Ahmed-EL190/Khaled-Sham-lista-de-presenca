import { createPortal } from "react-dom";
import logo from "../assets/logo.png";
import { formatDateLong, todayKey } from "../lib/format";
import { exportRowsToExcel } from "../lib/excelExport";

export default function SiteSummaryModal({ sites, monthLabel, onClose }) {
  if (!sites) return null;

  const totalWorkers = new Set();
  let totalDays = 0;

  for (const site of sites) {
    totalDays += site.totalDays;
    for (const name of Object.keys(site.workers)) totalWorkers.add(name);
  }

  function exportExcel() {
    const rows = sites.map((site) => ({
      الورشة: site.name,
      "عدد العمال": Object.keys(site.workers).length,
      "إجمالي أيام العمل": site.totalDays,
    }));

    exportRowsToExcel(rows, `ملخص الورش - ${monthLabel}`, "ملخص الورش");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-3 py-4 print:static print:block print:overflow-visible print:bg-white print:p-0 sm:px-4 sm:py-6"
      onClick={onClose}
    >
      <style>{`
        @media print {
          #root {
            display: none !important;
          }

          .site-summary-print {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: 0 !important;
          }

          .print-hide {
            display: none !important;
          }

          .site-summary-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="site-summary-print w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg print:max-w-none print:rounded-none print:p-0 sm:p-6"
      >
        {/* Buttons */}
        <div className="print-hide mb-4 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={exportExcel}
            className="rounded-xl border border-line/60 px-4 py-2.5 text-sm font-semibold text-out transition hover:bg-page sm:px-5"
          >
            📊 تصدير Excel
          </button>

          <button
            onClick={() => window.print()}
            className="rounded-xl bg-linear-to-r from-ink to-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-ink/20 sm:px-5"
          >
            🖨️ طباعة / PDF
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border border-line/60 px-4 py-2.5 text-sm font-semibold text-out transition hover:bg-page sm:px-5"
          >
            ✕ إغلاق
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line/60 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-ink to-gray-800 p-1.5 shadow-md shadow-ink/10">
            <img src={logo} alt="" className="h-full w-full object-contain" />
          </div>

          <div>
            <h2 className="text-base font-black text-ink sm:text-lg">
              📋 ملخص الورش — مين اشتغل فين
            </h2>

            <p className="text-xs text-out/70 sm:text-sm">📅 {monthLabel}</p>
          </div>
        </div>

        {/* Sites */}
        <div className="mt-4 space-y-2.5 sm:space-y-3">
          {sites.map((site) => (
            <div
              key={site.siteId}
              className="site-summary-block flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line/60 bg-white px-4 py-3 shadow-sm transition hover:shadow-md sm:px-5 sm:py-3.5"
            >
              <span className="text-sm font-bold text-ink sm:text-base">
                🏭 {site.name}
              </span>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:gap-4 sm:text-sm">
                <span className="text-out/70">
                  👥 عدد العمال:{" "}
                  <span className="tabular font-bold text-ink">
                    {Object.keys(site.workers).length}
                  </span>
                </span>

                <span className="text-out/70">
                  📅 إجمالي الأيام:{" "}
                  <span className="tabular font-bold text-emerald-600">
                    {site.totalDays}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {sites.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-line/60 py-10 text-center text-sm text-out/70">
            <span className="block text-4xl mb-3">📭</span>
            مفيش حضور مسجل في أي ورشة الشهر ده
          </div>
        )}

        {/* Totals */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-linear-to-r from-ink to-gray-800 px-4 py-3.5 shadow-lg shadow-ink/20 sm:px-5 sm:py-4">
          <span className="text-sm font-bold text-white sm:text-base">
            📊 عدد الورش: {sites.length} — 👥 عدد العمال الكلي: {totalWorkers.size}
          </span>

          <span className="tabular font-black text-white sm:text-lg">
            📅 {totalDays} يوم عمل
          </span>
        </div>

        <p className="mt-4 text-center text-[10px] text-out/40 sm:text-xs">
          📄 تم إصدار الكشف بتاريخ {formatDateLong(todayKey())}
        </p>
      </div>
    </div>,
    document.body,
  );
}