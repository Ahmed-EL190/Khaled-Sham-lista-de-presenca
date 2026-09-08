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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-6 print:static print:block print:overflow-visible print:bg-white print:p-0"
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
        className="site-summary-print w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg print:max-w-none print:rounded-none print:p-0"
      >
        <div className="print-hide mb-4 flex items-center justify-end gap-2">
          <button
            onClick={exportExcel}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-out hover:bg-page"
          >
            تصدير Excel
          </button>

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            طباعة / PDF
          </button>

          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-out"
          >
            إغلاق
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <img src={logo} alt="" className="h-12 w-12 object-contain" />

          <div>
            <h2 className="text-base font-black text-ink">
              ملخص الورش — مين اشتغل فين
            </h2>

            <p className="text-xs text-out">{monthLabel}</p>
          </div>
        </div>

        {/* Sites */}
        <div className="mt-4 space-y-3">
          {sites.map((site) => (
            <div
              key={site.siteId}
              className="site-summary-block flex items-center justify-between rounded-lg border border-line px-3 py-2.5"
            >
              <span className="text-sm font-bold text-ink">{site.name}</span>

              <span className="flex items-center gap-4 text-sm">
                <span className="text-out">
                  عدد العمال:{" "}
                  <span className="tabular font-bold text-ink">
                    {Object.keys(site.workers).length}
                  </span>
                </span>

                <span className="text-out">
                  إجمالي الأيام:{" "}
                  <span className="tabular font-bold text-in">
                    {site.totalDays}
                  </span>
                </span>
              </span>
            </div>
          ))}
        </div>

        {sites.length === 0 && (
          <p className="mt-4 text-center text-sm text-out">
            مفيش حضور مسجل في أي ورشة الشهر ده
          </p>
        )}

        {/* Totals */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-page px-4 py-3 text-sm">
          <span className="font-bold text-ink">
            عدد الورش: {sites.length} — عدد العمال الكلي:{" "}
            {totalWorkers.size}
          </span>

          <span className="tabular font-black text-ink">
            {totalDays} يوم عمل
          </span>
        </div>

        <p className="mt-4 text-center text-[10px] text-out">
          تم إصدار الكشف بتاريخ {formatDateLong(todayKey())}
        </p>
      </div>
    </div>,
    document.body,
  );
}