// Determine whether a given date is a normal work day, a half day, or an official day off,
// based on the company's weekly schedule ({ offDays: [0..6], halfDays: [0..6] }, 0=Sunday).
export function dayType(dateKey, schedule) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  if (schedule.offDays?.includes(weekday)) return "off";
  if (schedule.halfDays?.includes(weekday)) return "half";
  return "full";
}

// Build a payroll summary per worker for a given (already date-filtered) set of records and deductions.
export function buildPayrollSummaries(workers, records, deductions, schedule) {
  const byWorker = {};
  for (const w of workers) {
    byWorker[w.id] = {
      workerId: w.id,
      name: w.name,
      wage: w.wage || 0,
      fullDays: 0,
      halfDays: 0,
      offDaysWorked: 0,
      gross: 0,
      deductionsTotal: 0,
      net: 0,
    };
  }

  for (const r of records) {
    if (!r.checkIn) continue;
    if (!byWorker[r.workerId]) {
      byWorker[r.workerId] = {
        workerId: r.workerId,
        name: r.workerName || "عامل سابق",
        wage: 0,
        fullDays: 0,
        halfDays: 0,
        offDaysWorked: 0,
        gross: 0,
        deductionsTotal: 0,
        net: 0,
      };
    }
    const bucket = byWorker[r.workerId];
    const type = dayType(r.dateKey, schedule);
    if (type === "half") bucket.halfDays += 1;
    else if (type === "off") bucket.offDaysWorked += 1;
    else bucket.fullDays += 1;
  }

  for (const d of deductions) {
    if (!byWorker[d.workerId]) {
      byWorker[d.workerId] = {
        workerId: d.workerId,
        name: d.workerName || "عامل سابق",
        wage: 0,
        fullDays: 0,
        halfDays: 0,
        offDaysWorked: 0,
        gross: 0,
        deductionsTotal: 0,
        net: 0,
      };
    }
    byWorker[d.workerId].deductionsTotal += d.amount || 0;
  }

  for (const b of Object.values(byWorker)) {
    // off-days-worked are paid as full days (a bonus/overtime day)
    b.gross = b.fullDays * b.wage + b.halfDays * (b.wage / 2) + b.offDaysWorked * b.wage;
    b.net = b.gross - b.deductionsTotal;
  }

  return Object.values(byWorker).sort((a, b) => b.net - a.net);
}
