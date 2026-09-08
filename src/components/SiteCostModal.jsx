import { createPortal } from "react-dom";
import logo from "../assets/logo.png";
import { formatDateLong, todayKey } from "../lib/format";
import { exportSheetsToExcel } from "../lib/excelExport";

function money(n) {
  return `${Math.round(Number(n) || 0).toLocaleString("en-US")} Kz`;
}

export default function SiteCostModal({
  sites,
  monthLabel,
  costBasis = "full",
  onChangeCostBasis,
  onClose,
}) {
  if (!sites) return null;

  const grandTotal = sites.reduce((sum, s) => sum + s.totalCost, 0);

  function exportExcel() {
    const costLabel =
      costBasis === "fullAfterDebt"
        ? "التكلفة (المرتب الكامل بعد السلفة)"
        : "التكلفة (المرتب الكامل)";

    const sheets = sites.map((site) => ({
      name: site.name,
      rows: [
        ...site.workers.map((w) => ({
          العامل: w.name,
          "أيام العمل بالورشة": w.units ?? "",
          [costLabel]: Math.round(w.cost),
        })),
        {
          العامل: "الإجمالي",
          "أيام العمل بالورشة": site.totalUnits,
          [costLabel]: Math.round(site.totalCost),
        },
      ],
    }));

    exportSheetsToExcel(sheets, `توزيع الرواتب على الورش - ${monthLabel}`);
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

          .site-cost-print {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: 0 !important;
          }

          .print-hide {
            display: none !important;
          }

          .site-cost-block {
            break-inside: auto;
          }

          .site-cost-block-header {
            break-after: avoid-page !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          .site-cost-row {
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
        className="site-cost-print w-full max-w-2xl rounded-2xl bg-white p-5 shadow-lg print:max-w-none print:rounded-none print:p-0 sm:p-6"
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
              🏗️ توزيع تكلفة الرواتب على الورش
            </h2>

            <p className="text-xs text-out/70 sm:text-sm">📅 {monthLabel}</p>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-out/70 sm:text-sm">
          📌 التكلفة هنا موزّعة من مرتب العامل{" "}
          <span className="font-semibold text-ink">الكامل</span>{" "}
          (الأساسي + بدل الأكل) ناقص الضمان الاجتماعي بس لو موجود
          {costBasis === "fullAfterDebt" ? " وناقص رصيد السلفة" : ""}، من غير
          خصم أي مصاريف أو خصومات تانية، حسب نسبة أيام شغله في كل ورشة الشهر
          ده (والإجازات الرسمية بتتحط في "بدون ورشة").
        </p>

        {/* Cost basis toggle */}
        {onChangeCostBasis && (
          <div className="print-hide mt-3 flex w-full rounded-xl border border-line/60 bg-white/80 p-1 shadow-sm sm:w-fit">
            <button
              onClick={() => onChangeCostBasis("full")}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-5 sm:py-2 sm:text-sm ${
                costBasis === "full"
                  ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-md shadow-ink/20"
                  : "text-out hover:text-ink hover:bg-mist/50"
              }`}
            >
              📊 المرتب الكامل
            </button>

            <button
              onClick={() => onChangeCostBasis("fullAfterDebt")}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-5 sm:py-2 sm:text-sm ${
                costBasis === "fullAfterDebt"
                  ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-md shadow-ink/20"
                  : "text-out hover:text-ink hover:bg-mist/50"
              }`}
            >
              💰 المرتب الكامل بعد السلفة
            </button>
          </div>
        )}

        {/* Sites */}
        <div className="mt-4 space-y-3 sm:space-y-4">
          {sites.map((site) => (
            <div
              key={site.siteId || "none"}
              className="site-cost-block overflow-hidden rounded-2xl border border-line/60 shadow-sm transition hover:shadow-md"
            >
              {/* Site header */}
              <div className="site-cost-block-header flex flex-wrap items-center justify-between gap-2 bg-linear-to-r from-mist/50 to-mist/30 px-4 py-2.5 sm:px-5 sm:py-3">
                <span className="text-sm font-bold text-ink sm:text-base">
                  🏭 {site.name}
                </span>

                <span className="tabular text-sm font-black text-ink sm:text-base">
                  💰 {money(site.totalCost)}
                </span>
              </div>

              {/* Workers list */}
              <ul className="divide-y divide-line/60">
                {site.workers.map((w) => (
                  <li
                    key={w.workerId}
                    className="site-cost-row flex flex-wrap items-center justify-between gap-2 px-4 py-2 transition hover:bg-mist/20 sm:px-5 sm:py-2.5"
                  >
                    <span className="text-sm font-medium text-ink sm:text-base">
                      👤 {w.name}
                    </span>

                    <span className="flex shrink-0 flex-wrap items-center gap-2">
                      {w.units !== null && w.units !== undefined && (
                        <span className="tabular rounded-full bg-mist/60 px-2.5 py-1 text-xs font-medium text-steel sm:px-3 sm:text-sm">
                          📅 {w.units} يوم
                        </span>
                      )}

                      <span className="tabular font-semibold text-ink sm:text-base">
                        {money(w.cost)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {sites.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-line/60 py-10 text-center text-sm text-out/70">
            <span className="block text-4xl mb-3">📭</span>
            مفيش بيانات حضور مرتبطة بورش الشهر ده
          </div>
        )}

        {/* Grand total */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-linear-to-r from-ink to-gray-800 px-4 py-3.5 shadow-lg shadow-ink/20 sm:px-5 sm:py-4">
          <span className="text-sm font-bold text-white sm:text-base">
            📊 إجمالي الرواتب الموزّعة
          </span>

          <span className="tabular text-lg font-black text-white sm:text-xl">
            {money(grandTotal)}
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