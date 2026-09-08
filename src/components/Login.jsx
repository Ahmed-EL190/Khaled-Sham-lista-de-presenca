import { useState } from "react";
import logo from "../assets/logo.png";
import { OWNER_PIN } from "../firebase";

export default function Login({ sites, onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function submit(e) {
    e.preventDefault();
    const value = pin.trim();
    if (!value) {
      setError("من فضلك ادخل الكود");
      return;
    }

    setIsLoading(true);

    // محاكاة تأخير بسيط للتحميل
    setTimeout(() => {
      if (value === OWNER_PIN) {
        onLogin({ role: "owner", siteId: null, siteName: null });
        return;
      }

      const site = sites.find((s) => s.pin === value);
      if (site) {
        onLogin({ role: "foreman", siteId: site.id, siteName: site.name });
        return;
      }

      setError("الكود ده مش مسجل، اتأكد منه وحاول تاني");
      setIsLoading(false);
    }, 500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100/50 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-line/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition hover:shadow-2xl sm:p-8"
      >
        {/* اللوجو والعنوان */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-ink to-gray-800 p-2 shadow-lg shadow-ink/10">
            <img src={logo} alt="خالد شام للإنشاءات" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-4 text-xl font-black tracking-tight text-ink sm:text-2xl">
            سجل حضور العمال
          </h1>
          <p className="mt-1 text-sm text-out/80">ادخل كود الورشة بتاعتك</p>
        </div>

        {/* حقل الكود */}
        <div className="relative mt-6">
          <input
            autoFocus
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            placeholder="اكتب الكود هنا"
            className={`w-full rounded-2xl border bg-page px-4 py-3.5 pl-12 text-center text-lg font-bold text-ink outline-none transition focus:ring-2 sm:text-xl ${
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                : "border-line/60 focus:border-steel/80 focus:ring-2 focus:ring-steel/20"
            }`}
          />
          
          {/* زر إظهار/إخفاء الكود */}
          <button
            type="button"
            onClick={() => setShowPin((v) => !v)}
            title={showPin ? "إخفاء الكود" : "إظهار الكود"}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-out transition hover:bg-mist/50 hover:text-ink"
          >
            {showPin ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>

          {/* عدد المحاولات */}
          {sites.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-mist/60 px-2 py-0.5 text-[10px] font-medium text-steel">
              {sites.length} ورشة
            </div>
          )}
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5">
            <span className="text-red-500">⚠️</span>
            <p className="text-xs font-medium text-red-600">{error}</p>
          </div>
        )}

        {/* زر الدخول */}
        <button
          type="submit"
          disabled={isLoading}
          className="group mt-5 w-full rounded-2xl bg-linear-to-r from-ink to-gray-800 py-3.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-60 disabled:hover:shadow-none sm:py-4 sm:text-base"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              جاري الدخول...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              دخول
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </button>

        {/* تذييل */}
        <p className="mt-4 text-center text-[10px] text-out/50">
          نظام إدارة حضور العمال 
        </p>
      </form>
    </div>
  );
}