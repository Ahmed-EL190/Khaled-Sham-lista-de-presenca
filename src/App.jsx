import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import OfflineBanner from "./components/OfflineBanner";
import Login from "./components/Login";
import DashboardView from "./components/DashboardView";
import WorkerCard from "./components/WorkerCard";
import OwnerWorkersManager from "./components/OwnerWorkersManager";
import SitesManager from "./components/SitesManager";
import ScheduleManager from "./components/ScheduleManager";
import HistoryView from "./components/HistoryView";
import ReportsView from "./components/ReportsView";
import PayrollView from "./components/PayrollView";
import LogsView from "./components/LogsView";
import DeductionForm from "./components/DeductionForm";
import ExpenseForm from "./components/ExpenseForm";
import LateAttendanceForm from "./components/LateAttendanceForm";
import SitePickerModal from "./components/SitePickerModal";
import { todayKey } from "./lib/format";
import { authReady } from "./firebase";
import {
  subscribeSites,
  addSite,
  updateSite,
  removeSite,
  subscribeWorkers,
  addWorker,
  updateWorker,
  removeWorker,
  purgeWorker,
  subscribeRecordsForDate,
  subscribeAllRecords,
  punchIn,
  punchOut,
  autoPunchOut,
  clearCheckOut,
  deleteRecord,
  subscribeSchedule,
  saveSchedule,
  subscribeDeductions,
  addDeduction,
  removeDeduction,
  updateDeduction,
  subscribeExpenses,
  addExpense,
  removeExpense,
  updateExpense,
  addLateRecord,
  subscribePayments,
  markSalaryPaid,
  markSalaryUnpaid,
} from "./lib/firestore";

// انصراف تلقائي: أي حد نسي يعمل انصراف بيتسجله الموقع أوتوماتيك بعد الساعة دي.
const AUTO_CHECKOUT_HOUR = 17;
const AUTO_CHECKOUT_MINUTE = 30;

const FOREMAN_TABS = [
  { id: "today", label: "اليوم" },
  { id: "history", label: "السجل" },
  { id: "reports", label: "التقارير" },
  { id: "late", label: "تسجيل متأخر" },
  { id: "deduction", label: "تسجيل خصم" },
  { id: "expense", label: "تسجيل مصروف" },
];

