export function todayKey(date = new Date()) {
  // CRITICAL: Use Africa/Luanda timezone for ALL attendance calculations
  // This ensures the same date is used regardless of browser timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(date);
  const getPartValue = (type) => parts.find(p => p.type === type)?.value || '0';
  
  const y = getPartValue('year');
  const m = getPartValue('month');
  const d = getPartValue('day');
  
  return `${y}-${m}-${d}`;
}

export function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  // CRITICAL: لازم نثبّت التوقيت على أنجولا (Africa/Luanda) وقت العرض،
  // عشان لو حد فتح التطبيق من دولة تانية (زي مصر) يشوف نفس وقت الحضور/الانصراف
  // بالظبط زي ما هو في أنجولا، مش الوقت المحلي بتاعه هو.
  return d.toLocaleTimeString("ar-EG-u-nu-latn", {
    timeZone: "Africa/Luanda",
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


// ملحوظة: خاصية الانصراف التلقائي (Auto Checkout) اتشالت بالكامل من التطبيق.