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
