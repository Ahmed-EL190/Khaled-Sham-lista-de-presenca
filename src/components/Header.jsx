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
  const time = now.toLocaleTimeString("ar-EG-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
        {/* القسم الأيمن - اللوجو والعنوان */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-ink to-gray-800 p-1.5 shadow-md shadow-ink/10 sm:h-14 sm:w-14 sm:p-2">
            <img 
              src={logo} 
              alt="خالد شام للإنشاءات" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-ink sm:text-xl md:text-2xl">
              سجل حضور العمال
            </h1>
            <p className="text-[10px] font-medium text-steel/80 sm:text-xs">
              {siteLabel}
            </p>
          </div>
        </div>

        {/* القسم الأيسر - الوقت والإحصائيات */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* الوقت والتاريخ */}
          <div className="min-w-25 text-left sm:min-w-30 sm:text-right">
            <p className="tabular text-sm font-bold text-ink sm:text-lg md:text-xl">
              {time}
            </p>
            <p className="text-[9px] text-out/70 sm:text-[10px] md:text-xs">
              {date}
            </p>
          </div>

          {/* الفاصل */}
          <div className="hidden h-8 w-px bg-line/60 sm:block md:h-10" />

          {/* عدد الحضور */}
          <div className="relative rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100/50 px-3 py-1.5 text-center shadow-sm ring-1 ring-emerald-200/50 sm:px-4 sm:py-2">
            <p className="tabular text-sm font-black text-emerald-700 sm:text-base md:text-lg">
              {presentCount}/{totalCount}
            </p>
            <p className="text-[8px] font-medium text-emerald-600/70 sm:text-[9px] md:text-[10px]">
              حاضر اليوم
            </p>
            {/* نقطة خضراء متحركة */}
            {presentCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
            )}
          </div>

          {/* زر الخروج */}
          <button
            onClick={onLogout}
            className="group rounded-xl border border-line/60 bg-white/50 px-3 py-1.5 text-xs font-semibold text-out transition hover:border-rose-300/80 hover:bg-rose-50/80 hover:text-rose-600 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="flex items-center gap-1.5">
              <svg 
                className="h-3.5 w-3.5 transition group-hover:rotate-12 sm:h-4 sm:w-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round"/>
                <path d="M16 17l5-5-5-5" strokeLinecap="round"/>
                <path d="M21 12H9" strokeLinecap="round"/>
              </svg>
              <span>خروج</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}