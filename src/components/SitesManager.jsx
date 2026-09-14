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
    <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <span className="text-xl">🏭</span>
        <h3 className="text-sm font-bold text-ink sm:text-base">الورش</h3>
        <span className="mr-auto rounded-full bg-mist/80 px-2.5 py-0.5 text-xs font-bold text-steel">
          {sites.length}
        </span>
      </div>

      <p className="mt-2 text-xs text-out/70 sm:text-sm">
        🔑 كل ورشة ليها كود دخول (PIN) تديه لمسؤولها
      </p>

      {/* Add form */}
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الورشة *"
          className="min-w-36 flex-1 rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
        />
        <input
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          placeholder="كود الدخول *"
          inputMode="numeric"
          className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:w-32 sm:py-3"
        />
        <button
          type="submit"
          disabled={!name.trim() || !pinInput.trim()}
          className="w-full rounded-xl bg-linear-to-r from-ink to-gray-800 px-6 py-2.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-40 disabled:hover:shadow-none sm:w-auto sm:py-3"
        >
          إضافة
        </button>
      </form>

      {/* Sites list */}
      <ul className="mt-3 flex flex-col divide-y divide-line/60">
        {sites.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line/60 py-8 text-center text-sm text-out/70">
            <span className="block text-3xl mb-2">📭</span>
            لسه مفيش ورش مضافة
          </li>
        )}
        {sites.map((site) => (
          <li key={site.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
            <button
              onClick={() => editName(site)}
              title="دوس تعدل اسم الورشة"
              className="text-sm font-semibold text-ink transition hover:text-steel hover:underline sm:text-base"
            >
              🏗️ {site.name}
            </button>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => editPin(site)}
                title="دوس تعدل كود الدخول"
                className="tabular rounded-full bg-mist/60 px-3 py-1 text-xs font-semibold text-steel transition hover:bg-mist hover:text-ink sm:px-3.5 sm:text-sm"
              >
                🔑 {site.pin}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`متأكد إنك عايز تمسح ورشة "${site.name}"؟ الخطوة دي مش هترجع.`)) {
                    onRemove(site.id);
                  }
                }}
                className="rounded-lg border border-line/60 px-2.5 py-1 text-xs font-medium text-out transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:px-3 sm:py-1.5"
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