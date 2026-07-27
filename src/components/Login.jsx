import { useState } from "react";
import logo from "../assets/logo.png";
import { OWNER_PIN } from "../firebase";

export default function Login({ sites, onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

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

        <input
          autoFocus
          inputMode="numeric"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError("");
          }}
          placeholder="اكتب الكود هنا"
          className="tabular mt-5 w-full rounded-lg border border-line bg-page px-4 py-3 text-center text-lg font-bold text-ink outline-none focus:border-steel"
        />

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
