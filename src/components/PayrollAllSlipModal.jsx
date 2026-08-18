import { createPortal } from "react-dom";
import logo from "../assets/logo.png";
import { formatDateLong, todayKey } from "../lib/format";

function money(n) {
  return `${Math.round(Number(n) || 0).toLocaleString("en-US")} Kz`;
}

export default function PayrollAllSlipModal({
  summaries,
  monthLabel,
  onClose,
}) {
  if (!summaries || summaries.length === 0) return null;

  const totals = summaries.reduce(
    (acc, s) => {
      acc.basicSalary += s.basicSalary || 0;
      acc.almoco += s.almoco || 0;
      acc.gross += s.gross || 0;
      acc.deductions += s.deductionsTotal || 0;
      acc.expenses += s.expensesTotal || 0;
      acc.inss += s.inss || 0;
      acc.net += s.net || 0;

      return acc;
    },
    {
      basicSalary: 0,
      almoco: 0,
      gross: 0,
      deductions: 0,
      expenses: 0,
      inss: 0,
      net: 0,
    }
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-6 print:static print:block print:overflow-visible print:bg-white print:p-0"
      onClick={onClose}
    >
      <style>{`
        @media print {

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
          }

          #root {
            display: none !important;
          }

          .payroll-all-print {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
          }

          .print-hide {
            display: none !important;
          }

          .payroll-print-table-wrapper {
            overflow: visible !important;
            width: 100% !important;
          }

          .payroll-print-table {
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            font-size: 8px !important;
          }

          .payroll-print-table th,
          .payroll-print-table td {
            padding: 5px 3px !important;
            border: 1px solid #777 !important;
            vertical-align: middle !important;
            overflow: hidden !important;
            word-break: break-word !important;
          }

          .payroll-print-table th {
            font-weight: 700 !important;
            white-space: normal !important;
          }

          .payroll-print-table td.name-cell {
            white-space: normal !important;
            word-break: break-word !important;
          }

          .payroll-print-table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .payroll-print-table thead {
            display: table-header-group !important;
          }

          .payroll-print-table tfoot {
            display: table-footer-group !important;
          }

          @page {
            size: A4 landscape;
            margin: 8mm;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="payroll-all-print w-full max-w-6xl rounded-2xl bg-white p-6 shadow-lg print:max-w-none print:rounded-none print:p-0"
      >
        {/* Buttons */}
        <div className="print-hide mb-4 flex items-center justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
          >
            طباعة / PDF
          </button>

          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-out hover:bg-page"
          >
            إغلاق
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line pb-4 print:pb-2">
          <img
            src={logo}
            alt=""
            className="h-12 w-12 object-contain print:h-10 print:w-10"
          />

          <div>
            <h2 className="text-base font-black text-ink print:text-sm">
              كشف مرتبات — كل العمال
            </h2>

            <p className="text-xs text-out print:text-[9px]">
              {monthLabel}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="payroll-print-table-wrapper mt-4 overflow-x-auto print:mt-2">
          <table className="payroll-print-table tabular w-full text-right text-xs">
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>

            <thead>
              <tr className="border-b border-line bg-page text-out">
                <th>#</th>
                <th>العامل</th>
                <th>المرتب الأساسي</th>
                <th>أيام كاملة</th>
                <th>إجازات مدفوعة</th>
                <th>نص أيام</th>
                <th>الأساسي المستحق</th>
                <th>ALMOCO</th>
                <th>الخصومات</th>
                <th>السلف</th>
                <th>الضمان الاجتماعي</th>
                <th>الصافي</th>
              </tr>
            </thead>

            <tbody>
              {summaries.map((s, i) => (
                <tr key={s.workerId}>
                  <td className="px-2 py-2 text-ink-soft">
                    {i + 1}
                  </td>

                  <td className="name-cell px-2 py-2 font-semibold text-ink">
                    {s.name}
                  </td>

                  <td className="px-2 py-2 text-ink-soft">
                    {money(s.basicSalary)}
                  </td>

                  <td className="px-2 py-2 text-ink-soft">
                    {s.fullDays +
                      s.offDaysWorked +
                      s.paidHolidayDays}
                  </td>

                  <td className="px-2 py-2 text-ink-soft">
                    {s.paidHolidayDays}
                  </td>

                  <td className="px-2 py-2 text-ink-soft">
                    {s.halfDays}
                  </td>

                  <td className="px-2 py-2 text-ink-soft">
                    {money(s.gross)}
                  </td>

                  <td className="px-2 py-2 font-semibold text-in">
                    {s.almoco > 0
                      ? money(s.almoco)
                      : "—"}
                  </td>

                  <td className="px-2 py-2 text-red-600">
                    {s.deductionsTotal > 0
                      ? `-${money(s.deductionsTotal)}`
                      : "—"}
                  </td>

                  <td className="px-2 py-2 text-orange-600">
                    {s.expensesTotal > 0
                      ? `-${money(s.expensesTotal)}`
                      : "—"}
                  </td>

                  <td className="px-2 py-2 text-purple-700">
                    {s.hasInss
                      ? `-${money(s.inss)}`
                      : "—"}
                  </td>

                  <td className="px-2 py-2 font-black text-ink">
                    {money(s.net)}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total */}
            <tfoot>
              <tr className="bg-page font-bold">
                <td colSpan="2" className="px-2 py-2">
                  الإجمالي
                </td>

                <td className="px-2 py-2">
                  {money(totals.basicSalary)}
                </td>

                <td colSpan="3"></td>

                <td className="px-2 py-2">
                  {money(totals.gross)}
                </td>

                <td className="px-2 py-2 text-in">
                  {money(totals.almoco)}
                </td>

                <td className="px-2 py-2 text-red-600">
                  {totals.deductions > 0
                    ? `-${money(totals.deductions)}`
                    : "—"}
                </td>

                <td className="px-2 py-2 text-orange-600">
                  {totals.expenses > 0
                    ? `-${money(totals.expenses)}`
                    : "—"}
                </td>

                <td className="px-2 py-2 text-purple-700">
                  {totals.inss > 0
                    ? `-${money(totals.inss)}`
                    : "—"}
                </td>

                <td className="px-2 py-2 font-black">
                  {money(totals.net)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-3 text-center text-[10px] text-out print:mt-2 print:text-[8px]">
          تم إصدار الكشف بتاريخ {formatDateLong(todayKey())}
        </p>
      </div>
    </div>,
    document.body
  );
}