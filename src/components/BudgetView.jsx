import { useMemo, useState } from "react";
import { formatMonthLabel, formatDateLong, todayKey } from "../lib/format";

function money(n) {
  return `${(n || 0).toLocaleString("en-US")} Kz`;
}

const DEFAULT_CATEGORIES = {
  income: ["مبيعات", "دخل آخر"],
  expense: [
    "مرتبات",
    "خامات",
    "إيجار",
    "كهرباء ومياه",
    "نقل ومواصلات",
    "صيانة",
    "مصاريف إدارية",
    "أخرى",
  ],
};

export default function BudgetView({
  entries = [],
  plans = [],
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
  onSavePlan,
}) {
  const currentMonth = todayKey().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // ---- نموذج إضافة عنصر ----
  const [formType, setFormType] = useState("expense");
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES.expense[0]);
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(todayKey());
  const [formNote, setFormNote] = useState("");

  const monthKeys = useMemo(() => {
    const set = new Set([
      ...entries.map((e) => e.monthKey),
      ...plans.map((p) => p.monthKey),
      currentMonth,
    ]);
    return Array.from(set)
      .filter(Boolean)
      .sort()
      .reverse();
  }, [entries, plans, currentMonth]);

  const monthEntries = useMemo(
    () => entries.filter((e) => e.monthKey === selectedMonth),
    [entries, selectedMonth]
  );
  const monthPlans = useMemo(
    () => plans.filter((p) => p.monthKey === selectedMonth),
    [plans, selectedMonth]
  );

  const totalIncome = monthEntries
    .filter((e) => e.type === "income")
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalExpense = monthEntries
    .filter((e) => e.type === "expense")
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const net = totalIncome - totalExpense;

  // كل الفئات المعروفة لكل نوع (الافتراضية + أي فئة مخصصة اتضافت قبل كده)
  const categoriesForType = useMemo(() => {
    const result = { income: new Set(DEFAULT_CATEGORIES.income), expense: new Set(DEFAULT_CATEGORIES.expense) };
    for (const e of entries) {
      if (e.category) result[e.type]?.add(e.category);
    }
    for (const p of plans) {
      if (p.category) result[p.type]?.add(p.category);
    }
    return { income: Array.from(result.income), expense: Array.from(result.expense) };
  }, [entries, plans]);

  function actualFor(type, category) {
    return monthEntries
      .filter((e) => e.type === type && e.category === category)
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }

  function plannedFor(type, category) {
    const p = monthPlans.find((p) => p.type === type && p.category === category);
    return p ? Number(p.plannedAmount) || 0 : 0;
  }

  function handleAddEntry(e) {
    e.preventDefault();
    const amountNum = Number(formAmount);
    if (!amountNum || amountNum <= 0) return;
    const dateKey = formDate || todayKey();
    const monthKey = dateKey.slice(0, 7);
    onAddEntry?.({
      monthKey,
      type: formType,
      category: (formCategory || "أخرى").trim(),
      amount: amountNum,
      note: formNote.trim(),
      dateKey,
    });
    setFormAmount("");
    setFormNote("");
    setSelectedMonth(monthKey);
  }

  // ---- تعديل عنصر موجود (البند/المبلغ/التاريخ/الملاحظة) ----
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  function startEdit(item) {
    setEditingId(item.id);
    setEditDraft({
      category: item.category,
      amount: item.amount,
      dateKey: item.dateKey,
      note: item.note || "",
    });
  }
  function saveEdit(item) {
    const num = Number(editDraft.amount);
    if (!editDraft.category?.trim() || Number.isNaN(num) || num <= 0 || !editDraft.dateKey) {
      return;
    }
    onUpdateEntry?.(item.id, {
      category: editDraft.category.trim(),
      amount: num,
      dateKey: editDraft.dateKey,
      monthKey: editDraft.dateKey.slice(0, 7),
      note: editDraft.note.trim(),
    });
    setEditingId(null);
    setEditDraft(null);
  }

  // ---- تعديل الخطة (المبلغ المخصص) لكل بند ----
  const [planDrafts, setPlanDrafts] = useState({});
  function planKey(type, category) {
    return `${type}__${category}`;
  }
  function getPlanDraft(type, category) {
    const key = planKey(type, category);
    if (key in planDrafts) return planDrafts[key];
    const val = plannedFor(type, category);
    return val ? String(val) : "";
  }
  function savePlanDraft(type, category) {
    const key = planKey(type, category);
    const raw = planDrafts[key];
    if (raw === undefined) return;
    const num = Number(raw) || 0;
    onSavePlan?.({ monthKey: selectedMonth, type, category, plannedAmount: num });
    setPlanDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const sortedEntries = useMemo(
    () => monthEntries.slice().sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)),
    [monthEntries]
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* الرأس + اختيار الشهر */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink sm:text-base">💰 ميزانية الشركة</h3>
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

      {/* كروت الملخص */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-line/60 bg-emerald-50/50 p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium text-emerald-800/80 sm:text-sm">إجمالي الدخل</p>
          <p className="tabular mt-1 text-2xl font-black text-emerald-700 sm:text-3xl">
            {money(totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-line/60 bg-rose-50/50 p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium text-rose-800/80 sm:text-sm">إجمالي المصروف</p>
          <p className="tabular mt-1 text-2xl font-black text-rose-700 sm:text-3xl">
            {money(totalExpense)}
          </p>
        </div>
        <div
          className={`rounded-2xl border border-line/60 p-4 shadow-sm sm:p-5 ${
            net >= 0 ? "bg-mist/50" : "bg-amber-50/60"
          }`}
        >
          <p className="text-xs font-medium text-out/80 sm:text-sm">الصافي (دخل - مصروف)</p>
          <p
            className={`tabular mt-1 text-2xl font-black sm:text-3xl ${
              net >= 0 ? "text-steel" : "text-amber-700"
            }`}
          >
            {money(net)}
          </p>
        </div>
      </div>

      {/* نموذج إضافة دخل/مصروف */}
      <form
        onSubmit={handleAddEntry}
        className="flex flex-col gap-3 rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:p-5"
      >
        <p className="text-xs font-bold text-out sm:text-sm">➕ إضافة دخل أو مصروف</p>

        <div className="flex w-full rounded-2xl border border-line/60 bg-page p-1 sm:w-fit">
          <button
            type="button"
            onClick={() => {
              setFormType("income");
              setFormCategory(DEFAULT_CATEGORIES.income[0]);
            }}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
              formType === "income"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-out hover:text-ink"
            }`}
          >
            💵 دخل
          </button>
          <button
            type="button"
            onClick={() => {
              setFormType("expense");
              setFormCategory(DEFAULT_CATEGORIES.expense[0]);
            }}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
              formType === "expense"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-out hover:text-ink"
            }`}
          >
            💸 مصروف
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-out/80">البند</label>
            <input
              list="budget-categories"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              placeholder="اكتب أو اختار بند"
              className="rounded-xl border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
            />
            <datalist id="budget-categories">
              {categoriesForType[formType].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-out/80">المبلغ (Kz)</label>
            <input
              type="number"
              min="0"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0"
              className="rounded-xl border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-out/80">التاريخ</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="rounded-xl border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-out/80">ملاحظة (اختياري)</label>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="تفاصيل..."
              className="rounded-xl border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
            />
          </div>
        </div>

        <button
          type="submit"
          className={`self-start rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition sm:px-6 ${
            formType === "income"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          إضافة
        </button>
      </form>

      {/* خطة الميزانية مقابل الفعلي */}
      {["expense", "income"].map((type) => (
        <div key={type} className="rounded-2xl border border-line/60 bg-white shadow-sm">
          <div className="border-b border-line/60 px-4 py-3">
            <span className="text-xs font-bold text-out sm:text-sm">
              {type === "expense" ? "📉 المصروفات — المخطط مقابل الفعلي" : "💵 الدخل — المخطط مقابل الفعلي"}
            </span>
          </div>
          <ul className="divide-y divide-line/60">
            {categoriesForType[type].map((category) => {
              const planned = plannedFor(type, category);
              const actual = actualFor(type, category);
              const pct = planned > 0 ? Math.min(150, Math.round((actual / planned) * 100)) : 0;
              const isOver = type === "expense" ? actual > planned && planned > 0 : actual < planned;
              const barColor =
                type === "expense"
                  ? actual > planned && planned > 0
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                  : actual >= planned && planned > 0
                  ? "bg-emerald-500"
                  : "bg-amber-500";
              const diff = type === "expense" ? planned - actual : actual - planned;

              return (
                <li key={category} className="flex flex-col gap-2 px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{category}</span>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className="text-out/70">فعلي:</span>
                      <span className={`tabular font-bold ${type === "expense" ? "text-rose-600" : "text-emerald-600"}`}>
                        {money(actual)}
                      </span>
                      <span className="text-out/40">/</span>
                      <span className="text-out/70">مخطط:</span>
                      <input
                        type="number"
                        min="0"
                        value={getPlanDraft(type, category)}
                        onChange={(e) =>
                          setPlanDrafts((prev) => ({ ...prev, [planKey(type, category)]: e.target.value }))
                        }
                        onBlur={() => savePlanDraft(type, category)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        placeholder="0"
                        className="tabular w-24 rounded-lg border border-line/60 bg-page px-2 py-1 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
                      />
                    </div>
                  </div>

                  {planned > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-page">
                        <div
                          className={`h-full ${barColor} transition-all`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold ${isOver ? "text-rose-600" : "text-out/70"}`}>
                        {type === "expense"
                          ? diff >= 0
                            ? `متبقي ${money(diff)}`
                            : `تجاوز ${money(Math.abs(diff))}`
                          : diff >= 0
                          ? `تحقق زيادة ${money(diff)}`
                          : `ناقص ${money(Math.abs(diff))}`}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* قائمة الحركات */}
      {sortedEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/60 bg-white/60 py-12 text-center text-sm text-out/70 sm:py-16">
          <span className="block text-4xl mb-3">📭</span>
          مفيش أي حركات مسجلة في الشهر ده
        </div>
      ) : (
        <div className="rounded-2xl border border-line/60 bg-white shadow-sm">
          <div className="border-b border-line/60 px-4 py-3">
            <span className="text-xs font-medium text-out">الحركات ({sortedEntries.length})</span>
          </div>
          <ul className="divide-y divide-line/60">
            {sortedEntries.map((item) => {
              const isIncome = item.type === "income";
              const isEditing = editingId === item.id;
              const colorClass = isIncome ? "text-emerald-600" : "text-rose-600";
              const bgClass = isIncome ? "bg-emerald-50" : "bg-rose-50";

              if (isEditing) {
                return (
                  <li key={item.id} className="flex flex-col gap-3 bg-mist/20 px-4 py-3 sm:px-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-out/80">البند</label>
                        <input
                          list="budget-categories"
                          value={editDraft.category}
                          onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}
                          className="rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-out/80">المبلغ (Kz)</label>
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          value={editDraft.amount}
                          onChange={(e) => setEditDraft((d) => ({ ...d, amount: e.target.value }))}
                          className="rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-out/80">التاريخ</label>
                        <input
                          type="date"
                          value={editDraft.dateKey}
                          onChange={(e) => setEditDraft((d) => ({ ...d, dateKey: e.target.value }))}
                          className="rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-out/80">ملاحظة</label>
                        <input
                          type="text"
                          value={editDraft.note}
                          onChange={(e) => setEditDraft((d) => ({ ...d, note: e.target.value }))}
                          className="rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(item)}
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        حفظ التعديل
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft(null);
                        }}
                        className="rounded-lg border border-line/60 px-4 py-1.5 text-xs font-semibold text-out transition hover:bg-page"
                      >
                        إلغاء
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 px-4 py-3 transition hover:bg-mist/20 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink sm:text-base">
                      {item.category}
                      <span className="mr-2 text-xs font-normal text-out/70">
                        — {formatDateLong(item.dateKey)}
                      </span>
                    </p>
                    {item.note && <p className="mt-0.5 text-xs text-out/70">{item.note}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`tabular rounded-lg ${bgClass} px-3 py-1.5 text-sm font-bold ${colorClass} sm:text-base`}>
                      {isIncome ? "+" : "-"}
                      {money(item.amount)}
                    </span>
                    {onUpdateEntry && (
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-line/60 px-2.5 py-1.5 text-xs font-medium text-out transition hover:border-steel/40 hover:bg-mist hover:text-steel"
                      >
                        ✏️ تعديل
                      </button>
                    )}
                    {onRemoveEntry && (
                      <button
                        onClick={() => {
                          if (window.confirm("متأكد إنك عايز تمسح الحركة دي؟")) {
                            onRemoveEntry(item.id);
                          }
                        }}
                        className="rounded-lg border border-line/60 px-2.5 py-1.5 text-xs font-medium text-out transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                      >
                        🗑️ حذف
                      </button>
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