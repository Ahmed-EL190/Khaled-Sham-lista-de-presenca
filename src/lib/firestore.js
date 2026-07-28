import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

function docsFromSnap(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- Sites ----------
export function subscribeSites(cb) {
  return onSnapshot(collection(db, "sites"), (snap) => cb(docsFromSnap(snap)));
}

export function addSite({ name, pin }) {
  return addDoc(collection(db, "sites"), { name, pin });
}

export function removeSite(id) {
  return deleteDoc(doc(db, "sites", id));
}

// ---------- Workers ----------
export function subscribeWorkers(siteId, cb) {
  const q = siteId
    ? query(collection(db, "workers"), where("siteId", "==", siteId))
    : collection(db, "workers");
  return onSnapshot(q, (snap) => cb(docsFromSnap(snap)));
}

export function addWorker({ name, siteId, wage }) {
  return addDoc(collection(db, "workers"), { name, siteId, wage: Number(wage) || 0 });
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

export function subscribeRecordsForDate(dateKey, siteId, cb) {
  const base = collection(db, "records");
  const q = siteId
    ? query(base, where("dateKey", "==", dateKey), where("siteId", "==", siteId))
    : query(base, where("dateKey", "==", dateKey));
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
    { checkOut: new Date().toISOString() },
    { merge: true }
  );
}

export function clearCheckOut({ dateKey, workerId }) {
  return setDoc(
    doc(db, "records", recordId(dateKey, workerId)),
    { checkOut: null },
    { merge: true }
  );
}

export function deleteRecord({ dateKey, workerId }) {
  return deleteDoc(doc(db, "records", recordId(dateKey, workerId)));
}

// ---------- Weekly schedule (which days are off / half-day) ----------
// doc: settings/schedule -> { offDays: [0], halfDays: [6] }  (0=Sunday ... 6=Saturday)
export function subscribeSchedule(cb) {
  return onSnapshot(doc(db, "settings", "schedule"), (snap) => {
    if (snap.exists()) {
      cb(snap.data());
    } else {
      cb({ offDays: [0], halfDays: [6] }); // default: Sunday off, Saturday half
    }
  });
}

export function saveSchedule(schedule) {
  return setDoc(doc(db, "settings", "schedule"), schedule);
}

// ---------- Deductions ----------
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

export function removeDeduction(id) {
  return deleteDoc(doc(db, "deductions", id));
}