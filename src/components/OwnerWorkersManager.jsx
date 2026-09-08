import { useEffect, useMemo, useState } from "react";
import { formatDateShort, todayKey } from "../lib/format";
import { computeAbsenceDays } from "../lib/payroll";

export default function OwnerWorkersManager({
  workers,
  records = [],
  schedule = {},
  onAdd,
  onRemove,
  onPurge,
  onUpdate,
  onAddDeduction,
}) {
  const [name, setName] = useState("");
  const [wage, setWage] = useState("");
  const [almoco, setAlmoco] = useState("");
  const [startDate, setStartDate] = useState(todayKey());

  const [bulkNames, setBulkNames] = useState("");
  const [bulkWage, setBulkWage] = useState("");
  const [bulkAlmoco, setBulkAlmoco] = useState("");
  const [bulkStartDate, setBulkStartDate] = useState(todayKey());

  const currentMonthKey = todayKey().slice(0, 7);

  const absenceByWorker = useMemo(() => {
    const map = {};
    for (const w of workers) {
      map[w.id] = computeAbsenceDays(w, records, schedule, currentMonthKey).absentDays;
    }
    return map;
  }, [workers, records, schedule, currentMonthKey]);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [salaryMode, setSalaryMode] = useState(false);

  const [drafts, setDrafts] = useState({});
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };

      for (const w of workers) {
        if (!(w.id in next)) {
          next[w.id] = {
            wage: w.wage ?? 0,
            almoco: w.almoco ?? 0,
          };
        }
      }

      for (const id of Object.keys(next)) {
        if (!workers.some((w) => w.id === id)) {
          delete next[id];
        }
      }

      return next;
    });
  }, [workers]);

  const dirtyCount = useMemo(
    () =>
      workers.filter((w) => {
        const draft = drafts[w.id];

        if (!draft) return false;

        return (
          Number(draft.wage ?? 0) !== Number(w.wage ?? 0) ||
          Number(draft.almoco ?? 0) !== Number(w.almoco ?? 0)
        );
      }).length,
    [workers, drafts]
  );

  function setDraft(id, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  }

  function saveAllSalaries() {
    let changed = 0;

    for (const w of workers) {
      const draft = drafts[w.id];

      if (!draft) continue;

      const wageNum = Number(draft.wage);
      const almocoNum = Number(draft.almoco);

      if (Number.isNaN(wageNum) || Number.isNaN(almocoNum)) {
        continue;
      }

      const wageChanged = wageNum !== Number(w.wage || 0);
      const almocoChanged = almocoNum !== Number(w.almoco || 0);

      if (wageChanged || almocoChanged) {
        onUpdate(w.id, {
          wage: wageNum,
          almoco: almocoNum,
        });

        changed += 1;
      }
    }

    if (changed > 0) {
      setSavedFlash(true);
      setTimeout(() => {
        setSavedFlash(false);
      }, 2000);
    }
  }

  function resetDrafts() {
    const reset = {};
    for (const w of workers) {
      reset[w.id] = {
        wage: w.wage ?? 0,
        almoco: w.almoco ?? 0,
      };
    }
    setDrafts(reset);
  }

  function submit(e) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    onAdd(cleanName, wage, almoco, startDate || todayKey());
    setName("");
    setWage("");
    setAlmoco("");
    setStartDate(todayKey());
  }

  function submitBulk(e) {
    e.preventDefault();

    const existing = new Set(
      workers.map((w) => w.name.trim().toLowerCase())
    );

    const names = bulkNames
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    let added = 0;
    let skipped = 0;

    for (const n of names) {
      if (existing.has(n.toLowerCase())) {
        skipped += 1;
        continue;
      }

      onAdd(n, bulkWage, bulkAlmoco, bulkStartDate || todayKey());
      existing.add(n.toLowerCase());
      added += 1;
    }

    setBulkNames("");
    setBulkWage("");
    setBulkAlmoco("");
    setBulkStartDate(todayKey());

    alert(
      `اتضاف ${added} عامل${skipped ? ` (اتجاهل ${skipped} كان موجود قبل كده)` : ""}`
    );

    setBulkOpen(false);
  }

  function editWage(worker) {
    const value = window.prompt(
      `المرتب الأساسي الشهري بتاع ${worker.name}؟ (Kz)`,
      worker.wage || 0
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num)) return;

    onUpdate(worker.id, {
      wage: num,
    });
  }

  function editStartDate(worker) {
    const value = window.prompt(
      `تاريخ بدء شغل ${worker.name}؟ (بصيغة YYYY-MM-DD)`,
      worker.startDate || todayKey()
    );

    if (value === null) return;

    const trimmed = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      alert("التاريخ لازم يكون بالصيغة دي: 2026-01-15 مثلاً");
      return;
    }

    onUpdate(worker.id, {
      startDate: trimmed,
    });
  }

  function editAlmoco(worker) {
    const value = window.prompt(
      `قيمة ALMOCO الشهرية بتاع ${worker.name}؟ (Kz)`,
      worker.almoco || 0
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num)) return;

    onUpdate(worker.id, {
      almoco: num,
    });
  }

  function toggleInss(worker) {
    onUpdate(worker.id, {
      hasInss: !worker.hasInss,
    });
  }

  function addNewDebt(worker) {
    const value = window.prompt(
      `قيمة السلفة الجديدة لـ ${worker.name}؟ (Kz)\nهتتضاف على الدين المتبقي وهتفضل معلقة لحد ما تتخصم من مرتبه على شهور.`,
      ""
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num) || num <= 0) {
      alert("اكتب رقم أكبر من صفر");
      return;
    }

    const current = Number(worker.debtBalance || 0);

    onUpdate(worker.id, {
      debtBalance: current + num,
    });
  }

  function repayFromSalary(worker) {
    const current = Number(worker.debtBalance || 0);

    if (current <= 0) {
      alert(`${worker.name} مفيهوش دين متبقي دلوقتي`);
      return;
    }

    const value = window.prompt(
      `${worker.name} عليه ${current.toLocaleString("en-US")} Kz.\nتحب تخصم قد ايه من مرتب الشهر ده؟ (هيظهر كخصم في كشف مرتبه)`,
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
        workerId: worker.id,
        workerName: worker.name,
        dateKey: todayKey(),
        amount: capped,
        reason: "سداد سلفة",
      });
    }

    onUpdate(worker.id, {
      debtBalance: current - capped,
    });
  }

  function editDebtBalance(worker) {
    const value = window.prompt(
      `تصحيح رصيد الدين يدويًا لـ ${worker.name} (Kz)\n(استخدمها بس لو الرقم غلط، عادي متستخدمهاش لأي حاجة تانية)`,
      worker.debtBalance || 0
    );

    if (value === null) return;

    const num = Number(value);

    if (Number.isNaN(num) || num < 0) {
      alert("اكتب رقم صفر أو أكبر");
      return;
    }

    onUpdate(worker.id, {
      debtBalance: num,
    });
  }

  function handlePurge(worker) {
    const ok = window.confirm(
      `متأكد إنك عايز تمسح "${worker.name}" نهائي؟\nهيتمسح هو وكل سجلات حضوره وخصوماته من السجل والتقارير والرواتب، ومفيش رجعة بعد كده.`
    );

    if (!ok) return;

    onPurge(worker.id);
  }

  return (
    <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <span className="text-xl">👷</span>
        <h3 className="text-sm font-bold text-ink sm:text-base">العمال</h3>
        <span className="mr-auto rounded-full bg-mist/80 px-2.5 py-0.5 text-xs font-bold text-steel">
          {workers.length}
        </span>
      </div>

      {/* Add worker form */}
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم العامل *"
          className="min-w-30 flex-1 rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
        />

        <input
          value={wage}
          onChange={(e) => setWage(e.target.value)}
          placeholder="المرتب (Kz)"
          type="number"
          min="0"
          className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:w-40 sm:py-3"
        />

        <input
          value={almoco}
          onChange={(e) => setAlmoco(e.target.value)}
          placeholder="ALMOCO (Kz)"
          type="number"
          min="0"
          className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:w-36 sm:py-3"
        />

        <input
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          title="تاريخ بدء الشغل"
          type="date"
          className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:w-40 sm:py-3"
        />

        <button
          type="submit"
          className="w-full rounded-xl bg-linear-to-r from-ink to-gray-800 px-6 py-2.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 sm:w-auto sm:py-3"
        >
          إضافة
        </button>
      </form>

      {/* Controls */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setBulkOpen((v) => !v)}
          className="text-xs font-semibold text-steel transition hover:text-ink hover:underline"
        >
          {bulkOpen ? "📂 قفل الاستيراد" : "📂 استيراد أسماء دفعة واحدة"}
        </button>

        <span className="text-line/60">•</span>

        <button
          onClick={() => {
            if (!salaryMode) {
              resetDrafts();
            }
            setSalaryMode((v) => !v);
          }}
          className="text-xs font-semibold text-steel transition hover:text-ink hover:underline"
        >
          {salaryMode ? "🔒 قفل التعديل" : "✏️ تعديل المرتبات دفعة واحدة"}
        </button>
      </div>

      {/* Bulk import */}
      {bulkOpen && (
        <form onSubmit={submitBulk} className="mt-3 rounded-2xl border border-line/60 bg-page/50 p-4">
          <textarea
            value={bulkNames}
            onChange={(e) => setBulkNames(e.target.value)}
            rows={6}
            placeholder="ABILIO K SAPALO
ADELINO BERNARDO
ADELINO DA SILVA"
            className="w-full rounded-xl border border-line/60 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
          />

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              value={bulkWage}
              onChange={(e) => setBulkWage(e.target.value)}
              placeholder="المرتب الأساسي (Kz)"
              type="number"
              min="0"
              className="w-full rounded-xl border border-line/60 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
            />

            <input
              value={bulkAlmoco}
              onChange={(e) => setBulkAlmoco(e.target.value)}
              placeholder="ALMOCO (Kz)"
              type="number"
              min="0"
              className="w-full rounded-xl border border-line/60 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
            />

            <input
              value={bulkStartDate}
              onChange={(e) => setBulkStartDate(e.target.value)}
              title="تاريخ بدء الشغل لكل الأسماء دي"
              type="date"
              className="w-full rounded-xl border border-line/60 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
            />
          </div>

          <button
            type="submit"
            className="mt-3 rounded-xl bg-linear-to-r from-ink to-gray-800 px-6 py-2.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20"
          >
            إضافة الأسماء
          </button>
        </form>
      )}

      {/* Salary edit mode */}
      {salaryMode ? (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-line/60">
            <table className="w-full min-w-150 text-right text-xs">
              <thead className="bg-mist/50">
                <tr>
                  <th className="px-3 py-2.5 text-xs font-semibold text-steel">العامل</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-steel">المرتب الأساسي</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-steel">ALMOCO</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-steel">الضمان</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line/60">
                {workers.map((w) => {
                  const draft = drafts[w.id] || {
                    wage: w.wage ?? 0,
                    almoco: w.almoco ?? 0,
                  };

                  return (
                    <tr key={w.id} className="hover:bg-mist/20">
                      <td className="px-3 py-2.5 font-semibold text-ink">{w.name}</td>
                      <td className="px-3 py-2.5">
                        <input
                          value={draft.wage}
                          onChange={(e) => setDraft(w.id, "wage", e.target.value)}
                          type="number"
                          min="0"
                          className="w-32 rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          value={draft.almoco}
                          onChange={(e) => setDraft(w.id, "almoco", e.target.value)}
                          type="number"
                          min="0"
                          className="w-28 rounded-lg border border-line/60 bg-white px-2 py-1.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-out">
                          <input
                            type="checkbox"
                            checked={!!w.hasInss}
                            onChange={() => toggleInss(w)}
                            className="h-4 w-4 rounded border-line/60 text-ink focus:ring-2 focus:ring-steel/20"
                          />
                          3%
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={saveAllSalaries}
              disabled={dirtyCount === 0}
              className="rounded-xl bg-linear-to-r from-ink to-gray-800 px-6 py-2.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-40 disabled:hover:shadow-none"
            >
              حفظ التعديلات {dirtyCount > 0 ? `(${dirtyCount})` : ""}
            </button>

            <button
              onClick={resetDrafts}
              disabled={dirtyCount === 0}
              className="rounded-xl border border-line/60 px-4 py-2.5 text-xs font-semibold text-out transition hover:bg-page disabled:opacity-40"
            >
              إلغاء
            </button>

            {savedFlash && (
              <p className="text-xs font-semibold text-emerald-600">✅ تم الحفظ</p>
            )}
          </div>
        </div>
      ) : (
        /* Normal list */
        <ul className="mt-4 flex flex-col gap-3">
          {workers.length === 0 && (
            <li className="rounded-2xl border border-dashed border-line/60 py-10 text-center text-sm text-out/70">
              <span className="block text-3xl mb-2">👷</span>
              لسه مفيش عمال مضافين
            </li>
          )}

          {workers.map((w) => (
            <li
              key={w.id}
              className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-ink sm:text-lg">{w.name}</p>
                  <button
                    onClick={() => editStartDate(w)}
                    title="تعديل تاريخ بدء الشغل"
                    className="mt-0.5 text-xs text-out/70 transition hover:text-ink hover:underline"
                  >
                    📅 بدأ: {w.startDate ? formatDateShort(w.startDate) : "—"}
                  </button>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-xs font-medium">
                  <button
                    onClick={() => {
                      if (window.confirm(`متأكد إنك عايز تشيل "${w.name}"؟ هيوقف عن الظهور في اليوم، بس سجلاته القديمة هتفضل موجودة.`)) {
                        onRemove(w.id);
                      }
                    }}
                    className="rounded-lg border border-line/60 px-2.5 py-1 text-out transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                  >
                    حذف
                  </button>

                  <button
                    onClick={() => handlePurge(w)}
                    title="مسح نهائي لكل حاجة تخصه"
                    className="rounded-lg border border-rose-200/50 px-2.5 py-1 text-rose-500/70 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                  >
                    مسح نهائي
                  </button>
                </div>
              </div>

              {/* Stats strip */}
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-page/50 px-3 py-2.5 sm:grid-cols-4 sm:gap-3">
                <button
                  onClick={() => editWage(w)}
                  title="تعديل المرتب الأساسي"
                  className="text-right"
                >
                  <span className="block text-[10px] font-medium text-out/70">الأساسي</span>
                  <span className="tabular block text-sm font-bold text-steel sm:text-base">
                    {(w.wage || 0).toLocaleString("en-US")} Kz
                  </span>
                </button>

                <button
                  onClick={() => editAlmoco(w)}
                  title="تعديل ALMOCO"
                  className="text-right"
                >
                  <span className="block text-[10px] font-medium text-out/70">ALMOCO</span>
                  <span className="tabular block text-sm font-bold text-emerald-600 sm:text-base">
                    {(w.almoco || 0).toLocaleString("en-US")} Kz
                  </span>
                </button>

                <div title="عدد أيام الغياب في الشهر الحالي">
                  <span className="block text-[10px] font-medium text-out/70">غياب الشهر</span>
                  <span
                    className={`tabular block text-sm font-bold sm:text-base ${
                      absenceByWorker[w.id] > 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {absenceByWorker[w.id] ?? 0}
                  </span>
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!w.hasInss}
                    onChange={() => toggleInss(w)}
                    className="h-4 w-4 rounded border-line/60 text-ink focus:ring-2 focus:ring-steel/20"
                  />
                  <span className="text-xs font-semibold text-out/70">ضمان 3%</span>
                </label>
              </div>

              {/* Debt section */}
              {Number(w.debtBalance || 0) > 0 ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/60 bg-rose-50/50 px-3 py-2.5">
                  <span className="tabular text-sm font-bold text-rose-700">
                    💰 عليه دين: {Number(w.debtBalance || 0).toLocaleString("en-US")} Kz
                  </span>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <button
                      onClick={() => repayFromSalary(w)}
                      title="خصم جزء من الدين من مرتب الشهر ده"
                      className="rounded-lg bg-rose-100 px-3 py-1.5 text-rose-700 transition hover:bg-rose-200"
                    >
                      سداد من المرتب
                    </button>

                    <button
                      onClick={() => editDebtBalance(w)}
                      title="تصحيح رصيد الدين يدويًا"
                      className="text-rose-500 transition hover:text-rose-700 hover:underline"
                    >
                      تصحيح
                    </button>

                    <button
                      onClick={() => addNewDebt(w)}
                      title="سجل سلفة جديدة"
                      className="rounded-lg border border-line/60 px-3 py-1.5 text-out transition hover:border-ink/30 hover:bg-page hover:text-ink"
                    >
                      + سلفة
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => addNewDebt(w)}
                  title="سجل سلفة جديدة (هتفضل معلقة وتتخصم على شهور)"
                  className="mt-2 text-xs font-medium text-out/70 transition hover:text-ink hover:underline"
                >
                  + تسجيل سلفة جديدة
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}