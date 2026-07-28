import { useState } from "react";

export default function OwnerWorkersManager({ workers, onAdd, onRemove, onPurge, onUpdate }) {
  const [name, setName] = useState("");
  const [wage, setWage] = useState("");

  function submit(e) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    onAdd(cleanName, wage);
    setName("");
    setWage("");
  }

  function editWage(worker) {
    const value = window.prompt(`اليومية بتاعة ${worker.name}؟`, worker.wage || 0);
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
        إنت بس اللي بتضيف وتمسح العمال. أي فورمان يقدر يسجل حضور أي عامل من القايمة ويحدد اشتغل في انهي ورشة النهاردة
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
          placeholder="اليومية"
          type="number"
          className="tabular w-24 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
        >
          إضافة
        </button>
      </form>

      <ul className="mt-3 flex flex-col divide-y divide-line">
        {workers.length === 0 && (
          <li className="py-3 text-center text-xs text-out">لسه مفيش عمال مضافين</li>
        )}
        {workers.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <p className="text-sm font-medium text-ink">{w.name}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => editWage(w)}
                className="tabular rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-steel hover:bg-mist"
              >
                {w.wage || 0} ج/يوم
              </button>
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
    </div>
  );
}