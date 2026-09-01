import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { todayKey } from "./format";

function docsFromSnap(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ترتيب أبجدي عربي/إنجليزي سليم للأسماء (يتجاهل الفروق البسيطة زي التشكيل والحالة).
function sortByName(list) {
  return list
    .slice()
    .sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", ["ar", "en"], { sensitivity: "base" })
    );
}

// ---------- Sites ----------
export function subscribeSites(cb) {
  return onSnapshot(collection(db, "sites"), (snap) => cb(docsFromSnap(snap)));
}

export function addSite({ name, pin }) {
  return addDoc(collection(db, "sites"), { name, pin });
}

export function updateSite(id, patch) {
  return setDoc(doc(db, "sites", id), patch, { merge: true });
}

export function removeSite(id) {
  return deleteDoc(doc(db, "sites", id));
}

// ---------- Workers ----------
// العمال قايمة واحدة مشتركة بين كل الورش (مفيش ورشة ثابتة للعامل).
// بترجع مرتبة أبجديًا بالاسم عشان تفضل مرتبة في كل مكان في الموقع (البحث، الرواتب، الفورمات...).
export function subscribeWorkers(cb) {
  return onSnapshot(collection(db, "workers"), (snap) =>
    cb(sortByName(docsFromSnap(snap)))
  );
}

export function addWorker({ name, wage, almoco, startDate }) {
  return addDoc(collection(db, "workers"), {
    name,
    wage: Number(wage) || 0,
    almoco: Number(almoco) || 0,
    hasInss: false,
    // تاريخ بدء الشغل — لو ما اتحددش، بنفترض إنه بدأ النهاردة
    startDate: startDate || todayKey(),
  });
}

export function updateWorker(id, patch) {
  return setDoc(doc(db, "workers", id), patch, { merge: true });
}

export function removeWorker(id) {
  return deleteDoc(doc(db, "workers", id));
}

// ---------- Records ----------
// record doc id = `${dateKey}__${workerId}` so a punch is a simple upsert.
function recordId(dateKey, workerId) {
  return `${dateKey}__${workerId}`;
}

// سجلات "اليوم" لازم تبقى عامة (مش مقفولة على ورشة) عشان كل الفورمانات
// يشوفوا مين اتسجل حضوره فين، ومايحصلش تسجيل مزدوج لنفس العامل في ورشتين.
export function subscribeRecordsForDate(dateKey, cb) {
  const q = query(collection(db, "records"), where("dateKey", "==", dateKey));
  return onSnapshot(q, (snap) => cb(docsFromSnap(snap)));
}

export function subscribeAllRecords(siteId, cb) {
  const base = collection(db, "records");
  const q = siteId ? query(base, where("siteId", "==", siteId)) : base;
  return onSnapshot(q, (snap) => cb(docsFromSnap(snap)));
}

export function punchIn({ dateKey, workerId, workerName, siteId, siteName }) {
  return setDoc(doc(db, "records", recordId(dateKey, workerId)), {
    dateKey,
    workerId,
    workerName,
    siteId: siteId || null,
    siteName: siteName || null,
    checkIn: new Date().toISOString(),
    checkOut: null,
  });
}

export function punchOut({ dateKey, workerId }) {
  return setDoc(
    doc(db, "records", recordId(dateKey, workerId)),
    { checkOut: new Date().toISOString(), autoCheckedOut: false },
    { merge: true }
  );
}

// انصراف تلقائي: بيتسجل لو حد نسي يعمل انصراف بعد معاد معين (5:30 مساءً افتراضيًا).
// بيتحط checkOut بوقت المعاد نفسه (مش وقت تشغيل الفحص)، وبيتحط علامة autoCheckedOut
// عشان يبان في الواجهة إنه مش انصراف حقيقي اتسجل.
export function autoPunchOut({ dateKey, workerId, checkOutAt }) {
  return setDoc(
    doc(db, "records", recordId(dateKey, workerId)),
    { checkOut: checkOutAt, autoCheckedOut: true },
    { merge: true }
  );
}

export function clearCheckOut({ dateKey, workerId }) {
  return setDoc(
    doc(db, "records", recordId(dateKey, workerId)),
    { checkOut: null, autoCheckedOut: false },
    { merge: true }
  );
}

export function addLateRecord({ dateKey, workerId, workerName, siteId, siteName, checkIn, checkOut }) {
  return setDoc(doc(db, "records", recordId(dateKey, workerId)), {
    dateKey,
    workerId,
    workerName,
    siteId: siteId || null,
    siteName: siteName || null,
    checkIn: checkIn || null,
    checkOut: checkOut || null,
  });
}

