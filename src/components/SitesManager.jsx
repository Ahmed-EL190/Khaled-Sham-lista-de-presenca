import { useState } from "react";

export default function SitesManager({ sites, onAdd, onRemove, onUpdate }) {
  const [name, setName] = useState("");
  const [pinInput, setPinInput] = useState("");

  function submit(e) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPin = pinInput.trim();
    if (!cleanName || !cleanPin) return;
    onAdd(cleanName, cleanPin);
    setName("");
    setPinInput("");
  }

  function editName(site) {
    const value = window.prompt("اسم الورشة؟", site.name || "");
    if (value === null) return;
    const cleanValue = value.trim();
    if (!cleanValue || cleanValue === site.name) return;
    onUpdate(site.id, { name: cleanValue });
  }

  function editPin(site) {
    const value = window.prompt(`كود الدخول بتاع ${site.name}؟`, site.pin || "");
    if (value === null) return;
    const cleanValue = value.trim();
    if (!cleanValue || cleanValue === site.pin) return;
    onUpdate(site.id, { pin: cleanValue });
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="text-sm font-bold text-ink">الورش</h3>
      <p className="mt-0.5 text-xs text-out">كل ورشة ليها كود دخول (PIN) تديه لمسؤولها</p>

      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الورشة"
          className="min-w-[9rem] flex-1 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />
        <input
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          placeholder="كود الدخول"
          inputMode="numeric"
          className="tabular w-28 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
        >
          إضافة
        </button>
      </form>

      <ul className="mt-3 flex flex-col divide-y divide-line">
        {sites.length === 0 && (
          <li className="py-3 text-center text-xs text-out">لسه مفيش ورش مضافة</li>
        )}
        {sites.map((site) => (
          <li key={site.id} className="flex items-center justify-between py-2">
            <button
              onClick={() => editName(site)}
              title="دوس تعدل اسم الورشة"
              className="text-right text-sm font-medium text-ink hover:underline"
            >
              {site.name}
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => editPin(site)}
                title="دوس تعدل كود الدخول"
                className="tabular rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-steel hover:bg-mist"
              >
                كود: {site.pin}
              </button>
              <button
                onClick={() => onRemove(site.id)}
                className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
              >
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}