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

// ========== ANGOLA TIMEZONE FUNCTIONS (Africa/Luanda = UTC+1) ==========

// Get the current time as it appears in Angola timezone (Africa/Luanda)
export function getAngolaTime() {
  const utcDate = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(utcDate);
  const getPartValue = (type) => parseInt(parts.find(p => p.type === type)?.value || 0);
  
  const year = getPartValue('year');
  const month = getPartValue('month') - 1; // JS months are 0-indexed
  const day = getPartValue('day');
  const hour = getPartValue('hour');
  const minute = getPartValue('minute');
  const second = getPartValue('second');
  
  // Construct a date representing this Angola local time
  // We'll use UTC constructor and offset by Angola timezone
  // Angola offset is UTC+1, so we need to subtract 1 hour to get the UTC equivalent
  return new Date(year, month, day, hour, minute, second);
}

// Check if current Angola time has reached or passed 17:30
export function isAngolaAutoCheckoutTime() {
  const angolaTime = getAngolaTime();
  const hours = angolaTime.getHours();
  const minutes = angolaTime.getMinutes();
  
  console.log('[AUTO_CHECKOUT] Angola local time:', {
    hours,
    minutes,
    fullTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    hasReachedCutoff: hours > 17 || (hours === 17 && minutes >= 30)
  });
  
  return hours > 17 || (hours === 17 && minutes >= 30);
}

// Get the auto-checkout cutoff time as an ISO string representing 17:30 Angola time today
export function getAutoCheckoutCutoffIso() {
  const utcDate = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(utcDate);
  const getPartValue = (type) => parseInt(parts.find(p => p.type === type)?.value || 0);
  
  const year = getPartValue('year');
  const month = getPartValue('month') - 1;
  const day = getPartValue('day');
  
  // Create a date for 17:30 Angola time today
  // Since Angola is UTC+1, 17:30 Angola time = 16:30 UTC
  const cutoffUTC = new Date(Date.UTC(year, month, day, 16, 30, 0, 0));
  const isoString = cutoffUTC.toISOString();
  
  console.log('[AUTO_CHECKOUT] Cutoff ISO generated:', {
    angolaTime: '17:30',
    utcEquivalent: '16:30',
    isoString: isoString
  });
  
  return isoString;
}