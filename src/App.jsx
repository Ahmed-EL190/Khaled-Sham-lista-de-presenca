import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Login from "./components/Login";
import WorkerCard from "./components/WorkerCard";
import ListManager from "./components/ListManager";
import SitesManager from "./components/SitesManager";
import HistoryView from "./components/HistoryView";
import ReportsView from "./components/ReportsView";
import { todayKey } from "./lib/format";
import {
  subscribeSites,
  addSite,
  removeSite,
  subscribeWorkers,
  addWorker,
  removeWorker,
  subscribeRecordsForDate,
  subscribeAllRecords,
  punchIn,
  punchOut,
  clearCheckOut,
  deleteRecord,
} from "./lib/firestore";

const SESSION_KEY = "khs_session";

const FOREMAN_TABS = [
  { id: "today", label: "اليوم" },
  { id: "history", label: "السجل" },
  { id: "reports", label: "التقارير" },
  { id: "manage", label: "الإدارة" },
];

const OWNER_TABS = [
  { id: "today", label: "اليوم" },
  { id: "history", label: "السجل" },
  { id: "reports", label: "التقارير" },
  { id: "manage", label: "الورش" },
];

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [tab, setTab] = useState("today");

  const today = todayKey();
  const isOwner = session?.role === "owner";
  const scopeSiteId = isOwner ? null : session?.siteId || null;

  // sites are needed for login matching regardless of session state
  useEffect(() => {
    const unsub = subscribeSites(setSites);
    return unsub;
  }, []);

  useEffect(() => {
    if (!session) return;
    const unsubWorkers = subscribeWorkers(scopeSiteId, setWorkers);
    const unsubToday = subscribeRecordsForDate(today, scopeSiteId, setTodayRecords);
    const unsubAll = subscribeAllRecords(scopeSiteId, setAllRecords);
    return () => {
      unsubWorkers();
      unsubToday();
      unsubAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, scopeSiteId, today]);

  const todayByWorker = useMemo(() => {
    const map = {};
    for (const r of todayRecords) map[r.workerId] = r;
    return map;
  }, [todayRecords]);

  const presentCount = todayRecords.filter((r) => r.checkIn).length;

  function handleLogin(newSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
    setTab("today");
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  function handlePunch(workerId) {
    const worker = workers.find((w) => w.id === workerId);
    const entry = todayByWorker[workerId];
    if (!worker) return;

    if (!entry?.checkIn) {
      punchIn({
        dateKey: today,
        workerId,
        workerName: worker.name,
        siteId: session.siteId,
        siteName: session.siteName,
      });
    } else if (entry.checkIn && !entry.checkOut) {
      punchOut({ dateKey: today, workerId });
    }
  }

  function handleReset(workerId) {
    const entry = todayByWorker[workerId];
    if (!entry) return;
    if (entry.checkOut) {
      clearCheckOut({ dateKey: today, workerId });
    } else {
      deleteRecord({ dateKey: today, workerId });
    }
  }

  if (!session) {
    return <Login sites={sites} onLogin={handleLogin} />;
  }

  const tabs = isOwner ? OWNER_TABS : FOREMAN_TABS;
  const siteLabel = isOwner ? "كل الورش" : session.siteName;

  return (
    <div className="min-h-screen">
      <Header
        presentCount={presentCount}
        totalCount={workers.length}
        siteLabel={siteLabel}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-5xl px-5 py-6">
        <nav className="mb-5 inline-flex w-fit rounded-lg border border-line bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                tab === t.id ? "bg-ink text-white" : "text-out hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "today" && !isOwner && (
          <>
            {workers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-white/60 py-14 text-center">
                <p className="text-sm text-out">لسه مفيش عمال مضافين في الورشة دي</p>
                <button
                  onClick={() => setTab("manage")}
                  className="mt-3 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
                >
                  إضافة عمال
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {workers.map((worker) => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    entry={todayByWorker[worker.id]}
                    onPunch={handlePunch}
                    onReset={handleReset}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "today" && isOwner && (
          <div className="flex flex-col gap-6">
            {sites.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-white/60 py-14 text-center text-sm text-out">
                لسه مفيش ورش مضافة
              </div>
            )}
            {sites.map((site) => {
              const siteWorkers = workers.filter((w) => w.siteId === site.id);
              const sitePresent = todayRecords.filter(
                (r) => r.siteId === site.id && r.checkIn
              ).length;
              return (
                <div key={site.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-ink">{site.name}</h2>
                    <span className="tabular rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-steel">
                      {sitePresent}/{siteWorkers.length} حاضر
                    </span>
                  </div>
                  {siteWorkers.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-line bg-white/60 px-4 py-3 text-xs text-out">
                      مفيش عمال مضافين للورشة دي
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {siteWorkers.map((worker) => (
                        <WorkerCard
                          key={worker.id}
                          worker={worker}
                          entry={todayByWorker[worker.id]}
                          readOnly
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "history" && <HistoryView records={allRecords} todayKey={today} />}

        {tab === "reports" && (
          <ReportsView
            workers={workers}
            sites={isOwner ? sites : [{ id: session.siteId, name: session.siteName }]}
            records={allRecords}
          />
        )}

        {tab === "manage" && !isOwner && (
          <ListManager
            title="العمال"
            placeholder="اسم العامل"
            items={workers}
            onAdd={(name) => addWorker({ name, siteId: session.siteId })}
            onRemove={removeWorker}
          />
        )}

        {tab === "manage" && isOwner && (
          <SitesManager
            sites={sites}
            onAdd={(name, pin) => addSite({ name, pin })}
            onRemove={removeSite}
          />
        )}
      </main>
    </div>
  );
}
