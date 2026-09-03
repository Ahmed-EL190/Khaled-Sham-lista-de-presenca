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

  // شهر النهاردة — بنعرض عليه عدد أيام الغياب جنب كل عامل
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

      if (
        Number.isNaN(wageNum) ||
        Number.isNaN(almocoNum)
      ) {
        continue;
      }

      const wageChanged =
        wageNum !== Number(w.wage || 0);

      const almocoChanged =
        almocoNum !== Number(w.almoco || 0);

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

    onAdd(
      cleanName,
      wage,
      almoco,
      startDate || todayKey()
    );

    setName("");
    setWage("");
    setAlmoco("");
    setStartDate(todayKey());
  }

  function submitBulk(e) {
    e.preventDefault();

    const existing = new Set(
      workers.map((w) =>
        w.name.trim().toLowerCase()
      )
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

      onAdd(
        n,
        bulkWage,
        bulkAlmoco,
        bulkStartDate || todayKey()
      );

      existing.add(n.toLowerCase());
      added += 1;
    }

    setBulkNames("");
    setBulkWage("");
    setBulkAlmoco("");
    setBulkStartDate(todayKey());

    alert(
      `اتضاف ${added} عامل${
        skipped
          ? ` (اتجاهل ${skipped} كان موجود قبل كده)`
          : ""
      }`
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

  // ------------------------------------------------------------
  // الدين / السلفة الكبيرة
  //
  // فكرتها: الرصيد ده بيفضل زي ما هو من شهر للتاني، ومش بيتصفر
  // لوحده. بيتغير بس لما إحنا نغيره إحنا من هنا:
  //   - "سلفة جديدة"  => بيزود الرصيد بس، من غير ما يأثر على
  //                      صافي مرتب الشهر ده خالص.
  //   - "سداد من المرتب" => بيسجل خصم فعلي على الشهر الحالي
  //                      (هيظهر في كشف المرتب وفي "الخصومات")
  //                      وفي نفس الوقت بينقص من الرصيد.
  //   - "تصحيح الرصيد" => تعديل يدوي مباشر للرقم لو غلط.
  // ------------------------------------------------------------

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
      `${worker.name} عليه ${current.toLocaleString(
        "en-US"
      )} Kz.\nتحب تخصم قد ايه من مرتب الشهر ده؟ (هيظهر كخصم في كشف مرتبه)`,
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
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="text-sm font-bold text-ink">
        العمال
      </h3>

      {/* Add worker */}
      <form
        onSubmit={submit}
        className="mt-3 flex flex-wrap gap-2"
      >
        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="اسم العامل"
          className="min-w-36 flex-1 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />

        <input
          value={wage}
          onChange={(e) =>
            setWage(e.target.value)
          }
          placeholder="المرتب الأساسي (Kz)"
          type="number"
          min="0"
          className="tabular w-40 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />

        <input
          value={almoco}
          onChange={(e) =>
            setAlmoco(e.target.value)
          }
          placeholder="ALMOCO (Kz)"
          type="number"
          min="0"
          className="tabular w-36 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />

        <input
          value={startDate}
          onChange={(e) =>
            setStartDate(e.target.value)
          }
          title="تاريخ بدء الشغل"
          type="date"
          className="tabular w-40 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />

        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
        >
          إضافة
        </button>
      </form>

      {/* Controls */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          onClick={() =>
            setBulkOpen((v) => !v)
          }
          className="text-xs font-semibold text-steel hover:underline"
        >
          {bulkOpen
            ? "قفل استيراد الأسماء دفعة واحدة"
            : "استيراد أسماء دفعة واحدة"}
        </button>

        <span className="text-line">
          •
        </span>

        <button
          onClick={() => {
            if (!salaryMode) {
              resetDrafts();
            }

            setSalaryMode((v) => !v);
          }}
          className="text-xs font-semibold text-steel hover:underline"
        >
          {salaryMode
            ? "قفل تعديل المرتبات"
            : "تعديل مرتبات كل العمال دفعة واحدة"}
        </button>
      </div>

      {/* Bulk */}
      {bulkOpen && (
        <form
          onSubmit={submitBulk}
          className="mt-3 flex flex-col gap-2 rounded-lg border border-line bg-page p-3"
        >
          <textarea
            value={bulkNames}
            onChange={(e) =>
              setBulkNames(e.target.value)
            }
            rows={8}
            placeholder={
              "ABILIO K SAPALO\nADELINO BERNARDO\nADELINO DA SILVA"
            }
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-steel"
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={bulkWage}
              onChange={(e) =>
                setBulkWage(e.target.value)
              }
              placeholder="المرتب الأساسي الشهري (Kz)"
              type="number"
              min="0"
              className="tabular rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />

            <input
              value={bulkAlmoco}
              onChange={(e) =>
                setBulkAlmoco(e.target.value)
              }
              placeholder="ALMOCO الشهري (Kz)"
              type="number"
              min="0"
              className="tabular rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />

            <input
              value={bulkStartDate}
              onChange={(e) =>
                setBulkStartDate(e.target.value)
              }
              title="تاريخ بدء الشغل لكل الأسماء دي"
              type="date"
              className="tabular rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
          </div>

          <button
            type="submit"
            className="self-start rounded-lg bg-ink px-4 py-2 text-xs font-bold text-white"
          >
            إضافة الأسماء
          </button>
        </form>
      )}

      {/* Salary edit mode */}
      {salaryMode ? (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-xs">
              <thead>
                <tr className="border-b border-line bg-page">
                  <th className="px-2 py-2">
                    العامل
                  </th>

                  <th className="px-2 py-2">
                    المرتب الأساسي
                  </th>

                  <th className="px-2 py-2">
                    ALMOCO
                  </th>

                  <th className="px-2 py-2">
                    الضمان
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {workers.map((w) => {
                  const draft =
                    drafts[w.id] || {
                      wage: w.wage ?? 0,
                      almoco: w.almoco ?? 0,
                    };

                  return (
                    <tr key={w.id}>
                      <td className="px-2 py-2 font-semibold text-ink">
                        {w.name}
                      </td>

                      <td className="px-2 py-2">
                        <input
                          value={draft.wage}
                          onChange={(e) =>
                            setDraft(
                              w.id,
                              "wage",
                              e.target.value
                            )
                          }
                          type="number"
                          min="0"
                          className="w-36 rounded-lg border border-line bg-page px-2 py-1.5 text-sm"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          value={draft.almoco}
                          onChange={(e) =>
                            setDraft(
                              w.id,
                              "almoco",
                              e.target.value
                            )
                          }
                          type="number"
                          min="0"
                          className="w-32 rounded-lg border border-line bg-page px-2 py-1.5 text-sm"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-out">
                          <input
                            type="checkbox"
                            checked={!!w.hasInss}
                            onChange={() =>
                              toggleInss(w)
                            }
                            className="h-4 w-4 accent-in"
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

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={saveAllSalaries}
              disabled={dirtyCount === 0}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              حفظ التعديلات
              {dirtyCount > 0
                ? ` (${dirtyCount})`
                : ""}
            </button>

            <button
              onClick={resetDrafts}
              disabled={dirtyCount === 0}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-out disabled:opacity-40"
            >
              إلغاء
            </button>

            {savedFlash && (
              <p className="text-xs font-semibold text-in">
                تم الحفظ ✓
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Normal list */
        <ul className="mt-3 flex flex-col gap-2">
          {workers.length === 0 && (
            <li className="py-3 text-center text-xs text-out">
              لسه مفيش عمال مضافين
            </li>
          )}

          {workers.map((w) => (
            <li
              key={w.id}
              className="flex flex-col gap-3 rounded-xl border border-line p-3 sm:p-4"
            >
              {/* Header: name + destructive actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-ink">
                    {w.name}
                  </p>

                  <button
                    onClick={() => editStartDate(w)}
                    title="تعديل تاريخ بدء الشغل"
                    className="tabular mt-0.5 text-[11px] text-out hover:text-ink hover:underline"
                  >
                    بدأ الشغل:{" "}
                    {w.startDate
                      ? formatDateShort(w.startDate)
                      : "—"}
                  </button>
                </div>

                <div className="flex shrink-0 items-center gap-3 pt-0.5 text-[11px] font-medium">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `متأكد إنك عايز تشيل "${w.name}"؟ هيوقف عن الظهور في اليوم، بس سجلاته القديمة هتفضل موجودة في السجل والتقارير.`
                        )
                      ) {
                        onRemove(w.id);
                      }
                    }}
                    title="بيوقف عن الظهور في اليوم، وسجلاته القديمة تفضل موجودة"
                    className="text-out hover:text-red-600 hover:underline"
                  >
                    حذف
                  </button>

                  <button
                    onClick={() => handlePurge(w)}
                    title="مسح نهائي لكل حاجة تخصه"
                    className="text-red-500/80 hover:text-red-600 hover:underline"
                  >
                    مسح نهائي
                  </button>
                </div>
              </div>

              {/* Salary + attendance stat strip */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 rounded-lg bg-page px-3 py-2.5 sm:grid-cols-4">
                <button
                  onClick={() => editWage(w)}
                  title="تعديل المرتب الأساسي"
                  className="text-right"
                >
                  <span className="block text-[10px] font-medium text-out">
                    الأساسي
                  </span>
                  <span className="tabular block text-sm font-bold text-steel">
                    {(w.wage || 0).toLocaleString("en-US")} Kz
                  </span>
                </button>

                <button
                  onClick={() => editAlmoco(w)}
                  title="تعديل ALMOCO"
                  className="text-right"
                >
                  <span className="block text-[10px] font-medium text-out">
                    ALMOCO
                  </span>
                  <span className="tabular block text-sm font-bold text-in">
                    {(w.almoco || 0).toLocaleString("en-US")} Kz
                  </span>
                </button>

                <div title="عدد أيام الغياب في الشهر الحالي">
                  <span className="block text-[10px] font-medium text-out">
                    غياب الشهر
                  </span>
                  <span
                    className={`tabular block text-sm font-bold ${
                      absenceByWorker[w.id] > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {absenceByWorker[w.id] ?? 0}
                  </span>
                </div>

                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={!!w.hasInss}
                    onChange={() => toggleInss(w)}
                    className="h-3.5 w-3.5 accent-in"
                  />
                  <span className="text-xs font-semibold text-out">
                    ضمان 3%
                  </span>
                </label>
              </div>

              {/* Debt / سلفة */}
              {Number(w.debtBalance || 0) > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                  <span className="tabular text-xs font-bold text-rose-700">
                    عليه دين:{" "}
                    {Number(w.debtBalance || 0).toLocaleString(
                      "en-US"
                    )}{" "}
                    Kz
                  </span>

                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    <button
                      onClick={() => repayFromSalary(w)}
                      title="خصم جزء من الدين من مرتب الشهر ده"
                      className="text-rose-700 hover:underline"
                    >
                      سداد من المرتب
                    </button>

                    <button
                      onClick={() => editDebtBalance(w)}
                      title="تصحيح رصيد الدين يدويًا"
                      className="text-rose-500 hover:underline"
                    >
                      تصحيح الرصيد
                    </button>

                    <button
                      onClick={() => addNewDebt(w)}
                      title="سجل سلفة جديدة"
                      className="text-out hover:text-ink hover:underline"
                    >
                      + سلفة جديدة
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => addNewDebt(w)}
                  title="سجل سلفة جديدة (هتفضل معلقة وتتخصم على شهور)"
                  className="self-start text-[11px] font-medium text-out hover:text-ink hover:underline"
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