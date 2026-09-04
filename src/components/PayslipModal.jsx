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

  // ------------------------------------------------------------
  // تعديل المرتب الأساسي / ALMOCO
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // الحضور / الغياب
  //
  // مفيش "رقم غياب" منفصل بنعدل فيه — الغياب أصلاً بيتحسب تلقائي
  // من أيام الحضور المسجلة. فعشان نصحح الغياب فعليًا (ويأثر على
  // المرتب صح) لازم نضيف يوم حضور جديد أو نشيل يوم كان متسجل غلط.
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // خصومات الشهر ده
  // ------------------------------------------------------------
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
        `تشيل الخصم ده (${money(d.amount)}${
          d.reason ? ` — ${d.reason}` : ""
        })؟`
      )
    ) {
      onRemoveDeduction(d.id);
    }
  }

  // ------------------------------------------------------------
  // مصروفات / سلف الشهر ده (بتتخصم فورًا من صافي الشهر ده)
  // ------------------------------------------------------------
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
        `تشيل السلفة/المصروف ده (${money(e.amount)}${
          e.reason ? ` — ${e.reason}` : ""
        })؟`
      )
    ) {
      onRemoveExpense(e.id);
    }
  }

  // ------------------------------------------------------------
  // الدين اللي بيتقسم على شهور (زي "الإدارة")
  // ------------------------------------------------------------
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
      `${workerName} عليه ${current.toLocaleString(
        "en-US"
      )} Kz.\nتحب تخصم قد ايه من مرتب الشهر ده؟`,
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
          <img src={logo} alt="" className="h-12 w-12 object-contain" />

          <div>
            <h2 className="text-base font-black text-ink">كشف مرتب</h2>

            <p className="text-xs text-out">{monthLabel}</p>
          </div>
        </div>

        {/* Payment status */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-line px-3 py-2">
          <span className="text-xs font-semibold text-out">
            حالة الاستلام
          </span>

          {onTogglePaid ? (
            <button
              onClick={onTogglePaid}
              className="print-hide flex items-center gap-1.5"
            >
              {isPaid ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                  ✓ اتصرف
                  {paidAt && (
                    <span className="font-normal text-emerald-600">
                      ({formatPaidAt(paidAt)})
                    </span>
                  )}
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100">
                  ● لسه ما استلمش
                </span>
              )}
            </button>
          ) : (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                isPaid
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isPaid ? "✓ اتصرف" : "● لسه ما استلمش"}
            </span>
          )}

          {onTogglePaid && (
            <span
              className={`hidden rounded-full px-2.5 py-1 text-xs font-bold print:inline-block ${
                isPaid
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {isPaid ? "✓ اتصرف" : "● لسه ما استلمش"}
            </span>
          )}
        </div>

        {onTogglePaid && (
          <p className="print-hide mt-1 text-[10px] text-out">
            دوس على الحالة فوق عشان تغيّرها
          </p>
        )}

        {/* Worker */}
        <div className="mt-4">
          <p className="text-xs text-out">اسم العامل</p>

          <p className="break-words text-lg font-bold text-ink">{summary.name}</p>
        </div>

        {/* Salary */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {onUpdateWorker && (
            <button
              onClick={editWage}
              title="دوس عشان تعدّل المرتب الأساسي"
              className="print-hide rounded-lg bg-page px-3 py-2 text-right hover:bg-mist"
            >
              <p className="text-xs text-out">المرتب الأساسي ✎</p>

              <p className="tabular font-semibold text-ink">
                {money(summary.basicSalary)}
              </p>
            </button>
          )}

          <div
            className={`rounded-lg bg-page px-3 py-2 ${
              onUpdateWorker ? "hidden print:block" : ""
            }`}
          >
            <p className="text-xs text-out">المرتب الأساسي</p>

            <p className="tabular font-semibold text-ink">
              {money(summary.basicSalary)}
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">اليومية</p>

            <p className="tabular font-semibold text-ink">
              {roundDaily(summary.dailyWage).toLocaleString("en-US")} Kz
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">أيام كاملة</p>

            <p className="tabular font-semibold text-ink">
              {summary.fullDays +
                summary.offDaysWorked +
                summary.paidHolidayDays}
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">الغياب</p>

            <p className="tabular font-semibold text-ink">
              {summary.absentDays}
            </p>
          </div>

          <div className="rounded-lg bg-page px-3 py-2">
            <p className="text-xs text-out">إجازات مدفوعة</p>

            <p className="tabular font-semibold text-ink">
              {summary.paidHolidayDays}
            </p>
          </div>

          {onUpdateWorker && (
            <button
              onClick={editAlmoco}
              title="دوس عشان تعدّل ALMOCO"
              className="print-hide rounded-lg bg-page px-3 py-2 text-right hover:bg-mist"
            >
              <p className="text-xs text-out">ALMOCO ✎</p>

              <p className="tabular font-semibold text-in">
                {money(summary.almoco)}
              </p>
            </button>
          )}

          <div
            className={`rounded-lg bg-page px-3 py-2 ${
              onUpdateWorker ? "hidden print:block" : ""
            }`}
          >
            <p className="text-xs text-out">ALMOCO</p>

            <p className="tabular font-semibold text-in">
              {money(summary.almoco)}
            </p>
          </div>
        </div>

        {/* Basic salary earned (شامل ALMOCO حسب الحضور) */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm">
          <span className="font-semibold text-steel">
            المستحق (أساسي {summary.almoco > 0 ? "+ أكل" : ""})
          </span>

          <span className="tabular font-bold text-steel">
            {money(summary.gross)}
          </span>
        </div>

        {summary.almoco > 0 && (
          <p className="mt-1 text-[11px] text-out">
            اليومية شاملة بدل الأكل ({money(summary.almoco)} شهريًا) موزّع
            على أيام الحضور
          </p>
        )}

        {/* Attendance / تصحيح الغياب — أداة تعديل، مش هتظهر في الطباعة */}
        {(onAddAttendance || attendance.length > 0) && (
          <div className="print-hide mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-out">
                أيام الحضور المسجلة ({attendance.length})
              </h3>

              {onAddAttendance && (
                <button
                  onClick={addAttendancePrompt}
                  className="print-hide text-[11px] font-semibold text-in hover:underline"
                >
                  + تسجيل يوم حضور
                </button>
              )}
            </div>

            {attendance.length > 0 ? (
              <ul className="mt-1 max-h-40 divide-y divide-line overflow-y-auto print:max-h-none print:overflow-visible">
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
                        className="print-hide text-xs text-out hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-out">مفيش أيام حضور مسجلة</p>
            )}

            {onAddAttendance && (
              <p className="print-hide mt-1 text-[10px] text-out">
                لو عامل نسي يسجل حضوره، سجله هنا عشان يتحسب في مرتبه بدل
                ما يتحسب غياب
              </p>
            )}
          </div>
        )}

        {/* Deductions */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-out">الخصومات</h3>

            {onAddDeduction && (
              <button
                onClick={addDeductionPrompt}
                className="print-hide text-[11px] font-semibold text-in hover:underline"
              >
                + إضافة خصم
              </button>
            )}
          </div>

          {deductions.length > 0 ? (
            <ul className="mt-1 divide-y divide-line">
              {deductions.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-2 py-1.5 text-sm"
                >
                  <span className="text-ink-soft">
                    {formatDateLong(d.dateKey)}
                    {d.reason ? ` — ${d.reason}` : ""}
                  </span>

                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular font-semibold text-red-600">
                      -{money(d.amount)}
                    </span>

                    {onRemoveDeduction && (
                      <button
                        onClick={() => removeDeductionConfirm(d)}
                        title="شيل الخصم ده"
                        className="print-hide text-xs text-out hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-out">مفيش خصومات الشهر ده</p>
          )}
        </div>

        {/* Expenses */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-out">
              المصروفات / السلف
            </h3>

            {onAddExpense && (
              <button
                onClick={addExpensePrompt}
                className="print-hide text-[11px] font-semibold text-in hover:underline"
              >
                + إضافة سلفة
              </button>
            )}
          </div>

          {expenses.length > 0 ? (
            <ul className="mt-1 divide-y divide-line">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-2 py-1.5 text-sm"
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
                        className="print-hide text-xs text-out hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-out">مفيش مصروفات الشهر ده</p>
          )}
        </div>

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
          <span className="text-sm font-bold text-ink">الصافي المستحق</span>

          <span className="tabular text-xl font-black text-ink">
            {money(summary.net)}
          </span>
        </div>

        {/* Remaining debt / سلفة (بيتقسم على شهور) */}
        {Number(summary.debtBalance || 0) > 0 ? (
          <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-rose-700">
                لسه باقي عليه من السلفة
              </span>

              <span className="tabular text-lg font-black text-rose-700">
                {money(summary.debtBalance)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-rose-200 pt-2">
              <span className="text-xs font-bold text-ink">
                الصافي بعد خصم السلفة
              </span>

              <span
                className={`tabular text-base font-black ${
                  summary.net - summary.debtBalance < 0
                    ? "text-red-600"
                    : "text-ink"
                }`}
              >
                {money(summary.net - summary.debtBalance)}
              </span>
            </div>

            {onUpdateWorker && (
              <div className="print-hide mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                <button
                  onClick={repayFromSalary}
                  className="text-rose-700 hover:underline"
                >
                  سداد من المرتب
                </button>

                <button
                  onClick={editDebtBalance}
                  className="text-rose-500 hover:underline"
                >
                  تصحيح الرصيد
                </button>

                <button
                  onClick={addNewDebt}
                  className="text-out hover:text-ink hover:underline"
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
              className="print-hide mt-2 text-[11px] font-medium text-out hover:text-ink hover:underline"
            >
              + تسجيل سلفة كبيرة (هتتقسم على شهور)
            </button>
          )
        )}

        <p className="mt-4 text-center text-[10px] text-out">
          تم إصدار الكشف بتاريخ {formatDateLong(todayKey())}
        </p>
      </div>
    </div>,
    document.body,
  );
}