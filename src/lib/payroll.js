import { todayKey } from "./format";

// تحديد نوع اليوم:
// full = يوم كامل
// half = نص يوم
// off = إجازة أسبوعية
//
// 0 = الأحد
// 1 = الإثنين
// 2 = الثلاثاء
// 3 = الأربعاء
// 4 = الخميس
// 5 = الجمعة
// 6 = السبت
export function dayType(dateKey, schedule) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();

  // السبت يوم عمل كامل دائمًا.
  // حتى لو كانت إعدادات قديمة مسجلاه إجازة أو نص يوم.
  if (weekday === 6) return "full";

  if (schedule.offDays?.includes(weekday)) return "off";

  if (schedule.halfDays?.includes(weekday)) return "half";

  return "full";
}

const DAYS_IN_MONTH = 30;

// --------------------------------------------------------------
// الشركة بتحسب الشهر دايمًا على أساس 30 يوم، مهما كان عدد
// أيام الشهر الفعلي في التقويم (28 في فبراير أو 31 في شهور تانية).
//
// الشهر القياسي = 30 يوم
//   - 4 أيام إجازة أسبوعية (الأحد) مدفوعة
//   - 26 يوم عمل
// --------------------------------------------------------------
const STANDARD_OFF_DAYS_PER_MONTH = 4;
const STANDARD_WORK_DAYS_PER_MONTH =
  DAYS_IN_MONTH - STANDARD_OFF_DAYS_PER_MONTH; // 26

