import { useState } from "react";

export default function ListManager({ title, placeholder, items, onAdd, onRemove, icon = "📋" }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    onAdd(name);
    setValue("");
  }

  return (
    <div className="rounded-2xl border border-line/60 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      {/* العنوان */}
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="text-sm font-bold text-ink sm:text-base">{title}</h3>
        {items.length > 0 && (
          <span className="mr-auto rounded-full bg-mist/80 px-2.5 py-0.5 text-xs font-bold text-steel">
            {items.length}
          </span>
        )}
      </div>

      {/* نموذج الإضافة */}
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-line/60 bg-page px-3 py-2.5 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="w-full rounded-xl bg-linear-to-r from-ink to-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-40 disabled:hover:shadow-none sm:w-auto sm:px-6 sm:py-3"
        >
          إضافة
        </button>
      </form>

      {/* قائمة العناصر */}
      <ul className="mt-3 max-h-60 overflow-y-auto divide-y divide-line/60">
        {items.length === 0 && (
          <li className="py-8 text-center text-xs text-out/70 sm:py-10 sm:text-sm">
            <span className="block text-3xl mb-2">📭</span>
            لسه مفيش حد مضاف
          </li>
        )}
        {items.map((item, index) => (
          <li 
            key={item.id} 
            className={`flex items-center justify-between gap-2 py-2.5 transition hover:bg-mist/20 sm:py-3 ${
              index === 0 ? "" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-out/50">#{index + 1}</span>
              <span className="truncate text-sm font-medium text-ink sm:text-base">
                {item.name}
              </span>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="rounded-lg border border-line/60 px-2.5 py-1 text-xs font-medium text-out transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:px-3 sm:py-1.5"
            >
              حذف
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}