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
  costBasis = "net",
  onChangeCostBasis,
  onClose,
}) {
  if (!sites) return null;

  const grandTotal = sites.reduce((sum, s) => sum + s.totalCost, 0);

  function exportExcel() {
    const costLabel =
      costBasis === "netAfterDebt"
        ? "التكلفة (من الصافي بعد السلفة)"
        : "التكلفة (من الصافي)";

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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-6 print:static print:block print:overflow-visible print:bg-white print:p-0"
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
        className="site-cost-print w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg print:max-w-none print:rounded-none print:p-0"
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
              توزيع تكلفة الرواتب على الورش
            </h2>

            <p className="text-xs text-out">{monthLabel}</p>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-out">
          التكلفة هنا موزّعة من{" "}
          {costBasis === "netAfterDebt"
            ? "الصافي بعد خصم السلفة"
            : "الصافي"}{" "}
          لكل عامل حسب نسبة أيام شغله في كل ورشة الشهر ده (والإجازات
          الرسمية بتتحط في "بدون ورشة").
        </p>

        {onChangeCostBasis && (
          <div className="print-hide mt-3 flex items-center gap-2 rounded-lg border border-line p-1">
            <button
              onClick={() => onChangeCostBasis("net")}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                costBasis === "net"
                  ? "bg-ink text-white"
                  : "text-out hover:bg-page"
              }`}
            >
              تتقسم بعد الصافي
            </button>

            <button
              onClick={() => onChangeCostBasis("netAfterDebt")}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                costBasis === "netAfterDebt"
                  ? "bg-ink text-white"
                  : "text-out hover:bg-page"
              }`}
            >
              تتقسم بعد الصافي من السلفة
            </button>
          </div>
        )}

        {/* Sites */}
        <div className="mt-4 space-y-4">
          {sites.map((site) => (
            <div
              key={site.siteId || "none"}
              className="site-cost-block rounded-lg border border-line"
            >
              <div className="site-cost-block-header flex items-center justify-between rounded-t-lg bg-page px-3 py-2">
                <span className="text-sm font-bold text-ink">
                  {site.name}
                </span>

                <span className="tabular text-sm font-black text-in">
                  {money(site.totalCost)}
                </span>
              </div>

              <ul className="divide-y divide-line">
                {site.workers.map((w) => (
                  <li
                    key={w.workerId}
                    className="site-cost-row flex items-center justify-between gap-2 px-3 py-1.5 text-sm"
                  >
                    <span className="text-ink-soft">{w.name}</span>

                    <span className="flex shrink-0 items-center gap-2">
                      {w.units !== null && w.units !== undefined && (
                        <span className="tabular text-xs text-out">
                          {w.units} يوم
                        </span>
                      )}

                      <span className="tabular font-semibold text-ink">
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
          <p className="mt-4 text-center text-sm text-out">
            مفيش بيانات حضور مرتبطة بورش الشهر ده
          </p>
        )}

        {/* Grand total */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-page px-4 py-3">
          <span className="text-sm font-bold text-ink">
            إجمالي الرواتب الموزّعة
          </span>

          <span className="tabular text-lg font-black text-ink">
            {money(grandTotal)}
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