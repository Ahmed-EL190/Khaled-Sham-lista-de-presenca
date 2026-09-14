import { createPortal } from "react-dom";
import logo from "../assets/logo.png";
import { formatDateLong, todayKey, formatTime } from "../lib/format";

function money(n) {
  return `${Math.round(Number(n) || 0).toLocaleString("en-US")} Kz`;
}

function roundDaily(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

function formatPaidAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("ar-EG-u-nu-latn", {
    timeZone: "Africa/Luanda",
    day: "numeric",
    month: "short",
  });
  return `${date} - ${formatTime(iso)}`;
}

export default function PayslipModal({
  summary,
  monthLabel,
  monthKey,
  deductions,
  expenses,
  attendance = [],
  isPaid = false,
  paidAt = null,
  onTogglePaid,
  onClose,
  onUpdateWorker,
  onAddDeduction,
  onRemoveDeduction,
  onAddExpense,
  onRemoveExpense,
  onAddAttendance,
  onRemoveAttendance,
}) {
  if (!summary) return null;

  const workerId = summary.workerId;
  const workerName = summary.name;

  function editWage() {
    if (!onUpdateWorker) return;

    const value = window.prompt(
      `المرتب الأساسي الشهري بتاع ${workerName}؟ (Kz)`,
      summary.basicSalary || 0
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num) || num < 0) {
      alert("اكتب رقم صحيح");
      return;
    }

    onUpdateWorker(workerId, { wage: num });
  }

  function editAlmoco() {
    if (!onUpdateWorker) return;

    const value = window.prompt(
      `قيمة ALMOCO الشهرية بتاع ${workerName}؟ (Kz)`,
      summary.almoco || 0
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num) || num < 0) {
      alert("اكتب رقم صحيح");
      return;
    }

    onUpdateWorker(workerId, { almoco: num });
  }

  function addAttendancePrompt() {
    if (!onAddAttendance) return;

    const defaultDate =
      monthKey === todayKey().slice(0, 7)
        ? todayKey()
        : `${monthKey}-01`;

    const value = window.prompt(
      `سجّل يوم حضور جديد لـ ${workerName} (تصحيح غياب)\nاكتب التاريخ بالصيغة دي: 2026-01-15`,
      defaultDate
    );

    if (value === null) return;

    const trimmed = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      alert("التاريخ لازم يكون بالصيغة دي: 2026-01-15 مثلاً");
      return;
    }

    if (!trimmed.startsWith(monthKey)) {
      if (
        !window.confirm(
          "التاريخ ده مش داخل الشهر اللي فاتحه دلوقتي، متأكد تكمل؟"
        )
      ) {
        return;
      }
    }

    if (attendance.some((r) => r.dateKey === trimmed)) {
      alert("اليوم ده متسجل حضور فيه أصلاً");
      return;
    }

    onAddAttendance({
      dateKey: trimmed,
      workerId,
      workerName,
    });
  }

  function removeAttendanceConfirm(r) {
    if (!onRemoveAttendance) return;

    if (
      window.confirm(
        `متأكد إنك عايز تشيل يوم الحضور ده (${formatDateLong(
          r.dateKey
        )})؟ هيتحسب "غياب" بدل ما هو حاضر.`
      )
    ) {
      onRemoveAttendance({
        dateKey: r.dateKey,
        workerId,
      });
    }
  }

  function addDeductionPrompt() {
    if (!onAddDeduction) return;

    const amountValue = window.prompt(
      `قيمة الخصم الجديد لـ ${workerName}؟ (Kz)`,
      ""
    );

    if (amountValue === null) return;

    const amount = Number(amountValue);

    if (Number.isNaN(amount) || amount <= 0) {
      alert("اكتب رقم أكبر من صفر");
      return;
    }

    const reason =
      window.prompt("سبب الخصم؟ (اختياري)", "") || "";

    onAddDeduction({
      workerId,
      workerName,
      dateKey: todayKey(),
      amount,
      reason: reason.trim(),
    });
  }

  function removeDeductionConfirm(d) {
    if (!onRemoveDeduction) return;

    if (
      window.confirm(
        `تشيل الخصم ده (${money(d.amount)}${d.reason ? ` — ${d.reason}` : ""})؟`
      )
    ) {
      onRemoveDeduction(d.id);
    }
  }

  function addExpensePrompt() {
    if (!onAddExpense) return;

    const amountValue = window.prompt(
      `قيمة السلفة/المصروف لـ ${workerName}؟ (Kz)\n(هتتخصم فورًا من صافي مرتب الشهر ده)`,
      ""
    );

    if (amountValue === null) return;

    const amount = Number(amountValue);

    if (Number.isNaN(amount) || amount <= 0) {
      alert("اكتب رقم أكبر من صفر");
      return;
    }

    const reason =
      window.prompt("سبب السلفة/المصروف؟ (اختياري)", "") || "";

    onAddExpense({
      workerId,
      workerName,
      dateKey: todayKey(),
      amount,
      reason: reason.trim(),
      siteId: null,
      siteName: null,
    });
  }

  function removeExpenseConfirm(e) {
    if (!onRemoveExpense) return;

    if (
      window.confirm(
        `تشيل السلفة/المصروف ده (${money(e.amount)}${e.reason ? ` — ${e.reason}` : ""})؟`
      )
    ) {
      onRemoveExpense(e.id);
    }
  }

  function addNewDebt() {
    if (!onUpdateWorker) return;

    const value = window.prompt(
      `قيمة السلفة الجديدة لـ ${workerName}؟ (Kz)\nهتتضاف على الدين المتبقي وهتفضل معلقة لحد ما تتخصم من مرتبه على شهور.`,
      ""
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num) || num <= 0) {
      alert("اكتب رقم أكبر من صفر");
      return;
    }

    const current = Number(summary.debtBalance || 0);

    onUpdateWorker(workerId, { debtBalance: current + num });
  }

  function repayFromSalary() {
    if (!onUpdateWorker) return;

    const current = Number(summary.debtBalance || 0);

    if (current <= 0) {
      alert(`${workerName} مفيهوش دين متبقي دلوقتي`);
      return;
    }

    const value = window.prompt(
      `${workerName} عليه ${current.toLocaleString("en-US")} Kz.\nتحب تخصم قد ايه من مرتب الشهر ده؟`,
      String(current)
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num) || num <= 0) {
      alert("اكتب رقم أكبر من صفر");
      return;
    }

    const capped = Math.min(num, current);

    if (onAddDeduction) {
      onAddDeduction({
        workerId,
        workerName,
        dateKey: todayKey(),
        amount: capped,
        reason: "سداد سلفة",
      });
    }

    onUpdateWorker(workerId, { debtBalance: current - capped });
  }

  function editDebtBalance() {
    if (!onUpdateWorker) return;

    const value = window.prompt(
      `تصحيح رصيد الدين يدويًا لـ ${workerName} (Kz)`,
      summary.debtBalance || 0
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num) || num < 0) {
      alert("اكتب رقم صفر أو أكبر");
      return;
    }

    onUpdateWorker(workerId, { debtBalance: num });
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
        className="payslip-print w-full max-w-md rounded-2xl bg-white p-5 shadow-lg print:max-w-none print:rounded-none print:p-0 sm:p-6"
      >
        {/* Buttons */}
        <div className="print-hide mb-4 flex flex-wrap items-center justify-end gap-2">
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
            <h2 className="text-base font-black text-ink sm:text-lg">📄 كشف مرتب</h2>
            <p className="text-xs text-out/70 sm:text-sm">📅 {monthLabel}</p>
          </div>
        </div>

        {/* Payment status */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-page/50 px-3 py-2.5 sm:px-4">
          <span className="text-xs font-semibold text-out/70">حالة الاستلام</span>

          {onTogglePaid ? (
            <button
              onClick={onTogglePaid}
              className="print-hide flex items-center gap-1.5 transition hover:scale-105"
            >
              {isPaid ? (
                <span className="flex flex-wrap items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200">
                  ✅ اتصرف
                  {paidAt && (
                    <span className="font-normal text-emerald-600/80">
                      ({formatPaidAt(paidAt)})
                    </span>
                  )}
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 hover:bg-amber-200">
                  ⏳ لسه ما استلمش
                </span>
              )}
            </button>
          ) : (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isPaid
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isPaid ? "✅ اتصرف" : "⏳ لسه ما استلمش"}
            </span>
          )}

          {onTogglePaid && (
            <span
              className={`hidden rounded-full px-3 py-1 text-xs font-bold print:inline-block ${
                isPaid
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isPaid ? "✅ اتصرف" : "⏳ لسه ما استلمش"}
            </span>
          )}
        </div>

        {onTogglePaid && (
          <p className="print-hide mt-1 text-[10px] text-out/60">
            👆 دوس على الحالة عشان تغيّرها
          </p>
        )}

        {/* Worker */}
        <div className="mt-4">
          <p className="text-xs text-out/70">اسم العامل</p>
          <p className="wrap-break-word text-lg font-bold text-ink sm:text-xl">
            {summary.name}
          </p>
        </div>

        {/* Salary */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {onUpdateWorker && (
            <button
              onClick={editWage}
              title="دوس عشان تعدّل المرتب الأساسي"
              className="print-hide rounded-xl bg-page/50 px-3 py-2.5 text-right transition hover:bg-mist/50 sm:px-4"
            >
              <p className="text-xs text-out/70">المرتب الأساسي ✎</p>
              <p className="tabular font-semibold text-ink">
                {money(summary.basicSalary)}
              </p>
            </button>
          )}

          <div
            className={`rounded-xl bg-page/50 px-3 py-2.5 sm:px-4 ${
              onUpdateWorker ? "hidden print:block" : ""
            }`}
          >
            <p className="text-xs text-out/70">المرتب الأساسي</p>
            <p className="tabular font-semibold text-ink">
              {money(summary.basicSalary)}
            </p>
          </div>

          <div className="rounded-xl bg-page/50 px-3 py-2.5 sm:px-4">
            <p className="text-xs text-out/70">اليومية</p>
            <p className="tabular font-semibold text-ink">
              {roundDaily(summary.dailyWage).toLocaleString("en-US")} Kz
            </p>
          </div>

          <div className="rounded-xl bg-page/50 px-3 py-2.5 sm:px-4">
            <p className="text-xs text-out/70">أيام كاملة</p>
            <p className="tabular font-semibold text-ink">
              {summary.fullDays + summary.offDaysWorked + summary.paidHolidayDays}
            </p>
          </div>

          <div className="rounded-xl bg-page/50 px-3 py-2.5 sm:px-4">
            <p className="text-xs text-out/70">الغياب</p>
            <p className={`tabular font-semibold ${summary.absentDays > 0 ? "text-rose-600" : "text-ink"}`}>
              {summary.absentDays}
            </p>
          </div>

          <div className="rounded-xl bg-page/50 px-3 py-2.5 sm:px-4">
            <p className="text-xs text-out/70">إجازات مدفوعة</p>
            <p className="tabular font-semibold text-ink">
              {summary.paidHolidayDays}
            </p>
          </div>

          {onUpdateWorker && (
            <button
              onClick={editAlmoco}
              title="دوس عشان تعدّل ALMOCO"
              className="print-hide rounded-xl bg-page/50 px-3 py-2.5 text-right transition hover:bg-mist/50 sm:px-4"
            >
              <p className="text-xs text-out/70">ALMOCO ✎</p>
              <p className="tabular font-semibold text-emerald-600">
                {money(summary.almoco)}
              </p>
            </button>
          )}

          <div
            className={`rounded-xl bg-page/50 px-3 py-2.5 sm:px-4 ${
              onUpdateWorker ? "hidden print:block" : ""
            }`}
          >
            <p className="text-xs text-out/70">ALMOCO</p>
            <p className="tabular font-semibold text-emerald-600">
              {money(summary.almoco)}
            </p>
          </div>
        </div>

        {/* Basic salary earned */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-linear-to-r from-mist/50 to-mist/30 px-4 py-3 text-sm">
          <span className="font-semibold text-steel">
            💰 المستحق {summary.almoco > 0 ? "(أساسي + أكل)" : ""}
          </span>
          <span className="tabular font-bold text-ink">
            {money(summary.gross)}
          </span>
        </div>

        {summary.almoco > 0 && (
          <p className="mt-1 text-[11px] text-out/60">
            اليومية شاملة بدل الأكل ({money(summary.almoco)} شهريًا) موزّع على أيام الحضور
          </p>
        )}

        {/* Attendance */}
        {(onAddAttendance || attendance.length > 0) && (
          <div className="print-hide mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-out/70">
                📋 أيام الحضور ({attendance.length})
              </h3>

              {onAddAttendance && (
                <button
                  onClick={addAttendancePrompt}
                  className="text-[11px] font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                >
                  + إضافة يوم
                </button>
              )}
            </div>

            {attendance.length > 0 ? (
              <ul className="mt-1 max-h-40 divide-y divide-line/60 overflow-y-auto print:max-h-none print:overflow-visible">
                {attendance.map((r) => (
                  <li
                    key={r.dateKey}
                    className="flex items-center justify-between gap-2 py-1.5 text-sm"
                  >
                    <span className="text-ink-soft">
                      {formatDateLong(r.dateKey)}
                    </span>

                    {onRemoveAttendance && (
                      <button
                        onClick={() => removeAttendanceConfirm(r)}
                        title="شيل يوم الحضور ده (يتحسب غياب)"
                        className="print-hide rounded-lg px-2 py-0.5 text-xs text-out/60 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-out/60">مفيش أيام حضور مسجلة</p>
            )}
          </div>
        )}

        {/* Deductions */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-out/70">📉 الخصومات</h3>

            {onAddDeduction && (
              <button
                onClick={addDeductionPrompt}
                className="text-[11px] font-semibold text-rose-600 transition hover:text-rose-700 hover:underline"
              >
                + إضافة خصم
              </button>
            )}
          </div>

          {deductions.length > 0 ? (
            <ul className="mt-1 divide-y divide-line/60">
              {deductions.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm"
                >
                  <span className="text-ink-soft">
                    {formatDateLong(d.dateKey)}
                    {d.reason ? ` — ${d.reason}` : ""}
                  </span>

                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular font-semibold text-rose-600">
                      -{money(d.amount)}
                    </span>

                    {onRemoveDeduction && (
                      <button
                        onClick={() => removeDeductionConfirm(d)}
                        title="شيل الخصم ده"
                        className="print-hide rounded-lg px-2 py-0.5 text-xs text-out/60 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-out/60">مفيش خصومات الشهر ده</p>
          )}
        </div>

        {/* Expenses */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-out/70">💳 المصروفات / السلف</h3>

            {onAddExpense && (
              <button
                onClick={addExpensePrompt}
                className="text-[11px] font-semibold text-orange-600 transition hover:text-orange-700 hover:underline"
              >
                + إضافة سلفة
              </button>
            )}
          </div>

          {expenses.length > 0 ? (
            <ul className="mt-1 divide-y divide-line/60">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm"
                >
                  <span className="text-ink-soft">
                    {formatDateLong(e.dateKey)}
                    {e.reason ? ` — ${e.reason}` : ""}
                  </span>

                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular font-semibold text-orange-600">
                      -{money(e.amount)}
                    </span>

                    {onRemoveExpense && (
                      <button
                        onClick={() => removeExpenseConfirm(e)}
                        title="شيل السلفة/المصروف ده"
                        className="print-hide rounded-lg px-2 py-0.5 text-xs text-out/60 transition hover:bg-orange-50 hover:text-orange-600"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-out/60">مفيش مصروفات الشهر ده</p>
          )}
        </div>

        {/* INSS */}
        {summary.hasInss && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-line/60 bg-page/50 px-4 py-2.5 text-sm">
            <span className="font-semibold text-ink">🏛️ الضمان الاجتماعي (INSS) — 3%</span>
            <span className="tabular font-bold text-purple-600">
              -{money(summary.inss)}
            </span>
          </div>
        )}

        {/* Net */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-linear-to-r from-ink to-gray-800 px-4 py-3.5 shadow-lg shadow-ink/20">
          <span className="text-sm font-bold text-white">الصافي المستحق</span>
          <span className="tabular text-xl font-black text-white sm:text-2xl">
            {money(summary.net)}
          </span>
        </div>

        {/* Debt */}
        {Number(summary.debtBalance || 0) > 0 ? (
          <div className="mt-3 rounded-xl border border-rose-200/60 bg-rose-50/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-rose-700">
                💰 لسه باقي عليه من السلفة
              </span>
              <span className="tabular text-lg font-black text-rose-700">
                {money(summary.debtBalance)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-rose-200/60 pt-2">
              <span className="text-xs font-bold text-ink">الصافي بعد خصم السلفة</span>
              <span
                className={`tabular text-base font-black ${
                  summary.net - summary.debtBalance < 0
                    ? "text-rose-600"
                    : "text-ink"
                }`}
              >
                {money(summary.net - summary.debtBalance)}
              </span>
            </div>

            {onUpdateWorker && (
              <div className="print-hide mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <button
                  onClick={repayFromSalary}
                  className="rounded-lg bg-rose-100 px-3 py-1.5 text-rose-700 transition hover:bg-rose-200"
                >
                  سداد من المرتب
                </button>

                <button
                  onClick={editDebtBalance}
                  className="text-rose-500 transition hover:text-rose-700 hover:underline"
                >
                  تصحيح الرصيد
                </button>

                <button
                  onClick={addNewDebt}
                  className="rounded-lg border border-line/60 px-3 py-1.5 text-out transition hover:border-ink/30 hover:bg-page hover:text-ink"
                >
                  + سلفة جديدة
                </button>
              </div>
            )}
          </div>
        ) : (
          onUpdateWorker && (
            <button
              onClick={addNewDebt}
              className="print-hide mt-2 text-xs font-medium text-out/60 transition hover:text-ink hover:underline"
            >
              + تسجيل سلفة كبيرة (هتتقسم على شهور)
            </button>
          )
        )}

        <p className="mt-4 text-center text-[10px] text-out/40 sm:text-xs">
          📄 تم إصدار الكشف بتاريخ {formatDateLong(todayKey())}
        </p>
      </div>
    </div>,
    document.body,
  );
}