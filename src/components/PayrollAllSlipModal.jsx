import logo from "../assets/logo.png";
import { formatDateLong, todayKey } from "../lib/format";

function money(n) {
  return `${Math.round(n || 0).toLocaleString("en-US")} Kz`;
}

export default function PayrollAllSlipModal({ summaries, monthLabel, onClose }) {
  if (!summaries || summaries.length === 0) return null;

  const totals = summaries.reduce(
    (acc, s) => {
      acc.gross += s.gross;
      acc.deductions += s.deductionsTotal;
      acc.expenses += s.expensesTotal;
      acc.inss += s.inss;
      acc.net += s.net;
      return acc;
    },
    { gross: 0, deductions: 0, expenses: 0, inss: 0, net: 0 }
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-6 print:static print:block print:overflow-visible print:bg-white print:p-0"
      onClick={onClose}
    >
      {/* Print rules: hide everything on the page except this card, and never repeat it per page. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .payroll-all-print, .payroll-all-print * { visibility: visible; }
          .payroll-all-print {
            position: static;
            width: 100%;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hide { display: none !important; }
          .payroll-all-print table { border-collapse: collapse; }
          .payroll-all-print tr { break-inside: avoid; page-break-inside: avoid; }
          .payroll-all-print thead { display: table-header-group; }
          @page { size: landscape; margin: 12mm; }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="payroll-all-print w-full max-w-5xl rounded-2xl bg-white p-6 shadow-lg print:max-w-none print:rounded-none print:p-0"
      >
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

        <div className="flex items-center gap-3 border-b border-line pb-4">
          <img src={logo} alt="" className="h-12 w-12 object-contain" />
          <div>
            <h2 className="text-base font-black text-ink">كشف مرتبات — كل العمال</h2>
            <p className="text-xs text-out">{monthLabel}</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="tabular w-full min-w-[900px] text-right text-xs">
            <thead>
              <tr className="border-b border-line bg-page text-out">
                <th className="whitespace-nowrap px-2 py-2 font-semibold">#</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">العامل</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">المرتب الشهري</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">أيام كاملة</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">إجازات مدفوعة</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">نص أيام</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">الإجمالي المستحق</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">الخصومات</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">المصروفات/السلف</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">الضمان الاجتماعي</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">الصافي</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold">توقيع الاستلام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {summaries.map((s, i) => (
                <tr key={s.workerId}>
                  <td className="px-2 py-2 text-ink-soft">{i + 1}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-semibold text-ink">{s.name}</td>
                  <td className="px-2 py-2 text-ink-soft">{money(s.monthlyWage)}</td>
                  <td className="px-2 py-2 text-ink-soft">
                    {s.fullDays + s.offDaysWorked + s.paidHolidayDays}
                  </td>
                  <td className="px-2 py-2 text-ink-soft">{s.paidHolidayDays}</td>
                  <td className="px-2 py-2 text-ink-soft">{s.halfDays}</td>
                  <td className="px-2 py-2 text-ink-soft">{money(s.gross)}</td>
                  <td className="px-2 py-2 text-red-600">
                    {s.deductionsTotal > 0 ? `-${money(s.deductionsTotal)}` : "—"}
                  </td>
                  <td className="px-2 py-2 text-orange-600">
                    {s.expensesTotal > 0 ? `-${money(s.expensesTotal)}` : "—"}
                  </td>
                  <td className="px-2 py-2 text-ink">
                    {s.hasInss ? `-${money(s.inss)}` : "—"}
                  </td>
                  <td className="px-2 py-2 font-bold text-ink">{money(s.net)}</td>
                  <td className="px-2 py-2">
                    <div className="h-6 w-24 border-b border-line"></div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line font-bold text-ink">
                <td className="px-2 py-2" colSpan={6}>
                  الإجمالي
                </td>
                <td className="px-2 py-2">{money(totals.gross)}</td>
                <td className="px-2 py-2 text-red-600">
                  {totals.deductions > 0 ? `-${money(totals.deductions)}` : "—"}
                </td>
                <td className="px-2 py-2 text-orange-600">
                  {totals.expenses > 0 ? `-${money(totals.expenses)}` : "—"}
                </td>
                <td className="px-2 py-2 text-ink">
                  {totals.inss > 0 ? `-${money(totals.inss)}` : "—"}
                </td>
                <td className="px-2 py-2">{money(totals.net)}</td>
                <td className="px-2 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-4 text-center text-[10px] text-out">
          تم إصدار الكشف بتاريخ {formatDateLong(todayKey())}
        </p>
      </div>
    </div>
  );
}