const OWNER_TABS = [
  { id: "dashboard", label: "الرئيسية" },
  { id: "today", label: "اليوم" },
  { id: "history", label: "السجل" },
  { id: "reports", label: "التقارير" },
  { id: "payroll", label: "الرواتب" },
  { id: "logs", label: "الخصومات والمصروفات" },
  { id: "manage", label: "الإدارة" },
];

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [session, setSession] = useState(null);
  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [schedule, setSchedule] = useState({ offDays: [0], halfDays: [] });
  const [deductions, setDeductions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const [pendingWorkerId, setPendingWorkerId] = useState(null);
  const [checkoutMode, setCheckoutMode] = useState(false);

  const today = todayKey();
  const isOwner = session?.role === "owner";
  const scopeSiteId = isOwner ? null : session?.siteId || null;
  const searchTerm = search.trim();

  useEffect(() => {
    authReady.then(() => setAuthed(true));
  }, []);

  useEffect(() => {
    if (!authed) return;
    const unsub = subscribeSites(setSites);
    return unsub;
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    const unsub = subscribeSchedule(setSchedule);
    return unsub;
  }, [authed]);

  useEffect(() => {
    if (!authed || !session) return;
    const unsubWorkers = subscribeWorkers(setWorkers);
    const unsubToday = subscribeRecordsForDate(today, setTodayRecords);
    const unsubAll = subscribeAllRecords(scopeSiteId, setAllRecords);
    const unsubDeductions = subscribeDeductions(scopeSiteId, setDeductions);
    const unsubExpenses = subscribeExpenses(scopeSiteId, setExpenses);
    const unsubPayments = subscribePayments(setPayments);
    return () => {
      unsubWorkers();
      unsubToday();
      unsubAll();
      unsubDeductions();
      unsubExpenses();
      unsubPayments();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, session, scopeSiteId, today, isOwner]);
  // انصراف تلقائي بعد الساعة 5:30 مساءً لأي عامل حضر ونسي يعمل انصراف.
  // بيتفحص فور فتح الموقع، وبعدين كل دقيقة، طول ما الموقع فاتح عند حد.
  useEffect(() => {
    if (!authed || !session) return;

    function runAutoCheckout() {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setHours(AUTO_CHECKOUT_HOUR, AUTO_CHECKOUT_MINUTE, 0, 0);
      if (now < cutoff) return;

      const cutoffIso = cutoff.toISOString();
      todayRecords
        .filter((r) => r.checkIn && !r.checkOut)
        .forEach((r) => {
          autoPunchOut({
            dateKey: today,
            workerId: r.workerId,
            checkOutAt: cutoffIso,
          });
        });
    }

    runAutoCheckout();
    const interval = setInterval(runAutoCheckout, 60 * 1000);
    return () => clearInterval(interval);
  }, [authed, session, todayRecords, today]);

  const todayByWorker = useMemo(() => {
    const map = {};
    for (const r of todayRecords) map[r.workerId] = r;
    return map;
  }, [todayRecords]);

  const presentCount = todayRecords.filter(
    (r) => r.checkIn && !r.checkOut,
  ).length;

  const filteredWorkers = useMemo(
    () =>
      workers.filter(
        (w) =>
          !searchTerm ||
          w.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [workers, searchTerm],
  );

  // ---- وضع الانصراف: بس العمال اللي سجلوا حضور في ورشة الفورمان النهاردة ولسه ما خرجوش ----
  const presentAtMySite = useMemo(
    () =>
      todayRecords.filter(
        (r) => r.siteId === scopeSiteId && r.checkIn && !r.checkOut,
      ),
    [todayRecords, scopeSiteId],
  );

  const filteredPresentAtMySite = useMemo(
    () =>
      presentAtMySite.filter(
        (r) =>
          !searchTerm ||
          (r.workerName || "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [presentAtMySite, searchTerm],
  );

  function handleLogin(newSession) {
    setSession(newSession);
    setTab(newSession.role === "owner" ? "dashboard" : "today");
    setSearch("");
    setCheckoutMode(false);
  }

  function handleLogout() {
    setSession(null);
    setCheckoutMode(false);
  }

  function handlePunch(workerId) {
    const worker = workers.find((w) => w.id === workerId);
    const entry = todayByWorker[workerId];
    if (!worker) return;

    if (entry?.checkIn && !entry?.checkOut) {
      punchOut({ dateKey: today, workerId });
      return;
    }
    if (entry?.checkIn) return; // خلص يومه، لو غلط استخدم "تصحيح"

    if (sites.length <= 1) {
      const site = sites[0];
      punchIn({
        dateKey: today,
        workerId,
        workerName: worker.name,
        siteId: site?.id || session.siteId,
        siteName: site?.name || session.siteName,
      });
    } else {
      setPendingWorkerId(workerId);
    }
  }

  function confirmSitePick(siteId) {
    const site = sites.find((s) => s.id === siteId);
    const worker = workers.find((w) => w.id === pendingWorkerId);
    if (site && worker) {
      punchIn({
        dateKey: today,
        workerId: worker.id,
        workerName: worker.name,
        siteId: site.id,
        siteName: site.name,
      });
    }
    setPendingWorkerId(null);
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

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-out">
        بيتم التحميل...
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <OfflineBanner />
        <Login sites={sites} onLogin={handleLogin} />
      </>
    );
  }

  const tabs = isOwner ? OWNER_TABS : FOREMAN_TABS;
  const siteLabel = isOwner ? "كل الورش" : session.siteName;

  const pendingWorkers = workers
    .filter((w) => !todayRecords.some((r) => r.workerId === w.id))
    .filter(
      (w) =>
        !searchTerm || w.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  return (
    <div className="min-h-screen">
      <Header
        presentCount={presentCount}
        totalCount={workers.length}
        siteLabel={siteLabel}
        onLogout={handleLogout}
      />
      <OfflineBanner />

      {pendingWorkerId && (
        <SitePickerModal
          sites={sites}
          defaultSiteId={session.siteId}
          workerName={workers.find((w) => w.id === pendingWorkerId)?.name || ""}
          onConfirm={confirmSitePick}
          onCancel={() => setPendingWorkerId(null)}
        />
      )}

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-5 sm:py-6">
        <nav className="mb-5 flex w-fit flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                tab === t.id ? "bg-ink text-white" : "text-out hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "dashboard" && isOwner && (
          <DashboardView
            workers={workers}
            sites={sites}
            todayRecords={todayRecords}
            allRecords={allRecords}
            deductions={deductions}
            expenses={expenses}
            schedule={schedule}
            onGoToToday={() => setTab("today")}
            onGoToPayroll={() => setTab("payroll")}
          />
        )}

        {tab === "today" && !isOwner && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="دور على اسم عامل..."
                className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-steel sm:max-w-xs"
              />
              <div className="flex rounded-lg border border-line bg-white p-1">
                <button
                  onClick={() => setCheckoutMode(false)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    !checkoutMode ? "bg-ink text-white" : "text-out hover:text-ink"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setCheckoutMode(true)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    checkoutMode ? "bg-ink text-white" : "text-out hover:text-ink"
                  }`}
                >
                  انصراف ({presentAtMySite.length})
                </button>
              </div>
            </div>

            {checkoutMode ? (
              presentAtMySite.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-white/60 py-14 text-center text-sm text-out">
                  مفيش حد لسه في الورشة محتاج انصراف
                </div>
              ) : filteredPresentAtMySite.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-white/60 py-14 text-center text-sm text-out">
                  مفيش عامل بالاسم ده
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {filteredPresentAtMySite.map((r) => (
                    <WorkerCard
                      key={r.workerId}
                      worker={{ id: r.workerId, name: r.workerName }}
                      entry={r}
                      onPunch={handlePunch}
                      onReset={handleReset}
                    />
                  ))}
                </div>
              )
            ) : workers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-white/60 py-14 text-center text-sm text-out">
                لسه مفيش عمال متضافين، كلم صاحب الشركة يضيفهم
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-white/60 py-14 text-center text-sm text-out">
                مفيش عامل بالاسم ده
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {filteredWorkers.map((worker) => (
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="دور على اسم عامل..."
              className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-steel sm:max-w-xs"
            />

            {sites.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-white/60 py-14 text-center text-sm text-out">
                لسه مفيش ورش مضافة
              </div>
            )}

            {sites.map((site) => {
              const siteRecords = todayRecords
                .filter((r) => r.siteId === site.id)
                .filter(
                  (r) =>
                    !searchTerm ||
                    (r.workerName || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                );
              const sitePresent = siteRecords.filter(
                (r) => r.checkIn && !r.checkOut,
              ).length;
              return (
                <div key={site.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-ink">{site.name}</h2>
                    <span className="tabular rounded-full bg-mist px-2.5 py-1 text-xs font-bold text-steel">
                      {sitePresent} في الورشة دلوقتي
                    </span>
                  </div>
                  {siteRecords.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-line bg-white/60 px-4 py-3 text-xs text-out">
                      محدش سجل حضور في الورشة دي النهاردة
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                      {siteRecords.map((r) => (
                        <WorkerCard
                          key={r.workerId}
                          worker={{ id: r.workerId, name: r.workerName }}
                          entry={r}
                          readOnly
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {pendingWorkers.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-bold text-ink">
                  لسه ما جوش النهاردة
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {pendingWorkers.map((w) => (
                    <WorkerCard key={w.id} worker={w} entry={null} readOnly />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <HistoryView
            records={allRecords}
            todayKey={today}
            onDelete={({ dateKey, workerId }) =>
              deleteRecord({ dateKey, workerId })
            }
          />
        )}

        {tab === "reports" && (
          <ReportsView
            workers={workers}
            sites={
              isOwner ? sites : [{ id: session.siteId, name: session.siteName }]
            }
            records={allRecords}
            deductions={deductions}
            expenses={expenses}
            schedule={schedule}
            canPurge={isOwner}
            onPurgeWorker={purgeWorker}
            onRemoveDeduction={removeDeduction}
            onRemoveExpense={removeExpense}
          />
        )}

        {tab === "payroll" && isOwner && (
          <PayrollView
            workers={workers}
            records={allRecords}
            deductions={deductions}
            expenses={expenses}
            schedule={schedule}
            payments={payments}
            onMarkPaid={markSalaryPaid}
            onMarkUnpaid={markSalaryUnpaid}
            onUpdateWorker={updateWorker}
            onAddDeduction={addDeduction}
            onRemoveDeduction={removeDeduction}
            onAddExpense={addExpense}
            onRemoveExpense={removeExpense}
            onAddAttendance={(r) =>
              addLateRecord({
                ...r,
                checkIn: r.checkIn || new Date().toISOString(),
              })
            }
            onRemoveAttendance={deleteRecord}
          />
        )}

        {tab === "logs" && isOwner && (
          <LogsView
            deductions={deductions}
            expenses={expenses}
            onRemoveDeduction={removeDeduction}
            onUpdateDeduction={updateDeduction}
            onRemoveExpense={removeExpense}
            onUpdateExpense={updateExpense}
          />
        )}

        {tab === "late" && !isOwner && (
          <LateAttendanceForm
            workers={workers}
            onSubmit={(r) =>
              addLateRecord({
                ...r,
                siteId: session.siteId,
                siteName: session.siteName,
              })
            }
          />
        )}

        {tab === "deduction" && !isOwner && (
          <DeductionForm
            workers={workers}
            deductions={deductions}
            onSubmit={(d) =>
              addDeduction({
                ...d,
                siteId: session.siteId,
                siteName: session.siteName,
              })
            }
            onRemoveDeduction={removeDeduction}
            onUpdateDeduction={updateDeduction}
          />
        )}

        {tab === "expense" && !isOwner && (
          <ExpenseForm
            workers={workers}
            expenses={expenses}
            onSubmit={(e) =>
              addExpense({
                ...e,
                siteId: session.siteId,
                siteName: session.siteName,
              })
            }
            onRemoveExpense={removeExpense}
            onUpdateExpense={updateExpense}
          />
        )}

        {tab === "manage" && isOwner && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SitesManager
                sites={sites}
                onAdd={(name, pin) => addSite({ name, pin })}
                onRemove={removeSite}
                onUpdate={updateSite}
              />
              <ScheduleManager schedule={schedule} onChange={saveSchedule} />
            </div>
            <OwnerWorkersManager
              workers={workers}
              records={allRecords}
              schedule={schedule}
              onAdd={(name, wage, almoco, startDate) =>
                addWorker({ name, wage, almoco, startDate })
              }
              onRemove={removeWorker}
              onPurge={purgeWorker}
              onUpdate={updateWorker}
              onAddDeduction={(d) =>
                addDeduction({
                  ...d,
                  siteId: null,
                  siteName: null,
                })
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}