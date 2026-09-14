import { useMemo, useState } from "react";
import { formatMonthLabel, formatDateLong, todayKey } from "../lib/format";

function money(n) {
  return `${(n || 0).toLocaleString("en-US")} Kz`;
}

export default function LogsView({
  deductions,
  expenses,
  onRemoveDeduction,
  onUpdateDeduction,
  onRemoveExpense,
  onUpdateExpense,
}) {
  const [view, setView] = useState("deduction");
  const [selectedMonth, setSelectedMonth] = useState(todayKey().slice(0, 7));

  const monthKeys = useMemo(() => {
    const set = new Set(
      [
        ...deductions.map((d) => d.dateKey?.slice(0, 7)),
        ...expenses.map((e) => e.dateKey?.slice(0, 7)),
      ].filter(Boolean)
    );
    set.add(todayKey().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [deductions, expenses]);

  const filteredDeductions = useMemo(
    () =>
      deductions
        .filter((d) => d.dateKey?.startsWith(selectedMonth))
        .slice()
        .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)),
    [deductions, selectedMonth]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.dateKey?.startsWith(selectedMonth))
        .slice()
        .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)),
    [expenses, selectedMonth]
  );

  const deductionsTotal = filteredDeductions.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const expensesTotal = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // ---- deduction row editing ----
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  function startEdit(d) {
    setEditingId(d.id);
    setEditAmount(d.amount);
  }

  function saveEdit(d) {
    const num = Number(editAmount);
    if (!Number.isNaN(num) && num !== Number(d.amount) && onUpdateDeduction) {
      onUpdateDeduction(d.id, { amount: num });
    }
    setEditingId(null);
  }

  // ---- expense row editing ----
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseAmount, setEditExpenseAmount] = useState("");

  function startEditExpense(item) {
    setEditingExpenseId(item.id);
    setEditExpenseAmount(item.amount);
  }

  function saveEditExpense(item) {
    const num = Number(editExpenseAmount);
    if (!Number.isNaN(num) && num !== Number(item.amount) && onUpdateExpense) {
      onUpdateExpense(item.id, { amount: num });
    }
    setEditingExpenseId(null);
  }

  const activeList = view === "deduction" ? filteredDeductions : filteredExpenses;
  const amountColor = view === "deduction" ? "text-rose-600" : "text-orange-600";
  const bgColor = view === "deduction" ? "bg-rose-50" : "bg-orange-50";

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* الرأس */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink sm:text-base">📋 السجلات</h3>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-xl border border-line/60 bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:px-4 sm:py-2.5"
        >
          {monthKeys.map((m) => (
            <option key={m} value={m}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>
      </div>

      {/* أزرار تبديل العرض */}
      <div className="flex w-full rounded-2xl border border-line/60 bg-white/80 p-1 shadow-sm sm:w-fit">
        <button
          onClick={() => setView("deduction")}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm ${
            view === "deduction"
              ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-md shadow-ink/20"
              : "text-out hover:text-ink hover:bg-mist/50"
          }`}
        >
          📉 الخصومات
        </button>
        <button
          onClick={() => setView("expense")}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-5 sm:py-2.5 sm:text-sm ${
            view === "expense"
              ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-md shadow-ink/20"
              : "text-out hover:text-ink hover:bg-mist/50"
          }`}
        >
          💳 المصروفات
        </button>
      </div>

      {/* إجمالي الشهر */}
      <div className={`rounded-2xl border border-line/60 ${bgColor}/30 p-4 shadow-sm sm:p-5`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-out/80 sm:text-sm">
            {view === "deduction" ? "إجمالي خصومات الشهر" : "إجمالي مصروفات الشهر"}
          </p>
          <span className="text-2xl opacity-30">
            {view === "deduction" ? "📉" : "💳"}
          </span>
        </div>
        <p className={`tabular mt-1 text-2xl font-black ${amountColor} sm:text-3xl`}>
          {money(view === "deduction" ? deductionsTotal : expensesTotal)}
        </p>
      </div>

      {/* قائمة العناصر */}
      {activeList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/60 bg-white/60 py-12 text-center text-sm text-out/70 sm:py-16">
          <span className="block text-4xl mb-3">📭</span>
          {view === "deduction" ? "مفيش خصومات في الشهر ده" : "مفيش مصروفات في الشهر ده"}
        </div>
      ) : (
        <div className="rounded-2xl border border-line/60 bg-white shadow-sm">
          <div className="border-b border-line/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-out">
                {view === "deduction" ? "الخصومات" : "المصروفات"} ({activeList.length})
              </span>
              <span className="text-xs font-medium text-out">المبلغ</span>
            </div>
          </div>

          <ul className="divide-y divide-line/60">
            {activeList.map((item) => {
              const isDeduction = view === "deduction";
              const isEditing = isDeduction 
                ? editingId === item.id 
                : editingExpenseId === item.id;
              const currentAmount = isDeduction ? editAmount : editExpenseAmount;
              const setAmount = isDeduction ? setEditAmount : setEditExpenseAmount;
              const saveFn = isDeduction ? saveEdit : saveEditExpense;
              const cancelFn = isDeduction 
                ? () => setEditingId(null) 
                : () => setEditingExpenseId(null);
              const startEditFn = isDeduction ? startEdit : startEditExpense;
              const updateFn = isDeduction ? onUpdateDeduction : onUpdateExpense;
              const removeFn = isDeduction ? onRemoveDeduction : onRemoveExpense;
              const colorClass = isDeduction ? "text-rose-600" : "text-orange-600";
              const bgClass = isDeduction ? "bg-rose-50" : "bg-orange-50";

              return (
                <li key={item.id} className="flex flex-col gap-2 px-4 py-3 transition hover:bg-mist/20 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-3.5">
                  {/* معلومات العنصر */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink sm:text-base">
                      {item.workerName}
                      <span className="mr-2 text-xs font-normal text-out/70">
                        — {formatDateLong(item.dateKey)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-out/70">
                      {item.reason && <span>{item.reason}</span>}
                      {item.reason && item.siteName && <span className="mx-1">·</span>}
                      {item.siteName && (
                        <span className="font-medium text-steel">🏗️ {item.siteName}</span>
                      )}
                    </p>
                  </div>

                  {/* المبلغ والأزرار */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          autoFocus
                          type="number"
                          value={currentAmount}
                          onChange={(e) => setAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveFn(item);
                            if (e.key === "Escape") cancelFn();
                          }}
                          className={`w-24 rounded-lg border ${colorClass}/40 bg-white px-2 py-1.5 text-sm text-ink outline-none transition focus:border-${isDeduction ? 'rose' : 'orange'}-400 focus:ring-2 focus:ring-${isDeduction ? 'rose' : 'orange'}-400/20`}
                        />
                        <button
                          onClick={() => saveFn(item)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={cancelFn}
                          className="rounded-lg border border-line/60 px-3 py-1.5 text-xs font-semibold text-out transition hover:bg-page"
                        >
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditFn(item)}
                          disabled={!updateFn}
                          title="دوس تعدل المبلغ"
                          className={`tabular rounded-lg ${bgClass} px-3 py-1.5 text-sm font-bold ${colorClass} transition hover:bg-opacity-70 disabled:opacity-50 sm:text-base`}
                        >
                          -{money(item.amount)}
                        </button>
                        {removeFn && (
                          <button
                            onClick={() => {
                              if (window.confirm(`متأكد إنك عايز تمسح ${view === "deduction" ? 'الخصم' : 'المصروف'} ده؟`)) {
                                removeFn(item.id);
                              }
                            }}
                            className="rounded-lg border border-line/60 px-2.5 py-1.5 text-xs font-medium text-out transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          >
                            حذف
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}