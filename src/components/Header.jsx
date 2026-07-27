import { useEffect, useState } from "react";
import logo from "../assets/logo.png";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Header({ presentCount, totalCount, siteLabel, onLogout }) {
  const now = useClock();
  const time = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b border-line bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="خالد شام للإنشاءات" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-ink sm:text-2xl">
              سجل حضور العمال
            </h1>
            <p className="text-xs font-medium text-steel">{siteLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left sm:text-right">
            <p className="tabular text-lg font-semibold text-ink sm:text-xl">{time}</p>
            <p className="text-xs text-out">{date}</p>
          </div>
          <div className="hidden h-10 w-px bg-line sm:block" />
          <div className="rounded-lg bg-mist px-3 py-2 text-center">
            <p className="tabular text-lg font-bold text-steel">
              {presentCount}/{totalCount}
            </p>
            <p className="text-[11px] font-medium text-ink-soft">حاضر اليوم</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-out transition hover:border-red-300 hover:text-red-600"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  );
}
