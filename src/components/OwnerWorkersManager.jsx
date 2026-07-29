import { useEffect, useMemo, useState } from "react";

function dailyFromMonthly(monthly) {
  return Math.round(((monthly || 0) / 30) * 10) / 10;
}

export default function OwnerWorkersManager({ workers, onAdd, onRemove, onPurge, onUpdate }) {
  const [name, setName] = useState("");
  const [wage, setWage] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [bulkWage, setBulkWage] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [salaryMode, setSalaryMode] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [savedFlash, setSavedFlash] = useState(false);

  // keep drafts in sync with fresh workers (e.g. after a save, or newly added workers)
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const w of workers) {
        if (!(w.id in next)) next[w.id] = w.wage ?? 0;
      }
      // drop drafts for workers that no longer exist
      for (const id of Object.keys(next)) {
        if (!workers.some((w) => w.id === id)) delete next[id];
      }
      return next;
    });
  }, [workers]);

  const dirtyCount = useMemo(
    () =>
      workers.filter((w) => Number(drafts[w.id] ?? w.wage ?? 0) !== Number(w.wage || 0))
        .length,
    [workers, drafts]
  );

  function setDraft(id, value) {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  }

  function saveAllSalaries() {
    let changed = 0;
    for (const w of workers) {
      const val = drafts[w.id];
      if (val === undefined) continue;
      const num = Number(val);
      if (Number.isNaN(num)) continue;
      if (num !== Number(w.wage || 0)) {
        onUpdate(w.id, { wage: num });
        changed += 1;
      }
    }
    if (changed > 0) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    }
  }

  function resetDrafts() {
    const reset = {};
    for (const w of workers) reset[w.id] = w.wage ?? 0;
    setDrafts(reset);
  }

  function submit(e) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    onAdd(cleanName, wage);
    setName("");
    setWage("");
  }

  function submitBulk(e) {
    e.preventDefault();
    const existing = new Set(workers.map((w) => w.name.trim().toLowerCase()));
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
      onAdd(n, bulkWage);
      existing.add(n.toLowerCase());
      added += 1;
    }

    setBulkNames("");
    alert(`اتضاف ${added} عامل${skipped ? ` (اتجاهل ${skipped} كان موجود قبل كده)` : ""}`);
    setBulkOpen(false);
  }

  function editWage(worker) {
    const value = window.prompt(`المرتب الإجمالي الشهري بتاع ${worker.name}؟ (Kz)`, worker.wage || 0);
    if (value === null) return;
    const num = Number(value);
    if (Number.isNaN(num)) return;
    onUpdate(worker.id, { wage: num });
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
      <h3 className="text-sm font-bold text-ink">العمال</h3>
      <p className="mt-0.5 text-xs text-out">
        إنت بس اللي بتضيف وتمسح العمال. أي فورمان يقدر يسجل حضور أي عامل من القايمة ويحدد اشتغل في انهي ورشة النهاردة. المرتب اللي بتحطه هو الإجمالي الشهري بالكوانزا (Kz)، واليومية بتتحسب أوتوماتيك بقسمته على 30.
      </p>

      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم العامل"
          className="min-w-36 flex-1 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />
        <input
          value={wage}
          onChange={(e) => setWage(e.target.value)}
          placeholder="المرتب الإجمالي (شهري، Kz)"
          type="number"
          className="tabular w-40 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
        >
          إضافة
        </button>
      </form>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setBulkOpen((v) => !v)}
          className="text-xs font-semibold text-steel hover:underline"
        >
          {bulkOpen ? "قفل استيراد الأسماء دفعة واحدة" : "استيراد أسماء دفعة واحدة"}
        </button>
        <span className="text-line">•</span>
        <button
          onClick={() => {
            if (!salaryMode) resetDrafts();
            setSalaryMode((v) => !v);
          }}
          className="text-xs font-semibold text-steel hover:underline"
        >
          {salaryMode ? "قفل تعديل المرتبات" : "تعديل مرتبات كل العمال دفعة واحدة"}
        </button>
      </div>

      {bulkOpen && (
        <form onSubmit={submitBulk} className="mt-3 flex flex-col gap-2 rounded-lg border border-line bg-page p-3">
          <label className="text-xs font-medium text-out">
            الصق كل اسم في سطر لوحده
          </label>
          <textarea
            value={bulkNames}
            onChange={(e) => setBulkNames(e.target.value)}
            rows={8}
            placeholder={"ABILIO K SAPALO\nADELINO BERNARDO\nADELINO DA SILVA\n..."}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-steel"
          />
          <div className="flex items-center gap-2">
            <input
              value={bulkWage}
              onChange={(e) => setBulkWage(e.target.value)}
              placeholder="المرتب الإجمالي الشهري لكل الأسماء دي (Kz، اختياري)"
              type="number"
              className="tabular flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-steel"
            />
            <button
              type="submit"
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              إضافة الكل
            </button>
          </div>
        </form>
      )}

      {salaryMode ? (
        <div className="mt-3 rounded-lg border border-line bg-page p-3">
          <p className="text-xs text-out">
            غيّر مرتب أي عامل هنا براحتك (المرتب الإجمالي الشهري)، وكمّل على كل الأسماء اللي عايزها، وفي الآخر دوس "حفظ" مرة واحدة يحفظ كل التعديلات
          </p>

          {workers.length === 0 ? (
            <p className="py-3 text-center text-xs text-out">لسه مفيش عمال مضافين</p>
          ) : (
            <ul className="mt-2 flex flex-col divide-y divide-line">
              {workers.map((w) => {
                const draftVal = drafts[w.id] ?? w.wage ?? 0;
                const isDirty = Number(draftVal) !== Number(w.wage || 0);
                return (
                  <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                    <p className="text-sm font-medium text-ink">{w.name}</p>
                    <div className="flex items-center gap-1.5">
                      <input
                        value={draftVal}
                        onChange={(e) => setDraft(w.id, e.target.value)}
                        type="number"
                        className={`tabular w-24 rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:border-steel ${
                          isDirty ? "border-steel bg-white text-ink" : "border-line bg-white text-ink"
                        }`}
                      />
                      <span className="text-xs text-out">Kz/شهر</span>
                      <span className="text-[11px] text-out">
                        (≈ {dailyFromMonthly(draftVal).toLocaleString("en-US")} Kz/يوم)
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={saveAllSalaries}
              disabled={dirtyCount === 0}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
            >
              حفظ التعديلات{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
            </button>
            <button
              onClick={resetDrafts}
              disabled={dirtyCount === 0}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-out hover:bg-mist disabled:opacity-40"
            >
              إلغاء التعديلات
            </button>
            {savedFlash && <p className="text-xs font-semibold text-in">تم الحفظ ✓</p>}
          </div>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line">
          {workers.length === 0 && (
            <li className="py-3 text-center text-xs text-out">لسه مفيش عمال مضافين</li>
          )}
          {workers.map((w) => (
            <li key={w.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-ink">{w.name}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => editWage(w)}
                  title="دوس تعدل المرتب الإجمالي الشهري"
                  className="tabular rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-steel hover:bg-mist"
                >
                  {(w.wage || 0).toLocaleString("en-US")} Kz/شهر
                </button>
                <span className="text-[11px] text-out">
                  ≈ {dailyFromMonthly(w.wage).toLocaleString("en-US")} Kz/يوم
                </span>
                <button
                  onClick={() => onRemove(w.id)}
                  title="بيوقف عن الظهور في اليوم، وسجلاته القديمة تفضل موجودة"
                  className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
                >
                  حذف
                </button>
                <button
                  onClick={() => handlePurge(w)}
                  title="مسح نهائي لكل حاجة تخصه — حضور وخصومات وتقارير"
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