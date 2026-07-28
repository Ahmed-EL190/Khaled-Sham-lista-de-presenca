import { useState } from "react";

export default function OwnerWorkersManager({ workers, sites, onAdd, onRemove, onUpdate }) {
  const [name, setName] = useState("");
  const [wage, setWage] = useState("");
  const [siteId, setSiteId] = useState(sites[0]?.id || "");

  function submit(e) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || !siteId) return;
    onAdd(cleanName, wage, siteId);
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

  function reassignSite(worker) {
    const names = sites.map((s) => s.name).join(" / ");
    const value = window.prompt(
      `يشتغل في انهي ورشة؟ (${names})`,
      sites.find((s) => s.id === worker.siteId)?.name || ""
    );
    if (value === null) return;
    const site = sites.find((s) => s.name === value.trim());
    if (!site) {
      alert("اسم الورشة لازم يكون مطابق بالظبط لواحدة من الورش الموجودة");
      return;
    }
    onUpdate(worker.id, { siteId: site.id });
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="text-sm font-bold text-ink">العمال (كل الورش)</h3>
      <p className="mt-0.5 text-xs text-out">إنت بس اللي بتضيف وتمسح العمال، والفورمان بيسجل حضورهم بس</p>

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
        <select
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          className="rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        >
          {sites.length === 0 && <option value="">ضيف ورشة الأول</option>}
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={sites.length === 0}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-40"
        >
          إضافة
        </button>
      </form>

      <ul className="mt-3 flex flex-col divide-y divide-line">
        {workers.length === 0 && (
          <li className="py-3 text-center text-xs text-out">لسه مفيش عمال مضافين</li>
        )}
        {workers.map((w) => {
          const site = sites.find((s) => s.id === w.siteId);
          return (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <p className="text-sm font-medium text-ink">{w.name}</p>
                <button
                  onClick={() => reassignSite(w)}
                  className="text-xs font-medium text-steel hover:underline"
                >
                  {site?.name || "بدون ورشة — دوس تحدد"}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => editWage(w)}
                  className="tabular rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-steel hover:bg-mist"
                >
                  {w.wage || 0} ج/يوم
                </button>
                <button
                  onClick={() => onRemove(w.id)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
                >
                  حذف
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}