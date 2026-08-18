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
  const [view, setView] = useState("deduction"); // "deduction" | "expense"

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

  const [selectedMonth, setSelectedMonth] = useState(todayKey().slice(0, 7));

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
  const amountColor = view === "deduction" ? "text-red-600" : "text-orange-600";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">السجلات</h3>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-steel"
        >
          {monthKeys.map((m) => (
            <option key={m} value={m}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle */}
      <div className="flex w-fit rounded-lg border border-line bg-white p-1">
        <button
          onClick={() => setView("deduction")}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            view === "deduction" ? "bg-ink text-white" : "text-out hover:text-ink"
          }`}
        >
          سجل الخصومات
        </button>
        <button
          onClick={() => setView("expense")}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            view === "expense" ? "bg-ink text-white" : "text-out hover:text-ink"
          }`}
        >
          سجل المصروفات
        </button>
      </div>

      {/* Total for the selected view */}
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="text-xs text-out">
          {view === "deduction" ? "إجمالي خصومات الشهر ده" : "إجمالي مصروفات الشهر ده"}
        </p>
        <p className={`tabular mt-1 text-xl font-black ${amountColor}`}>
          {money(view === "deduction" ? deductionsTotal : expensesTotal)}
        </p>
      </div>

      {activeList.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-white/60 py-10 text-center text-sm text-out">
          {view === "deduction" ? "مفيش خصومات في الشهر ده" : "مفيش مصروفات في الشهر ده"}
        </div>
      )}

      {view === "deduction" && filteredDeductions.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-4">
          <ul className="flex flex-col divide-y divide-line">
            {filteredDeductions.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-ink">
                    {d.workerName} <span className="text-out">— {formatDateLong(d.dateKey)}</span>
                  </p>
                  <p className="text-xs text-out">
                    {d.reason && <span>{d.reason}</span>}
                    {d.reason && d.siteName && <span> · </span>}
                    {d.siteName && (
                      <span className="font-semibold text-steel">سجّله: {d.siteName}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === d.id ? (
                    <>
                      <input
                        autoFocus
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(d);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="tabular w-20 rounded-lg border border-steel bg-white px-2 py-1 text-sm text-ink outline-none"
                      />
                      <button
                        onClick={() => saveEdit(d)}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-in hover:bg-page"
                      >
                        حفظ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(d)}
                      disabled={!onUpdateDeduction}
                      title="دوس تعدل المبلغ"
                      className="tabular font-bold text-red-600 hover:underline disabled:no-underline"
                    >
                      -{money(d.amount)}
                    </button>
                  )}
                  {onRemoveDeduction && (
                    <button
                      onClick={() => onRemoveDeduction(d.id)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === "expense" && filteredExpenses.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-4">
          <ul className="flex flex-col divide-y divide-line">
            {filteredExpenses.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-ink">
                    {item.workerName} <span className="text-out">— {formatDateLong(item.dateKey)}</span>
                  </p>
                  <p className="text-xs text-out">
                    {item.reason && <span>{item.reason}</span>}
                    {item.reason && item.siteName && <span> · </span>}
                    {item.siteName && (
                      <span className="font-semibold text-steel">سجّله: {item.siteName}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingExpenseId === item.id ? (
                    <>
                      <input
                        autoFocus
                        type="number"
                        value={editExpenseAmount}
                        onChange={(e) => setEditExpenseAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditExpense(item);
                          if (e.key === "Escape") setEditingExpenseId(null);
                        }}
                        className="tabular w-20 rounded-lg border border-steel bg-white px-2 py-1 text-sm text-ink outline-none"
                      />
                      <button
                        onClick={() => saveEditExpense(item)}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-in hover:bg-page"
                      >
                        حفظ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditExpense(item)}
                      disabled={!onUpdateExpense}
                      title="دوس تعدل المبلغ"
                      className="tabular font-bold text-orange-600 hover:underline disabled:no-underline"
                    >
                      -{money(item.amount)}
                    </button>
                  )}
                  {onRemoveExpense && (
                    <button
                      onClick={() => onRemoveExpense(item.id)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}