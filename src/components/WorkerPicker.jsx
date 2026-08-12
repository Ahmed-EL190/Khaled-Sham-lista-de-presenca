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

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  function pick(id) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }

  function handleFocus() {
    setQuery("");
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
    <div ref={boxRef} className="relative">
      <input
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-steel"
      />

      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
          {allowAll && (
            <button
              type="button"
              onClick={() => pick("all")}
              className={`block w-full px-3 py-2 text-right text-sm hover:bg-mist ${
                value === "all" ? "bg-mist font-semibold text-ink" : "text-ink"
              }`}
            >
              {allLabel}
            </button>
          )}

          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-out">مفيش عامل بالاسم ده</p>
          ) : (
            filtered.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => pick(w.id)}
                className={`block w-full px-3 py-2 text-right text-sm hover:bg-mist ${
                  w.id === value ? "bg-mist font-semibold text-ink" : "text-ink"
                }`}
              >
                {w.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}