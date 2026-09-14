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
  subscribeBudgetEntries,
  addBudgetEntry,
  updateBudgetEntry,
  removeBudgetEntry,
  subscribeBudgetPlans,
  saveBudgetPlan,
  removeBudgetPlan,
} from "./lib/firestore";
import BudgetView from "./components/BudgetView";

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
  { id: "budget", label: "الميزانية" },
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
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [budgetPlans, setBudgetPlans] = useState([]);
  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const [pendingWorkerId, setPendingWorkerId] = useState(null);
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [isTabsOpen, setIsTabsOpen] = useState(false);

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
    const unsubBudgetEntries = isOwner
      ? subscribeBudgetEntries(setBudgetEntries)
      : () => {};
    const unsubBudgetPlans = isOwner
      ? subscribeBudgetPlans(setBudgetPlans)
      : () => {};
    return () => {
      unsubWorkers();
      unsubToday();
      unsubAll();
      unsubDeductions();
      unsubExpenses();
      unsubPayments();
      unsubBudgetEntries();
      unsubBudgetPlans();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, session, scopeSiteId, today, isOwner]);

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
    setIsTabsOpen(false);
  }

  function handleLogout() {
    setSession(null);
    setCheckoutMode(false);
    setIsTabsOpen(false);
  }

  const [lastBulkCheckout, setLastBulkCheckout] = useState(null); // { workerIds: string[] }

  function handleCheckoutAllPresent() {
    const present = todayRecords.filter((r) => r.checkIn && !r.checkOut);
    present.forEach((r) => {
      punchOut({ dateKey: today, workerId: r.workerId });
    });
    setLastBulkCheckout({ workerIds: present.map((r) => r.workerId) });
  }

  function handleUndoBulkCheckout() {
    if (!lastBulkCheckout) return;
    lastBulkCheckout.workerIds.forEach((workerId) => {
      clearCheckOut({ dateKey: today, workerId });
    });
    setLastBulkCheckout(null);
  }

  function handlePunch(workerId) {
    const worker = workers.find((w) => w.id === workerId);
    const entry = todayByWorker[workerId];
    if (!worker) return;

    if (entry?.checkIn && !entry?.checkOut) {
      punchOut({ dateKey: today, workerId });
      return;
    }
    if (entry?.checkIn) return;

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

  const getTabIcon = (id) => {
    const icons = {
      dashboard: "🏠",
      today: "📅",
      history: "📋",
      reports: "📊",
      payroll: "💰",
      budget: "💼",
      logs: "📝",
      manage: "⚙️",
      late: "⏰",
      deduction: "➖",
      expense: "💳",
    };
    return icons[id] || "•";
  };

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
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
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

      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-5 sm:py-6">
        {/* التبويبات - تصميم محسن للشاشات الكبيرة والموبايل */}
        <nav className="mb-4 sm:mb-5">
          {/* نسخة الموبايل - قائمة منسدلة */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsTabsOpen(!isTabsOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm"
            >
              <span className="flex items-center gap-2">
                <span>{getTabIcon(tab)}</span>
                <span>
                  {tabs.find((t) => t.id === tab)?.label || "القائمة"}
                </span>
              </span>
              <svg
                className={`h-5 w-5 transition-transform duration-200 ${
                  isTabsOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 9l6 6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isTabsOpen && (
              <div className="absolute z-20 mt-1 w-[calc(100%-24px)] rounded-lg border border-line bg-white shadow-xl">
                {tabs.map((t, index) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id);
                      setIsTabsOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-right text-sm font-semibold transition ${
                      tab === t.id
                        ? "bg-ink text-white"
                        : "text-ink hover:bg-mist/50"
                    } ${index !== tabs.length - 1 ? "border-b border-line" : ""}`}
                  >
                    <span className="text-lg">{getTabIcon(t.id)}</span>
                    <span>{t.label}</span>
                    {tab === t.id && (
                      <span className="mr-auto text-white">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* نسخة الشاشات الكبيرة - تبويبات متجاوبة وجميلة */}
          <div className="hidden sm:block">
            <div className="flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-line/60 bg-white/80 p-1.5 shadow-sm backdrop-blur-sm">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`group relative rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    tab === t.id
                      ? "bg-linear-to-r from-ink to-gray-800 text-white shadow-lg shadow-ink/20"
                      : "text-out hover:text-ink hover:bg-mist/50"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-base">{getTabIcon(t.id)}</span>
                    <span>{t.label}</span>
                  </span>
                  {tab === t.id && (
                    <span className="absolute inset-0 rounded-xl bg-linear-to-r from-ink to-gray-800 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  )}
                </button>
              ))}
            </div>
          </div>
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
            onCheckoutAll={handleCheckoutAllPresent}
            canUndoCheckoutAll={!!lastBulkCheckout}
            onUndoCheckoutAll={handleUndoBulkCheckout}
          />
        )}

        {tab === "today" && !isOwner && (
          <>
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="دور على اسم عامل..."
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-steel sm:max-w-xs sm:px-4"
              />
              <div className="flex w-full rounded-lg border border-line bg-white p-1 sm:w-auto">
                <button
                  onClick={() => setCheckoutMode(false)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition sm:flex-none sm:px-3 sm:text-sm ${
                    !checkoutMode
                      ? "bg-ink text-white"
                      : "text-out hover:text-ink"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setCheckoutMode(true)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition sm:flex-none sm:px-3 sm:text-sm ${
                    checkoutMode
                      ? "bg-ink text-white"
                      : "text-out hover:text-ink"
                  }`}
                >
                  انصراف ({presentAtMySite.length})
                </button>
              </div>
            </div>

            {checkoutMode ? (
              presentAtMySite.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-white/60 py-12 text-center text-sm text-out sm:py-14">
                  مفيش حد لسه في الورشة محتاج انصراف
                </div>
              ) : filteredPresentAtMySite.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-white/60 py-12 text-center text-sm text-out sm:py-14">
                  مفيش عامل بالاسم ده
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
              <div className="rounded-xl border border-dashed border-line bg-white/60 py-12 text-center text-sm text-out sm:py-14">
                لسه مفيش عمال متضافين، كلم صاحب الشركة يضيفهم
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-white/60 py-12 text-center text-sm text-out sm:py-14">
                مفيش عامل بالاسم ده
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
          <div className="flex flex-col gap-4 sm:gap-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="دور على اسم عامل..."
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-steel sm:max-w-xs sm:px-4"
            />

            {sites.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-white/60 py-12 text-center text-sm text-out sm:py-14">
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
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                    <h2 className="text-sm font-bold text-ink sm:text-base">
                      {site.name}
                    </h2>
                    <span className="tabular rounded-full bg-mist px-2 py-1 text-xs font-bold text-steel sm:px-2.5">
                      {sitePresent} في الورشة
                    </span>
                  </div>
                  {siteRecords.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-line bg-white/60 px-3 py-3 text-xs text-out sm:px-4">
                      محدش سجل حضور في الورشة دي النهاردة
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                <h2 className="mb-2 text-sm font-bold text-ink sm:text-base">
                  لسه ما جوش النهاردة
                </h2>
                <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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

        {tab === "budget" && isOwner && (
          <BudgetView
            entries={budgetEntries}
            plans={budgetPlans}
            onAddEntry={addBudgetEntry}
            onUpdateEntry={updateBudgetEntry}
            onRemoveEntry={removeBudgetEntry}
            onSavePlan={saveBudgetPlan}
            onRemovePlan={removeBudgetPlan}
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
          <div className="flex flex-col gap-4 sm:gap-6">
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
