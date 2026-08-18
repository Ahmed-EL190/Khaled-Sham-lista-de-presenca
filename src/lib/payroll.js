// Determine whether a given date is a normal work day, a half day, or an official day off,
// based on the company's weekly schedule ({ offDays: [0..6], halfDays: [0..6] }, 0=Sunday).
export function dayType(dateKey, schedule) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();

  if (schedule.offDays?.includes(weekday)) return "off";
  if (schedule.halfDays?.includes(weekday)) return "half";

  return "full";
}

const DAYS_IN_MONTH = 30;
const WEEKS_PER_MONTH = 4;

// عدد أيام الإجازة الأسبوعية المدفوعة
export function countScheduledOffDaysInMonth(schedule) {
  const offDaysPerWeek = schedule?.offDays?.length || 0;
  return offDaysPerWeek * WEEKS_PER_MONTH;
}

// الضمان الاجتماعي = 3% من المرتب الأساسي فقط
const INSS_RATE = 0.03;

export function dailyWageFromMonthly(monthlyWage) {
  return (Number(monthlyWage) || 0) / DAYS_IN_MONTH;
}

function emptyBucket(workerId, name, basicSalary, hasInss, almoco) {
  return {
    workerId,
    name,

    // المرتب الأساسي
    basicSalary: Number(basicSalary) || 0,

    // نخلي monthlyWage موجود للتوافق مع أي جزء قديم في البرنامج
    monthlyWage: Number(basicSalary) || 0,

    dailyWage: dailyWageFromMonthly(basicSalary),

    // Almoco بدل أكل شهري منفصل
    almoco: Number(almoco) || 0,

    hasInss: !!hasInss,

    fullDays: 0,
    halfDays: 0,
    offDaysWorked: 0,
    paidHolidayDays: 0,

    // قيمة الأساسي المستحقة حسب الحضور
    gross: 0,

    // الخصومات
    deductionsTotal: 0,

    // السلف / المصروفات
    expensesTotal: 0,

    // الضمان الاجتماعي
    inss: 0,

    // الإجمالي قبل الخصومات
    totalBeforeDeductions: 0,

    // الصافي
    net: 0,
  };
}

// Build payroll summary per worker
export function buildPayrollSummaries(
  workers,
  records,
  deductions,
  expenses,
  schedule
) {
  const byWorker = {};
  const scheduledOffDays = countScheduledOffDaysInMonth(schedule);

  for (const w of workers) {
    byWorker[w.id] = emptyBucket(
      w.id,
      w.name,
      w.wage || 0,
      w.hasInss,
      w.almoco || 0
    );
  }

  // Attendance
  for (const r of records) {
    if (!r.checkIn) continue;

    if (!byWorker[r.workerId]) {
      byWorker[r.workerId] = emptyBucket(
        r.workerId,
        r.workerName || "عامل سابق",
        0,
        false,
        0
      );
    }

    const bucket = byWorker[r.workerId];
    const type = dayType(r.dateKey, schedule);

    if (type === "half") {
      bucket.halfDays += 1;
    } else if (type === "off") {
      bucket.offDaysWorked += 1;
    } else {
      bucket.fullDays += 1;
    }
  }

  // Deductions
  for (const d of deductions) {
    if (!byWorker[d.workerId]) {
      byWorker[d.workerId] = emptyBucket(
        d.workerId,
        d.workerName || "عامل سابق",
        0,
        false,
        0
      );
    }

    byWorker[d.workerId].deductionsTotal += Number(d.amount) || 0;
  }

  // Expenses / Advances
  for (const e of expenses) {
    if (!byWorker[e.workerId]) {
      byWorker[e.workerId] = emptyBucket(
        e.workerId,
        e.workerName || "عامل سابق",
        0,
        false,
        0
      );
    }

    byWorker[e.workerId].expensesTotal += Number(e.amount) || 0;
  }

  // Final calculations
  for (const b of Object.values(byWorker)) {
    const wasActiveThisMonth =
      b.fullDays + b.halfDays + b.offDaysWorked > 0;

    b.paidHolidayDays = wasActiveThisMonth
      ? scheduledOffDays
      : 0;

    // الأساسي المستحق حسب الحضور
    b.gross =
      b.fullDays * b.dailyWage +
      b.halfDays * (b.dailyWage / 2) +
      b.offDaysWorked * b.dailyWage +
      b.paidHolidayDays * b.dailyWage;

    // الضمان الاجتماعي يتحسب على الأساسي فقط
    // وليس على Almoco
    b.inss = b.hasInss
      ? b.basicSalary * INSS_RATE
      : 0;

    // الأساسي + بدل الأكل
    b.totalBeforeDeductions =
      b.gross + b.almoco;

    // الصافي
    b.net =
      b.totalBeforeDeductions -
      b.deductionsTotal -
      b.expensesTotal -
      b.inss;
  }

  return Object.values(byWorker).sort((a, b) =>
    (a.name || "").localeCompare(
      b.name || "",
      ["ar", "en"],
      { sensitivity: "base" }
    )
  );
}