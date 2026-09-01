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
        <ul className="mt-3 flex flex-col divide-y divide-line">
          {workers.length === 0 && (
            <li className="py-3 text-center text-xs text-out">
              لسه مفيش عمال مضافين
            </li>
          )}

          {workers.map((w) => (
            <li
              key={w.id}
              className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {w.name}
                </p>
                <p className="mt-0.5 text-[11px] text-out">
                  بدأ الشغل: {w.startDate ? formatDateShort(w.startDate) : "—"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Start date */}
                <button
                  onClick={() => editStartDate(w)}
                  title="تعديل تاريخ بدء الشغل"
                  className="tabular rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-mist"
                >
                  بدأ: {w.startDate ? formatDateShort(w.startDate) : "—"}
                </button>

                {/* Absence this month */}
                <span
                  title="عدد أيام الغياب في الشهر الحالي"
                  className={`tabular rounded-full px-2.5 py-1 text-xs font-semibold ${
                    absenceByWorker[w.id] > 0
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  غياب الشهر: {absenceByWorker[w.id] ?? 0}
                </span>

                {/* Basic */}
                <button
                  onClick={() => editWage(w)}
                  title="تعديل المرتب الأساسي"
                  className="tabular rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-steel hover:bg-mist"
                >
                  أساسي:{" "}
                  {(w.wage || 0).toLocaleString(
                    "en-US"
                  )}{" "}
                  Kz
                </button>

                {/* Almoco */}
                <button
                  onClick={() => editAlmoco(w)}
                  title="تعديل ALMOCO"
                  className="tabular rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-in hover:bg-mist"
                >
                  Almoco:{" "}
                  {(w.almoco || 0).toLocaleString(
                    "en-US"
                  )}{" "}
                  Kz
                </button>

                {/* INSS */}
                <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-out hover:bg-page">
                  <input
                    type="checkbox"
                    checked={!!w.hasInss}
                    onChange={() =>
                      toggleInss(w)
                    }
                    className="h-3.5 w-3.5 accent-in"
                  />

                  ضمان 3%
                </label>

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
                  className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
                >
                  حذف
                </button>

                <button
                  onClick={() =>
                    handlePurge(w)
                  }
                  title="مسح نهائي لكل حاجة تخصه"
                  className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  مسح نهائي
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}