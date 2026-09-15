import { useMemo, useState } from "react";
import { formatDateLong, todayKey } from "../lib/format";

function usd(n) {
  return `$${(n || 0).toLocaleString("en-US")}`;
}

// دائن (+ بيزود المستحق للعامل) أو مدين (- بيقلل المستحق، لأنه فلوس اتدت له فعليًا)
const TYPES = {
  wage: { label: "مرتب مستحق", icon: "📄", sign: 1, color: "text-steel", bg: "bg-mist/60" },
  salary: { label: "استلم مرتب", icon: "💰", sign: -1, color: "text-violet-700", bg: "bg-violet-50" },
  advance: { label: "سلفة", icon: "🤝", sign: -1, color: "text-amber-700", bg: "bg-amber-50" },
  food: { label: "أكل", icon: "🍽️", sign: -1, color: "text-emerald-700", bg: "bg-emerald-50" },
};

export default function ForeignWorkersView({
  workers = [],
  entries = [],
  onAddWorker,
  onRemoveWorker,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
}) {
  const [newName, setNewName] = useState("");
  const [openWorkerId, setOpenWorkerId] = useState(null);

  function handleAddWorker(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onAddWorker?.({ name });
    setNewName("");
  }

  // بترتب كل عامل تصاعديًا بالتاريخ (الأقدم الأول) عشان نحسب "الرصيد بعد كل حركة"
  // صح زي كشف حساب حقيقي، وبعدين نعكس الترتيب وقت العرض (الأحدث فوق).
  const ledgerByWorker = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!map[e.workerId]) map[e.workerId] = [];
      map[e.workerId].push(e);
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => {
        if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });
      let running = 0;
      map[id] = map[id].map((e) => {
        const cfg = TYPES[e.type] || TYPES.wage;
        running += cfg.sign * (Number(e.amount) || 0);
        return { ...e, balanceAfter: running };
      });
    }
    return map;
  }, [entries]);

  function balanceFor(workerId) {
    const list = ledgerByWorker[workerId] || [];
    return list.length ? list[list.length - 1].balanceAfter : 0;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink sm:text-base">🌍 العمال الأجانب</h3>
        <span className="rounded-full bg-mist/80 px-2.5 py-0.5 text-xs font-bold text-steel">
          {workers.length}
        </span>
      </div>

      {/* إضافة عامل جديد */}
      <form
        onSubmit={handleAddWorker}
        className="flex flex-col gap-2 rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="اسم العامل الأجنبي الجديد"
          className="flex-1 rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
        />
        <button
          type="submit"
          className="rounded-xl bg-linear-to-r from-ink to-gray-800 px-6 py-2.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20"
        >
          إضافة
        </button>
      </form>

      {workers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/60 bg-white/60 py-12 text-center text-sm text-out/70 sm:py-16">
          <span className="mb-3 block text-4xl">🌍</span>
          لسه مفيش عمال أجانب مضافين
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {workers.map((w) => {
            const balance = balanceFor(w.id);
            const isOpen = openWorkerId === w.id;
            return (
              <li key={w.id} className="rounded-2xl border border-line/60 bg-white shadow-sm">
                <button
                  onClick={() => setOpenWorkerId(isOpen ? null : w.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-right sm:px-5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span className="text-base font-bold text-ink sm:text-lg">{w.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span
                      title="الرصيد الحالي = كل المستحقات - كل اللي اتدفع/اتخصم لحد دلوقتي"
                      className={`tabular rounded-full px-3 py-1 font-bold ${
                        balance > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : balance < 0
                          ? "bg-rose-100 text-rose-800"
                          : "bg-mist/60 text-out"
                      }`}
                    >
                      ⚖️ {usd(Math.abs(balance))} {balance > 0 ? "له" : balance < 0 ? "عليه" : "متزنّ"}
                    </span>
                    <svg
                      className={`h-4 w-4 text-out/60 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <ForeignWorkerLedger
                    worker={w}
                    ledger={ledgerByWorker[w.id] || []}
                    balance={balance}
                    onAddEntry={onAddEntry}
                    onUpdateEntry={onUpdateEntry}
                    onRemoveEntry={onRemoveEntry}
                    onRemoveWorker={onRemoveWorker}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ForeignWorkerLedger({ worker, ledger, balance, onAddEntry, onUpdateEntry, onRemoveEntry, onRemoveWorker }) {
  const [type, setType] = useState("wage");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return;
    onAddEntry?.({
      workerId: worker.id,
      workerName: worker.name,
      type,
      amount: num,
      note: note.trim(),
      dateKey: date || todayKey(),
    });
    setAmount("");
    setNote("");
  }

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  function startEdit(item) {
    setEditingId(item.id);
    setEditDraft({ type: item.type, amount: item.amount, dateKey: item.dateKey, note: item.note || "" });
  }
  function saveEdit(item) {
    const num = Number(editDraft.amount);
    if (Number.isNaN(num) || num <= 0 || !editDraft.dateKey) return;
    onUpdateEntry?.(item.id, {
      type: editDraft.type,
      amount: num,
      dateKey: editDraft.dateKey,
      note: editDraft.note.trim(),
    });
    setEditingId(null);
    setEditDraft(null);
  }

  // الأحدث فوق للعرض، بس الرصيد المحسوب لكل صف جاي من الترتيب الزمني الصحيح
  const displayList = ledger.slice().reverse();

  return (
    <div className="border-t border-line/60 px-4 py-4 sm:px-5">
      {/* ملخص الرصيد */}
      <div
        className={`mb-3 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold ${
          balance > 0
            ? "bg-emerald-50 text-emerald-800"
            : balance < 0
            ? "bg-rose-50 text-rose-800"
            : "bg-mist/40 text-out"
        }`}
      >
        <span>⚖️ الرصيد الحالي</span>
        <span className="tabular text-base">
          {usd(Math.abs(balance))} {balance > 0 ? "له" : balance < 0 ? "عليه" : ""}
        </span>
      </div>

      {/* فورم إضافة حركة */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl bg-page/60 p-3 sm:p-4">
        <p className="text-xs font-bold text-out">➕ إضافة حركة جديدة</p>
        <div className="flex w-full flex-wrap rounded-xl border border-line/60 bg-white p-1 sm:w-fit sm:flex-nowrap">
          {Object.entries(TYPES).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:flex-none sm:px-4 ${
                type === key ? "bg-ink text-white shadow-sm" : "text-out hover:text-ink"
              }`}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-out/60">
          {TYPES[type].sign > 0
            ? "دي حركة \"دائن\" — بتزود المستحق للعامل (مرتب استحق ولسه ماخدوش)"
            : "دي حركة \"مدين\" — بتقلل من المستحق (فلوس/أكل اتدت له فعليًا)"}
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="المبلغ ($)"
            className="rounded-lg border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظة (اختياري)"
            className="rounded-lg border border-line/60 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
          >
            إضافة
          </button>
        </div>
      </form>

      {/* كشف الحساب (ديبت / كريديت / الرصيد) */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-line/60 bg-white">
        {displayList.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-out/70">مفيش أي حركات مسجلة لسه</p>
        ) : (
          <table className="w-full min-w-[560px] text-right text-xs sm:text-sm">
            <thead className="bg-mist/50">
              <tr>
                <th className="px-3 py-2.5 font-semibold text-steel">التاريخ</th>
                <th className="px-3 py-2.5 font-semibold text-steel">البيان</th>
                <th className="px-3 py-2.5 font-semibold text-steel">مدين (عليه)</th>
                <th className="px-3 py-2.5 font-semibold text-steel">دائن (له)</th>
                <th className="px-3 py-2.5 font-semibold text-steel">الرصيد</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {displayList.map((item) => {
                const cfg = TYPES[item.type] || TYPES.wage;
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-mist/20">
                      <td colSpan={6} className="px-3 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                            <select
                              value={editDraft.type}
                              onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value }))}
                              className="rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none"
                            >
                              {Object.entries(TYPES).map(([key, c]) => (
                                <option key={key} value={key}>
                                  {c.icon} {c.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={editDraft.amount}
                              onChange={(e) => setEditDraft((d) => ({ ...d, amount: e.target.value }))}
                              className="rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none"
                            />
                            <input
                              type="date"
                              value={editDraft.dateKey}
                              onChange={(e) => setEditDraft((d) => ({ ...d, dateKey: e.target.value }))}
                              className="rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none"
                            />
                            <input
                              type="text"
                              value={editDraft.note}
                              onChange={(e) => setEditDraft((d) => ({ ...d, note: e.target.value }))}
                              className="rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(item)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditDraft(null);
                              }}
                              className="rounded-lg border border-line/60 px-3 py-1.5 text-xs font-semibold text-out hover:bg-page"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="transition hover:bg-mist/10">
                    <td className="px-3 py-2.5 text-out/80">{formatDateLong(item.dateKey)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full ${cfg.bg} px-2 py-1 text-[11px] font-bold ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {item.note && <span className="mr-1.5 text-[11px] text-out/60">{item.note}</span>}
                    </td>
                    <td className="tabular px-3 py-2.5 font-semibold text-rose-600">
                      {cfg.sign < 0 ? usd(item.amount) : "—"}
                    </td>
                    <td className="tabular px-3 py-2.5 font-semibold text-emerald-600">
                      {cfg.sign > 0 ? usd(item.amount) : "—"}
                    </td>
                    <td
                      className={`tabular px-3 py-2.5 font-bold ${
                        item.balanceAfter > 0
                          ? "text-emerald-700"
                          : item.balanceAfter < 0
                          ? "text-rose-700"
                          : "text-out"
                      }`}
                    >
                      {usd(Math.abs(item.balanceAfter))}{" "}
                      {item.balanceAfter > 0 ? "له" : item.balanceAfter < 0 ? "عليه" : ""}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {onUpdateEntry && (
                          <button
                            onClick={() => startEdit(item)}
                            className="rounded-lg border border-line/60 px-2 py-1 text-[11px] font-medium text-out transition hover:border-steel/40 hover:bg-mist hover:text-steel"
                          >
                            ✏️
                          </button>
                        )}
                        {onRemoveEntry && (
                          <button
                            onClick={() => {
                              if (window.confirm("متأكد إنك عايز تمسح الحركة دي؟")) onRemoveEntry(item.id);
                            }}
                            className="rounded-lg border border-line/60 px-2 py-1 text-[11px] font-medium text-out transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {onRemoveWorker && (
        <button
          onClick={() => {
            if (
              window.confirm(
                `متأكد إنك عايز تمسح "${worker.name}" نهائي؟ هيتمسح معاه كل كشف الحساب بتاعه.`
              )
            ) {
              onRemoveWorker(worker.id);
            }
          }}
          className="mt-3 text-xs font-medium text-rose-500/80 transition hover:text-rose-600 hover:underline"
        >
          🗑️ حذف العامل ده نهائيًا
        </button>
      )}
    </div>
  );
}