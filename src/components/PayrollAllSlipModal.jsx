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
      debtBalance: 0,
    },
  );

  totals.debtBalance = summaries.reduce(
    (sum, s) => sum + (s.debtBalance || 0),
    0
  );
  totals.netAfterDebt = totals.net - totals.debtBalance;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-3 py-4 print:static print:block print:overflow-visible print:bg-white print:p-0 sm:px-4 sm:py-6"
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
            font-size: 7.5px !important;
          }

          .payroll-print-table th,
          .payroll-print-table td {
            padding: 4px 2px !important;
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
        className="payroll-all-print w-full max-w-6xl rounded-2xl bg-white p-4 shadow-lg print:max-w-none print:rounded-none print:p-0 sm:p-6"
      >
        {/* Buttons */}
        <div className="print-hide mb-4 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-linear-to-r from-ink to-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-ink/20 sm:px-6 sm:py-2.5"
          >
            🖨️ طباعة / PDF
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border border-line/60 px-4 py-2.5 text-sm font-semibold text-out transition hover:bg-page sm:px-6 sm:py-2.5"
          >
            ✕ إغلاق
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line/60 pb-4 print:pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-ink to-gray-800 p-1.5 shadow-md shadow-ink/10 print:h-10 print:w-10">
            <img src={logo} alt="" className="h-full w-full object-contain" />
          </div>

          <div>
            <h2 className="text-base font-black text-ink print:text-sm sm:text-lg">
              كشف مرتبات — كل العمال
            </h2>

            <p className="text-xs text-out/70 print:text-[9px] sm:text-sm">
              📅 {monthLabel}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="payroll-print-table-wrapper mt-4 overflow-x-auto rounded-xl border border-line/60 print:mt-2 print:border-0">
          <table className="payroll-print-table tabular w-full min-w-225 text-right text-xs">
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>

            <thead>
              <tr className="border-b border-line/60 bg-mist/50 text-out">
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">#</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">العامل</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">المرتب الأساسي</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">أيام</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">إجازات</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">الغياب</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">المستحق</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">ALMOCO</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">الخصومات</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">السلف</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">INSS</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">الصافي</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">باقي دين</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold sm:px-3 sm:text-xs">الصافي بعد الدين</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line/40">
              {summaries.map((s, i) => (
                <tr key={s.workerId} className="hover:bg-mist/20 transition">
                  <td className="px-2 py-2 text-center text-ink-soft sm:px-3 sm:py-2.5">
                    {i + 1}
                  </td>

                  <td className="name-cell px-2 py-2 font-semibold text-ink sm:px-3 sm:py-2.5">
                    {s.name}
                  </td>

                  <td className="px-2 py-2 text-ink-soft sm:px-3 sm:py-2.5">
                    {money(s.basicSalary)}
                  </td>

                  <td className="px-2 py-2 text-ink-soft sm:px-3 sm:py-2.5">
                    {s.fullDays + s.offDaysWorked + s.paidHolidayDays}
                  </td>

                  <td className="px-2 py-2 text-ink-soft sm:px-3 sm:py-2.5">
                    {s.paidHolidayDays > 0 ? s.paidHolidayDays : "—"}
                  </td>

                  <td className="px-2 py-2 text-rose-600 sm:px-3 sm:py-2.5">
                    {s.absentDays > 0 ? s.absentDays : "—"}
                  </td>

                  <td className="px-2 py-2 font-medium text-ink sm:px-3 sm:py-2.5">
                    {money(s.gross)}
                  </td>

                  <td className="px-2 py-2 font-semibold text-emerald-600 sm:px-3 sm:py-2.5">
                    {s.almoco > 0 ? money(s.almoco) : "—"}
                  </td>

                  <td className="px-2 py-2 text-rose-600 sm:px-3 sm:py-2.5">
                    {s.deductionsTotal > 0 ? `-${money(s.deductionsTotal)}` : "—"}
                  </td>

                  <td className="px-2 py-2 text-orange-600 sm:px-3 sm:py-2.5">
                    {s.expensesTotal > 0 ? `-${money(s.expensesTotal)}` : "—"}
                  </td>

                  <td className="px-2 py-2 text-purple-600 sm:px-3 sm:py-2.5">
                    {s.hasInss ? `-${money(s.inss)}` : "—"}
                  </td>

                  <td className="px-2 py-2 font-black text-ink sm:px-3 sm:py-2.5">
                    {money(s.net)}
                  </td>

                  <td className="px-2 py-2 font-semibold text-rose-700 sm:px-3 sm:py-2.5">
                    {s.debtBalance > 0 ? money(s.debtBalance) : "—"}
                  </td>

                  <td
                    className={`px-2 py-2 font-black sm:px-3 sm:py-2.5 ${
                      s.net - (s.debtBalance || 0) < 0
                        ? "text-rose-600"
                        : "text-ink"
                    }`}
                  >
                    {s.debtBalance > 0
                      ? money(s.net - s.debtBalance)
                      : money(s.net)}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total */}
            <tfoot>
              <tr className="bg-linear-to-r from-mist/80 to-mist/30 font-bold border-t-2 border-ink/20">
                <td colSpan="2" className="px-2 py-2.5 text-sm sm:px-3">
                  الإجمالي
                </td>

                <td className="px-2 py-2.5 sm:px-3">{money(totals.basicSalary)}</td>

                <td colSpan="3" className="px-2 py-2.5 sm:px-3"></td>

                <td className="px-2 py-2.5 sm:px-3">{money(totals.gross)}</td>

                <td className="px-2 py-2.5 text-emerald-600 sm:px-3">
                  {money(totals.almoco)}
                </td>

                <td className="px-2 py-2.5 text-rose-600 sm:px-3">
                  {totals.deductions > 0 ? `-${money(totals.deductions)}` : "—"}
                </td>

                <td className="px-2 py-2.5 text-orange-600 sm:px-3">
                  {totals.expenses > 0 ? `-${money(totals.expenses)}` : "—"}
                </td>

                <td className="px-2 py-2.5 text-purple-600 sm:px-3">
                  {totals.inss > 0 ? `-${money(totals.inss)}` : "—"}
                </td>

                <td className="px-2 py-2.5 font-black text-ink sm:px-3">
                  {money(totals.net)}
                </td>

                <td className="px-2 py-2.5 font-black text-rose-700 sm:px-3">
                  {totals.debtBalance > 0 ? money(totals.debtBalance) : "—"}
                </td>

                <td
                  className={`px-2 py-2.5 font-black sm:px-3 ${
                    totals.netAfterDebt < 0 ? "text-rose-600" : "text-ink"
                  }`}
                >
                  {money(totals.netAfterDebt)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-3 text-center text-[10px] text-out/50 print:mt-2 print:text-[8px] sm:text-xs">
          📄 تم إصدار الكشف بتاريخ {formatDateLong(todayKey())}
        </p>
      </div>
    </div>,
    document.body,
  );
}