export function deleteRecord({ dateKey, workerId }) {
  return deleteDoc(doc(db, "records", recordId(dateKey, workerId)));
}

// ---------- Weekly schedule (which days are off / half-day) ----------
export function subscribeSchedule(cb) {
  return onSnapshot(doc(db, "settings", "schedule"), (snap) => {
    if (snap.exists()) {
      cb(snap.data());
    } else {
      // يوم عادي بالنسبة للسبت: العمال بيشتغلوا نص يوم بس بيتحسبلهم يوم كامل
      // (نظام البلد)، فمفيش داعي يبقى "نص يوم" في الجدول أصلاً
      cb({ offDays: [0], halfDays: [] });
    }
  });
}

export function saveSchedule(schedule) {
  return setDoc(doc(db, "settings", "schedule"), schedule);
}

// ---------- Deductions ----------
// الفورمان بس بيضيف، وبيوصل لصاحب الشركة فقط (مبيتعرضش على الفورمان أبدًا).
export function subscribeDeductions(siteId, cb) {
  const base = collection(db, "deductions");
  const q = siteId ? query(base, where("siteId", "==", siteId)) : base;
  return onSnapshot(q, (snap) => cb(docsFromSnap(snap)));
}

export function addDeduction({ workerId, workerName, siteId, siteName, dateKey, amount, reason }) {
  return addDoc(collection(db, "deductions"), {
    workerId,
    workerName,
    siteId: siteId || null,
    siteName: siteName || null,
    dateKey,
    amount: Number(amount) || 0,
    reason: reason || "",
    createdAt: new Date().toISOString(),
  });
}

export function updateDeduction(id, patch) {
  return setDoc(doc(db, "deductions", id), patch, { merge: true });
}

export function removeDeduction(id) {
  return deleteDoc(doc(db, "deductions", id));
}

// ---------- Expenses (مصروفات/سلف العمال) ----------
// بتتسجل من الورشة العادية زي الخصومات بالظبط، وبتظهر في تقارير الورشة والإدارة.
export function subscribeExpenses(siteId, cb) {
  const base = collection(db, "expenses");
  const q = siteId ? query(base, where("siteId", "==", siteId)) : base;
  return onSnapshot(q, (snap) => cb(docsFromSnap(snap)));
}

export function addExpense({ workerId, workerName, siteId, siteName, dateKey, amount, reason }) {
  return addDoc(collection(db, "expenses"), {
    workerId,
    workerName,
    siteId: siteId || null,
    siteName: siteName || null,
    dateKey,
    amount: Number(amount) || 0,
    reason: reason || "",
    createdAt: new Date().toISOString(),
  });
}

export function updateExpense(id, patch) {
  return setDoc(doc(db, "expenses", id), patch, { merge: true });
}

export function removeExpense(id) {
  return deleteDoc(doc(db, "expenses", id));
}

// ---------- Payments (تأكيد إن العامل استلم مرتبه فعلاً) ----------
// doc id = `${monthKey}__${workerId}` عشان يكون upsert بسيط زي الحضور بالظبط.
function paymentId(monthKey, workerId) {
  return `${monthKey}__${workerId}`;
}

export function subscribePayments(cb) {
  return onSnapshot(collection(db, "payments"), (snap) => cb(docsFromSnap(snap)));
}

export function markSalaryPaid({ monthKey, workerId, workerName, amount }) {
  return setDoc(doc(db, "payments", paymentId(monthKey, workerId)), {
    monthKey,
    workerId,
    workerName: workerName || "",
    amount: Number(amount) || 0,
    paid: true,
    paidAt: new Date().toISOString(),
  });
}

export function markSalaryUnpaid({ monthKey, workerId }) {
  return deleteDoc(doc(db, "payments", paymentId(monthKey, workerId)));
}

// ---------- Purge (delete worker + ALL their history everywhere) ----------
export async function purgeWorker(workerId) {
  const recordsQ = query(collection(db, "records"), where("workerId", "==", workerId));
  const deductionsQ = query(collection(db, "deductions"), where("workerId", "==", workerId));
  const expensesQ = query(collection(db, "expenses"), where("workerId", "==", workerId));
  const [recordsSnap, deductionsSnap, expensesSnap] = await Promise.all([
    getDocs(recordsQ),
    getDocs(deductionsQ),
    getDocs(expensesQ),
  ]);

  const batch = writeBatch(db);
  recordsSnap.docs.forEach((d) => batch.delete(d.ref));
  deductionsSnap.docs.forEach((d) => batch.delete(d.ref));
  expensesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "workers", workerId));

  await batch.commit();
}