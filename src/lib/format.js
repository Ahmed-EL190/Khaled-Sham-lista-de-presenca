export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-EG-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long" });
}

// تاريخ مختصر (مثلاً "15 يناير 2026") — بنستخدمه في عرض تاريخ بدء شغل العامل
export function formatDateShort(dateKey) {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Duration between check-in and check-out (or now), in "Xس Yد" format
export function formatDuration(startIso, endIso) {
  if (!startIso) return "";
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - start) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}د`;
  return `${h}س ${m}د`;
}