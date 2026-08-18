import { createPortal } from "react-dom";
import logo from "../assets/logo.png";
import { formatDateLong, todayKey } from "../lib/format";

function money(n) {
  return `${Math.round(Number(n) || 0).toLocaleString("en-US")} Kz`;
}

function roundDaily(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

export default function PayslipModal({
  summary,
  monthLabel,
  deductions,
  expenses,
  onClose,
}) {
  if (!summary) return null;

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

          .payslip-print {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: 0 !important;
          }

          .print-hide {
            display: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="payslip-print w-full max-w-md rounded-2xl bg-white p-6 shadow-lg print:max-w-none print:rounded-none print:p-0"
      >
        <div className="print-hide mb-4 flex items-center justify-end gap-2">
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
          <img
            src={logo}
            alt=""
            className="h-12 w-12 object-contain"
          />

          <div>
            <h2 className="text-base font-black text-ink">
              كشف مرتب
            </h2>

            <p className="text-xs text-out">
              {monthLabel}
            </p>
          </div>
        </div>

        {/* Worker */}
        <div className="mt-4">
          <p className="text-xs text-out">
            اسم العامل
          </p>

          <p className="text-lg font-bold text-ink">
            {summary.name}
          </p>
        </div>

        {/* Salary */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">
              المرتب الأساسي
            </p>

            <p className="tabular font-semibold text-ink">
              {money(summary.basicSalary)}
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">
              اليومية
            </p>

            <p className="tabular font-semibold text-ink">
              {roundDaily(summary.dailyWage).toLocaleString("en-US")} Kz
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">
              أيام كاملة
            </p>

            <p className="tabular font-semibold text-ink">
              {summary.fullDays +
                summary.offDaysWorked +
                summary.paidHolidayDays}
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">
              نص أيام
            </p>

            <p className="tabular font-semibold text-ink">
              {summary.halfDays}
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">
              إجازات مدفوعة
            </p>

            <p className="tabular font-semibold text-ink">
              {summary.paidHolidayDays}
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">
              ALMOCO
            </p>

            <p className="tabular font-semibold text-in">
              {money(summary.almoco)}
            </p>
          </div>
        </div>

        {/* Basic salary earned */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm">
          <span className="font-semibold text-steel">
            الأساسي المستحق
          </span>

          <span className="tabular font-bold text-steel">
            {money(summary.gross)}
          </span>
        </div>

        {/* Almoco */}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-page px-3 py-2 text-sm">
          <span className="font-semibold text-ink">
            ALMOCO — بدل الأكل
          </span>

          <span className="tabular font-bold text-in">
            +{money(summary.almoco)}
          </span>
        </div>

        {/* Deductions */}
        {deductions.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold text-out">
              الخصومات
            </h3>

            <ul className="mt-1 divide-y divide-line">
              {deductions.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-ink-soft">
                    {formatDateLong(d.dateKey)}
                    {d.reason ? ` — ${d.reason}` : ""}
                  </span>

                  <span className="tabular font-semibold text-red-600">
                    -{money(d.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expenses */}
        {expenses.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold text-out">
              المصروفات / السلف
            </h3>

            <ul className="mt-1 divide-y divide-line">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-ink-soft">
                    {formatDateLong(e.dateKey)}
                    {e.reason ? ` — ${e.reason}` : ""}
                  </span>

                  <span className="tabular font-semibold text-orange-600">
                    -{money(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* INSS */}
        {summary.hasInss && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-page px-3 py-2 text-sm">
            <span className="font-semibold text-ink">
              الضمان الاجتماعي (INSS) — 3%
            </span>

            <span className="tabular font-bold text-purple-700">
              -{money(summary.inss)}
            </span>
          </div>
        )}

        {/* Net */}
        <div className="mt-5 flex items-center justify-between rounded-lg border border-line bg-page px-4 py-3">
          <span className="text-sm font-bold text-ink">
            الصافي المستحق
          </span>

          <span className="tabular text-xl font-black text-ink">
            {money(summary.net)}
          </span>
        </div>

        <p className="mt-4 text-center text-[10px] text-out">
          تم إصدار الكشف بتاريخ {formatDateLong(todayKey())}
        </p>
      </div>
    </div>,
    document.body
  );
}