import { useState } from "react";
import logo from "../assets/logo.png";
import { OWNER_PIN } from "../firebase";

export default function Login({ sites, onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);

  function submit(e) {
    e.preventDefault();
    const value = pin.trim();
    if (!value) return;

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
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="خالد شام للإنشاءات" className="h-16 w-16 object-contain" />
          <h1 className="mt-3 text-lg font-black text-ink">سجل حضور العمال</h1>
          <p className="mt-1 text-sm text-out">ادخل كود الورشة بتاعتك</p>
        </div>

        <div className="relative mt-5">
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
            className="tabular w-full rounded-lg border border-line bg-page px-4 py-3 pl-11 text-center text-lg font-bold text-ink outline-none focus:border-steel"
          />
          <button
            type="button"
            onClick={() => setShowPin((v) => !v)}
            title={showPin ? "إخفاء الكود" : "إظهار الكود"}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-out hover:bg-mist hover:text-ink"
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
        </div>

        {error && <p className="mt-2 text-center text-xs font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-ink py-3 text-sm font-bold text-white transition hover:bg-ink-soft"
        >
          دخول
        </button>
      </form>
    </div>
  );
}