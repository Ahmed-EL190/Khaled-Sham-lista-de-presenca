import { useState } from "react";

export default function ListManager({ title, placeholder, items, onAdd, onRemove }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    onAdd(name);
    setValue("");
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="text-sm font-bold text-ink">{title}</h3>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
        >
          إضافة
        </button>
      </form>

      <ul className="mt-3 flex flex-col divide-y divide-line">
        {items.length === 0 && (
          <li className="py-3 text-center text-xs text-out">لسه مفيش حد مضاف</li>
        )}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-ink">{item.name}</span>
            <button
              onClick={() => onRemove(item.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-out hover:bg-page hover:text-red-600"
            >
              حذف
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