// عدد أيام الشهر الحقيقي (بيُستخدم بس عشان نلف على تواريخ
// حقيقية موجودة في السجلات، مش في حساب مستحقات العامل).
// مثال:
// 2026-02 = 28
// 2026-09 = 30
// 2026-10 = 31
function daysInCalendarMonth(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// حساب عدد أيام الإجازة الأسبوعية المدفوعة في الشهر.
//
// لو العامل كان موجود من أول يوم في الشهر (يعني اشتغل الشهر
// كامل): نرجع رقم ثابت دايمًا = 4، بغض النظر عن كون الشهر
// 28 يوم أو 30 أو 31 في التقويم.
//
// لو العامل بدأ شغله في نص الشهر: نحسب أيام الإجازة الفعلية
// من تاريخ بدايته لحد آخر الشهر حسب التقويم الحقيقي (تناسبيًا).
export function countScheduledOffDaysInMonth(
  schedule,
  monthKey,
  fromDateKey
) {
  const offWeekdays = schedule?.offDays || [];

  if (offWeekdays.length === 0 || !monthKey) {
    return 0;
  }

  if (!fromDateKey) {
    return STANDARD_OFF_DAYS_PER_MONTH;
  }

  const [y, m] = monthKey.split("-").map(Number);
  const daysInMonth = daysInCalendarMonth(monthKey);

  let count = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${monthKey}-${String(d).padStart(2, "0")}`;

    // لو العامل بدأ في منتصف الشهر
    // لا نحسب أيام الإجازة اللي قبل بداية شغله.
    if (dateKey < fromDateKey) {
      continue;
    }

    const weekday = new Date(y, m - 1, d).getDay();

    // السبت يوم عمل كامل وليس إجازة.
    if (weekday === 6) {
      continue;
    }

    if (offWeekdays.includes(weekday)) {
      count += 1;
    }
  }

  return count;
}

// الضمان الاجتماعي = 3% من المرتب الأساسي فقط
const INSS_RATE = 0.03;

// اليومية = المرتب الشهري ÷ 30
export function dailyWageFromMonthly(monthlyWage) {
  return (Number(monthlyWage) || 0) / DAYS_IN_MONTH;
}

function emptyBucket(
  workerId,
  name,
  basicSalary,
  hasInss,
  almoco,
  debtBalance
) {
  return {
    workerId,
    name,

    // رصيد السلفة/الدين المتبقي على العامل (بيفضل زي ما هو
    // لحد ما يتسدد بالكامل، مش بيتصفر لوحده كل شهر).
    debtBalance: Number(debtBalance) || 0,

    // المرتب الأساسي
    basicSalary: Number(basicSalary) || 0,

    // موجود للتوافق مع الأجزاء القديمة من الموقع
    monthlyWage: Number(basicSalary) || 0,

    // اليومية
    //
    // لو العامل عنده ALMOCO: اليومية = (الأساسي + ALMOCO) ÷ 30
    // لو مفيش ALMOCO: اليومية = الأساسي ÷ 30 بس
    //
    // يعني ALMOCO بقى بيتحسب باليوم زي الأساسي بالظبط —
    // يوم غياب أو نص يوم بيأثر عليه هو كمان، مش بيتدفع كامل
    // ثابت زي الأول.
    dailyWage: dailyWageFromMonthly(
      (Number(basicSalary) || 0) + (Number(almoco) || 0)
    ),

    // بدل الأكل
    almoco: Number(almoco) || 0,

    // الضمان الاجتماعي
    hasInss: !!hasInss,

    // أيام الحضور
    fullDays: 0,
    halfDays: 0,
    offDaysWorked: 0,

    // الإجازات الأسبوعية المدفوعة
    paidHolidayDays: 0,

    // أيام الغياب (من غير عذر) في الشهر
    absentDays: 0,

    // الأساسي المستحق
    gross: 0,

    // الخصومات
    deductionsTotal: 0,

    // السلف / المصروفات
    expensesTotal: 0,

    // INSS
    inss: 0,

    // الأساسي + Almoco
    totalBeforeDeductions: 0,

    // الصافي
    net: 0,
  };
}

// بناء كشف المرتبات لكل العمال الحاليين.
//
// مهم جدًا:
// monthKey = الشهر المختار في كشف المرتبات.
//
// لو لم يتم تمريره من مكان قديم في الموقع
// نستخدم الشهر الحالي تلقائيًا.
export function buildPayrollSummaries(
  workers,
  records,
  deductions,
  expenses,
  schedule,
  monthKey = todayKey().slice(0, 7)
) {
  const byWorker = {};
  const startDateByWorker = {};
  const workerById = {};

  // --------------------------------------------------
  // إنشاء كشف للعمال الموجودين حاليًا فقط
  // --------------------------------------------------
  for (const w of workers) {
    byWorker[w.id] = emptyBucket(
      w.id,
      w.name,
      w.wage || 0,
      w.hasInss,
      w.almoco || 0,
      w.debtBalance || 0
    );

    startDateByWorker[w.id] = w.startDate || null;
    workerById[w.id] = w;
  }

  // --------------------------------------------------
  // Attendance
  // --------------------------------------------------
  //
  // IMPORTANT:
  // لا نضيف أي عامل جديد هنا.
  //
  // السبب:
  // لو عامل اتحذف من workers لكن عنده سجل حضور قديم،
  // الكود القديم كان بيضيفه للكشف باسم "عامل سابق".
  //
  // وده كان ممكن يعمل:
  // الموقع = 20 عامل
  // كشف المرتبات = 21 عامل
  //
  // دلوقتي الكشف يعتمد على workers الحاليين فقط.
  // --------------------------------------------------
  for (const r of records) {
    if (!r.checkIn) {
      continue;
    }

    // السجل تابع لعامل اتحذف:
    // تجاهله ولا تضيف صف جديد.
    if (!byWorker[r.workerId]) {
      continue;
    }

    const workerStartDate =
      startDateByWorker[r.workerId];

    // لا نحسب حضور قبل تاريخ بداية العامل.
    if (
      workerStartDate &&
      r.dateKey &&
      r.dateKey < workerStartDate
    ) {
      continue;
    }

    const bucket = byWorker[r.workerId];

    const type = dayType(
      r.dateKey,
      schedule
    );

    if (type === "half") {
      bucket.halfDays += 1;
    } else if (type === "off") {
      bucket.offDaysWorked += 1;
    } else {
      bucket.fullDays += 1;
    }
  }

  // --------------------------------------------------
  // Deductions
  // --------------------------------------------------
  //
  // الخصم يدخل فقط للعامل الموجود حاليًا.
  // --------------------------------------------------
  for (const d of deductions) {
    if (!byWorker[d.workerId]) {
      continue;
    }

    const workerStartDate =
      startDateByWorker[d.workerId];

    // لا نحسب خصم قبل بداية العامل.
    if (
      workerStartDate &&
      d.dateKey &&
      d.dateKey < workerStartDate
    ) {
      continue;
    }

    byWorker[d.workerId].deductionsTotal +=
      Number(d.amount) || 0;
  }

  // --------------------------------------------------
  // Expenses / Advances
  // --------------------------------------------------
  //
  // السلف والمصروفات للعامل الحالي فقط.
  // --------------------------------------------------
  for (const e of expenses) {
    if (!byWorker[e.workerId]) {
      continue;
    }

    const workerStartDate =
      startDateByWorker[e.workerId];

    // لا نحسب سلفة/مصروف قبل بداية العامل.
    if (
      workerStartDate &&
      e.dateKey &&
      e.dateKey < workerStartDate
    ) {
      continue;
    }

    byWorker[e.workerId].expensesTotal +=
      Number(e.amount) || 0;
  }

  // --------------------------------------------------
  // Final calculations
  // --------------------------------------------------
  for (const [workerId, b] of Object.entries(byWorker)) {
    const wasActiveThisMonth =
      b.fullDays +
        b.halfDays +
        b.offDaysWorked >
      0;

    const startDate =
      startDateByWorker[workerId];

    // لو العامل بدأ في نفس الشهر،
    // نحسب الإجازات المدفوعة من يوم بدايته فقط.
    const fromDateKey =
      startDate &&
      monthKey &&
      startDate.startsWith(monthKey)
        ? startDate
        : null;

    b.paidHolidayDays = wasActiveThisMonth
      ? countScheduledOffDaysInMonth(
          schedule,
          monthKey,
          fromDateKey
        )
      : 0;

    // ------------------------------------------------
    // أيام الغياب
    // ------------------------------------------------
    //
    // بتتحسب دايمًا (حتى لو العامل ما جاش يشتغل خالص
    // في الشهر ده)، عشان تظهر في الكشف صح.
    // ------------------------------------------------
    b.absentDays = computeAbsenceDays(
      workerById[workerId],
      records,
      schedule,
      monthKey
    ).absentDays;

    // ------------------------------------------------
    // الأساسي المستحق
    // ------------------------------------------------
    //
    // يوم كامل = يومية كاملة
    // نص يوم = نصف اليومية
    // السبت = يوم كامل
    // الإجازة الأسبوعية = يوم كامل مدفوع
    // ------------------------------------------------
    b.gross =
      b.fullDays * b.dailyWage +
      b.halfDays * (b.dailyWage / 2) +
      b.offDaysWorked * b.dailyWage +
      b.paidHolidayDays * b.dailyWage;

    // ------------------------------------------------
    // الضمان الاجتماعي
    // ------------------------------------------------
    //
    // 3% من المرتب الأساسي فقط.
    // لا يدخل Almoco في حساب INSS.
    // ------------------------------------------------
    b.inss = b.hasInss
      ? b.basicSalary * INSS_RATE
      : 0;

    // ------------------------------------------------
    // الأساسي + بدل الأكل
    // ------------------------------------------------
    //
    // مبقاش بيتضاف هنا لوحده، لأن اليومية (b.dailyWage) بقت
    // أصلاً شاملة الأساسي + ALMOCO مع بعض، فـ b.gross
    // اتحسب بالفعل شامل الاتنين حسب الأيام الفعلية.
    // ------------------------------------------------
    b.totalBeforeDeductions = b.gross;

    // ------------------------------------------------
    // الصافي
    // ------------------------------------------------
    b.net =
      b.totalBeforeDeductions -
      b.deductionsTotal -
      b.expensesTotal -
      b.inss;
  }

  // --------------------------------------------------
  // ترتيب العمال بالاسم
  // --------------------------------------------------
  return Object.values(byWorker).sort(
    (a, b) =>
      (a.name || "").localeCompare(
        b.name || "",
        ["ar", "en"],
        {
          sensitivity: "base",
        }
      )
  );
}

// ----------------------------------------------------
// حساب أيام الغياب لعامل في شهر معين
// ----------------------------------------------------
//
// workDays:
// عدد أيام العمل اللي كان المفروض العامل يشتغلها.
//
// لو العامل اشتغل الشهر كامل من أول يوم فيه والشهر خلص فعلاً:
// workDays = 26 دايمًا (الشهر = 30 يوم ثابت: 26 شغل + 4 إجازة)،
// حتى لو كان الشهر في التقويم 28 يوم (فبراير) أو 31 يوم.
//
// لو العامل بدأ في نص الشهر، أو لسه إحنا في نفس الشهر الحالي
// وما خلصش، بنحسب workDays تناسبيًا من التقويم الحقيقي.
//
// attendedDays:
// عدد الأيام اللي سجل فيها حضور.
//
// absentDays:
// أيام العمل اللي لم يسجل فيها حضور.
//
// قواعد الحساب:
// 1. يبدأ من تاريخ بداية العامل.
// 2. لا يحسب الأيام المستقبلية في الشهر الحالي.
// 3. الأحد إذا كان إجازة لا يعتبر غياب.
// 4. السبت يوم عمل كامل.
// ----------------------------------------------------
export function computeAbsenceDays(
  worker,
  records,
  schedule,
  monthKey
) {
  if (!worker || !monthKey) {
    return {
      workDays: 0,
      attendedDays: 0,
      absentDays: 0,
    };
  }

  const [y, m] =
    monthKey.split("-").map(Number);

  const daysInMonth =
    daysInCalendarMonth(monthKey);

  const monthStartKey =
    `${monthKey}-01`;

  const monthEndKey =
    `${monthKey}-${String(
      daysInMonth
    ).padStart(2, "0")}`;

  // تاريخ بداية العامل
  const rangeStart =
    worker.startDate &&
    worker.startDate > monthStartKey
      ? worker.startDate
      : monthStartKey;

  // لو الشهر الحالي:
  // لا نحسب الأيام اللي لسه جايه كغياب.
  const currentMonthKey =
    todayKey().slice(0, 7);

  const rangeEnd =
    monthKey === currentMonthKey
      ? todayKey()
      : monthEndKey;

  if (rangeStart > rangeEnd) {
    return {
      workDays: 0,
      attendedDays: 0,
      absentDays: 0,
    };
  }

  // مجموعة بكل أيام حضور العامل في الشهر.
  const attendedSet = new Set(
    records
      .filter(
        (r) =>
          r.workerId === worker.id &&
          r.checkIn &&
          r.dateKey?.startsWith(monthKey) &&
          (!worker.startDate ||
            r.dateKey >= worker.startDate)
      )
      .map((r) => r.dateKey)
  );

  let realWorkDays = 0;
  let attendedDays = 0;

  for (
    let d = 1;
    d <= daysInMonth;
    d++
  ) {
    const dateKey =
      `${monthKey}-${String(d).padStart(
        2,
        "0"
      )}`;

    if (
      dateKey < rangeStart ||
      dateKey > rangeEnd
    ) {
      continue;
    }

    const weekday =
      new Date(
        y,
        m - 1,
        d
      ).getDay();

    // السبت = يوم عمل كامل.
    // لذلك لا نستثنيه حتى لو كان موجودًا بالخطأ
    // داخل offDays في الإعدادات القديمة.
    if (
      weekday !== 6 &&
      schedule?.offDays?.includes(
        weekday
      )
    ) {
      continue;
    }

    realWorkDays += 1;

    if (attendedSet.has(dateKey)) {
      attendedDays += 1;
    }
  }

  // هل العامل كان موجود من أول يوم في الشهر والشهر خلص فعلاً
  // (مش الشهر الحالي اللي لسه شغال)؟
  const isCurrentMonth =
    monthKey === currentMonthKey;

  const workedFullMonth =
    rangeStart === monthStartKey &&
    !isCurrentMonth;

  // لو اشتغل الشهر كامل: نستخدم الحصة الثابتة (26 يوم عمل)
  // بدل عدد أيام العمل الحقيقي في التقويم، عشان الشهر يتحسب
  // دايمًا على أساس 30 يوم زي بعضه.
  //
  // لو شهر جزئي (بداية في النص أو الشهر الحالي لسه ما خلصش):
  // نفضل نستخدم عدد أيام العمل الحقيقي حسب التقويم.
  const workDays = workedFullMonth
    ? STANDARD_WORK_DAYS_PER_MONTH
    : realWorkDays;

  return {
    workDays,
    attendedDays,
    absentDays: Math.max(
      0,
      workDays - attendedDays
    ),
  };
}