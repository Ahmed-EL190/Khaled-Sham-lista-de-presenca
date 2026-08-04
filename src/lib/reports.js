// records: flat array of { dateKey, workerId, workerName, siteId, siteName, checkIn, checkOut }

export function buildWorkerSummaries(workers, records) {
  const byWorker = {};
  for (const w of workers) {
    byWorker[w.id] = { workerId: w.id, name: w.name, totalDays: 0, sites: {} };
  }

  for (const r of records) {
    if (!r.checkIn) continue;
    if (!byWorker[r.workerId]) {
      byWorker[r.workerId] = {
        workerId: r.workerId,
        name: r.workerName || "عامل سابق",
        totalDays: 0,
        sites: {},
      };
    }
    const bucket = byWorker[r.workerId];
    bucket.totalDays += 1;
    const siteName = r.siteName || "بدون ورشة";
    bucket.sites[siteName] = (bucket.sites[siteName] || 0) + 1;
  }

  return Object.values(byWorker).sort((a, b) => b.totalDays - a.totalDays);
}

// Groups a site's activity day by day (instead of one aggregate total), and folds
// in that day's deductions + expenses so both show up next to the attendance.
// Returns: [{ siteId, name, totalDays, totalDeductions, totalExpenses,
//             days: [{ dateKey, workers: [...records], deductions: [...], expenses: [...],
//                       dayDeductionsTotal, dayExpensesTotal }] }]
export function buildSiteDailyReports(sites, records, deductions = [], expenses = []) {
  const bySite = {};

  function bucketFor(siteId, siteName) {
    const key = siteId || "none";
    if (!bySite[key]) {
      bySite[key] = {
        siteId: key,
        name: siteName || "بدون ورشة",
        totalDays: 0,
        totalDeductions: 0,
        totalExpenses: 0,
        daysMap: {},
      };
    }
    return bySite[key];
  }

  for (const s of sites) bucketFor(s.id, s.name);

  function dayFor(bucket, dateKey) {
    if (!bucket.daysMap[dateKey]) {
      bucket.daysMap[dateKey] = {
        dateKey,
        workers: [],
        deductions: [],
        expenses: [],
        dayDeductionsTotal: 0,
        dayExpensesTotal: 0,
      };
    }
    return bucket.daysMap[dateKey];
  }

  for (const r of records) {
    if (!r.checkIn) continue;
    const bucket = bucketFor(r.siteId, r.siteName);
    bucket.totalDays += 1;
    dayFor(bucket, r.dateKey).workers.push(r);
  }

  for (const d of deductions) {
    if (!d.dateKey) continue;
    const bucket = bucketFor(d.siteId, d.siteName);
    bucket.totalDeductions += d.amount || 0;
    const day = dayFor(bucket, d.dateKey);
    day.deductions.push(d);
    day.dayDeductionsTotal += d.amount || 0;
  }

  for (const e of expenses) {
    if (!e.dateKey) continue;
    const bucket = bucketFor(e.siteId, e.siteName);
    bucket.totalExpenses += e.amount || 0;
    const day = dayFor(bucket, e.dateKey);
    day.expenses.push(e);
    day.dayExpensesTotal += e.amount || 0;
  }

  return Object.values(bySite)
    .map((bucket) => ({
      siteId: bucket.siteId,
      name: bucket.name,
      totalDays: bucket.totalDays,
      totalDeductions: bucket.totalDeductions,
      totalExpenses: bucket.totalExpenses,
      days: Object.values(bucket.daysMap).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)),
    }))
    .filter((bucket) => bucket.days.length > 0)
    .sort((a, b) => b.totalDays - a.totalDays);
}

export function buildSiteSummaries(sites, records) {
  const bySite = {};
  for (const s of sites) {
    bySite[s.id] = { siteId: s.id, name: s.name, totalDays: 0, workers: {} };
  }

  for (const r of records) {
    if (!r.checkIn) continue;
    const siteId = r.siteId || "none";
    if (!bySite[siteId]) {
      bySite[siteId] = { siteId, name: r.siteName || "بدون ورشة", totalDays: 0, workers: {} };
    }
    const bucket = bySite[siteId];
    bucket.totalDays += 1;
    const workerName = r.workerName || "عامل";
    bucket.workers[workerName] = (bucket.workers[workerName] || 0) + 1;
  }

  return Object.values(bySite).sort((a, b) => b.totalDays - a.totalDays);
}