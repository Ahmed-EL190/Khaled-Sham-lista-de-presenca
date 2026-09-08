import { useEffect, useRef, useState } from "react";

export default function WorkerPicker({
  workers,
  value,
  onChange,
  placeholder = "دور على اسم العامل...",
  allowAll = false,
  allLabel = "كل العمال",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const selectedWorker = workers.find((w) => w.id === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // إغلاق القائمة عند الضغط على Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  function pick(id) {
    onChange(id);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleFocus() {
    setQuery("");
    setOpen(true);
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    setOpen(true);
  }

  const displayValue = open
    ? query
    : selectedWorker
    ? selectedWorker.name
    : value === "all"
    ? allLabel
    : "";

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full rounded-xl border border-line/60 bg-page px-3 py-2.5 pr-9 text-sm text-ink outline-none transition focus:border-steel/80 focus:ring-2 focus:ring-steel/20 sm:py-3"
        />
        {/* أيقونة السهم */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-out transition hover:bg-mist/50 hover:text-ink"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-line/60 bg-white shadow-xl shadow-ink/5">
          {allowAll && (
            <button
              type="button"
              onClick={() => pick("all")}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-right text-sm transition hover:bg-mist/50 ${
                value === "all"
                  ? "bg-mist/30 font-semibold text-ink"
                  : "text-ink"
              } border-b border-line/60 last:border-0`}
            >
              <span className="text-out/50 text-xs">👥</span>
              <span>{allLabel}</span>
              {value === "all" && (
                <span className="text-xs text-emerald-600">✓</span>
              )}
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <span className="text-3xl">🔍</span>
              <p className="text-xs text-out/70">مفيش عامل بالاسم ده</p>
            </div>
          ) : (
            filtered.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => pick(w.id)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-right text-sm transition hover:bg-mist/50 ${
                  w.id === value
                    ? "bg-mist/30 font-semibold text-ink"
                    : "text-ink"
                } border-b border-line/60 last:border-0`}
              >
                <span className="text-out/50 text-xs">👤</span>
                <span className="flex-1">{w.name}</span>
                {w.id === value && (
                  <span className="text-xs text-emerald-600">✓</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}