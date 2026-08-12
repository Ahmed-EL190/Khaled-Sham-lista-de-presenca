// Determine whether a given date is a normal work day, a half day, or an official day off,
// based on the company's weekly schedule ({ offDays: [0..6], halfDays: [0..6] }, 0=Sunday).
export function dayType(dateKey, schedule) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  if (schedule.offDays?.includes(weekday)) return "off";
  if (schedule.halfDays?.includes(weekday)) return "half";
  return "full";
}

// المرتب اللي بيتحط لكل عامل هو المرتب الإجمالي الشهري، واليومية بتتحسب منه أوتوماتيك بقسمته على 30 يوم.
const DAYS_IN_MONTH = 30;

// نسبة الضمان الاجتماعي (INSS) اللي بتتخصم من مرتب العمال المسجلين فيه بس — بتتحسب على المرتب الشهري الكامل.
const INSS_RATE = 0.03;

export function dailyWageFromMonthly(monthlyWage) {
  return (monthlyWage || 0) / DAYS_IN_MONTH;
}

function emptyBucket(workerId, name, monthlyWage, hasInss) {
  return {
    workerId,
    name,
    monthlyWage,
    dailyWage: dailyWageFromMonthly(monthlyWage),
    hasInss: !!hasInss,
    fullDays: 0,
    halfDays: 0,
    offDaysWorked: 0,
    gross: 0,
    deductionsTotal: 0,
    expensesTotal: 0,
    inss: 0,
    net: 0,
  };
}

// Build a payroll summary per worker for a given (already date-filtered) set of records,
// deductions, and expenses (advances the worker already took — both reduce net pay).
export function buildPayrollSummaries(workers, records, deductions, expenses, schedule) {
  const byWorker = {};
  for (const w of workers) {
    byWorker[w.id] = emptyBucket(w.id, w.name, w.wage || 0, w.hasInss);
  }

  for (const r of records) {
    if (!r.checkIn) continue;
    if (!byWorker[r.workerId]) {
      byWorker[r.workerId] = emptyBucket(r.workerId, r.workerName || "عامل سابق", 0, false);
    }
    const bucket = byWorker[r.workerId];
    const type = dayType(r.dateKey, schedule);
    if (type === "half") bucket.halfDays += 1;
    else if (type === "off") bucket.offDaysWorked += 1;
    else bucket.fullDays += 1;
  }

  for (const d of deductions) {
    if (!byWorker[d.workerId]) {
      byWorker[d.workerId] = emptyBucket(d.workerId, d.workerName || "عامل سابق", 0, false);
    }
    byWorker[d.workerId].deductionsTotal += d.amount || 0;
  }

  for (const e of expenses) {
    if (!byWorker[e.workerId]) {
      byWorker[e.workerId] = emptyBucket(e.workerId, e.workerName || "عامل سابق", 0, false);
    }
    byWorker[e.workerId].expensesTotal += e.amount || 0;
  }

  for (const b of Object.values(byWorker)) {
    // off-days-worked are paid as full days (a bonus/overtime day)
    b.gross =
      b.fullDays * b.dailyWage + b.halfDays * (b.dailyWage / 2) + b.offDaysWorked * b.dailyWage;
    // الضمان الاجتماعي ثابت على المرتب الشهري الكامل، مش على أيام الحضور
    b.inss = b.hasInss ? b.monthlyWage * INSS_RATE : 0;
    b.net = b.gross - b.deductionsTotal - b.expensesTotal - b.inss;
  }

  return Object.values(byWorker).sort((a, b) => b.net - a.net);
}