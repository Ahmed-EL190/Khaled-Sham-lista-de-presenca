import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// __APP_VERSION__ بيتحط جوه الكود وقت الـ build (شوف vite.config.js)، وده
// رقم النسخة اللي التطبيق شغال بيها فعليًا دلوقتي في المتصفح.
/* global __APP_VERSION__ */
const CURRENT_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "";

const CHECK_INTERVAL_MS = 60 * 1000; // كل دقيقة
const AUTO_UPDATE_DELAY_MS = 6 * 1000; // لو المستخدم مدوسش تحديث بنفسه، بنحدّث تلقائي بعد المدة دي

// الطريقة دي مستقلة تمامًا عن حالة الـ Service Worker (اللي أحيانًا بيحدّث
// نفسه بصمت من غير ما يقولنا، أو العكس). إحنا بنسأل السيرفر بنفسنا كل دقيقة:
// "إيه رقم آخر نسخة منشورة؟" (ملف version.json بيتقرا بكاش معطّل تمامًا)،
// ولو مختلف عن اللي شغالين بيه، نحدّث تلقائي (من غير ما نستنى المستخدم يدوس
// حاجة) عشان أي إصلاح مهم يوصل لكل الأجهزة فورًا، حتى لو حد نسي يدوس "تحديث".
export default function UpdatePrompt() {
  const [updating, setUpdating] = useState(false);
  const [versionMismatch, setVersionMismatch] = useState(false);
  const checkingRef = useRef(false);
  const autoUpdateTimerRef = useRef(null);

  // بنستخدمها بس عشان رسالة "التطبيق جاهز يشتغل من غير نت" (أول مرة بس)
  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({});

  useEffect(() => {
    if (!CURRENT_VERSION) return; // لو لأي سبب الرقم مش موجود، متعملش حاجة

    async function checkForUpdate() {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.version && data.version !== CURRENT_VERSION) {
          setVersionMismatch(true);
        }
      } catch {
        // مفيش نت أو خطأ مؤقت — هنحاول تاني في الفحص الجاي من غير ما نضايق حد
      } finally {
        checkingRef.current = false;
      }
    }

    // 1) فحص فوري أول ما التطبيق يفتح
    checkForUpdate();

    // 2) فحص دوري كل دقيقة
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    // 3) فحص فوري إضافي كل ما المستخدم يرجع للتاب بعد ما كان في الخلفية
    function onVisible() {
      if (document.visibilityState === "visible") checkForUpdate();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  async function handleUpdate() {
    setUpdating(true);
    try {
      // بنلغي تسجيل الـ Service Worker القديم قبل الريفريش، عشان نضمن
      // 100% إن الصفحة هتجيب آخر نسخة فعلية من السيرفر مباشرة، مش نسخة
      // قديمة محفوظة عنده. بعد الريفريش هيتسجل Service Worker جديد
      // تلقائي بآخر نسخة، وترجع ميزة التخزين الأوفلاين تشتغل عادي.
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    } catch (err) {
      console.warn("تعذّر إلغاء تسجيل الـ Service Worker القديم:", err);
    } finally {
      window.location.reload();
    }
  }

  // لو ظهر إن في نسخة جديدة ومحدش دوس "تحديث" بنفسه، بنحدّث تلقائي بعد شوية
  // ثواني بس، عشان أي إصلاح مهم (زي إصلاحات الأخطاء) يوصل للكل من غير ما
  // يعتمد على إن حد يلاحظ الرسالة ويدوس عليها.
  useEffect(() => {
    if (!versionMismatch || updating) return;
    autoUpdateTimerRef.current = setTimeout(() => {
      handleUpdate();
    }, AUTO_UPDATE_DELAY_MS);
    return () => clearTimeout(autoUpdateTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionMismatch]);

  function closeOfflineReady() {
    setOfflineReady(false);
  }

  if (!versionMismatch && !offlineReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-line/60 bg-white/95 p-3 shadow-2xl shadow-ink/10 backdrop-blur-sm transition-all sm:gap-3 sm:p-4">
        {versionMismatch ? (
          <>
            <span className="flex-1 text-xs font-semibold text-ink sm:text-sm">
              <span className="mr-1.5 text-lg">🔄</span>
              في نسخة جديدة من التطبيق — هيحدّث تلقائي خلال ثواني
            </span>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={updating}
              className="rounded-xl bg-linear-to-r from-ink to-gray-800 px-4 py-2 text-xs font-bold text-white transition hover:shadow-lg hover:shadow-ink/20 disabled:opacity-60 disabled:hover:shadow-none sm:px-5 sm:py-2.5 sm:text-sm"
            >
              {updating ? (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  بيحدّث…
                </span>
              ) : (
                "حدّث دلوقتي"
              )}
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-xs font-semibold text-ink sm:text-sm">
              <span className="mr-1.5 text-lg">✅</span>
              التطبيق بقى جاهز يشتغل من غير نت
            </span>
            <button
              type="button"
              onClick={closeOfflineReady}
              className="rounded-xl border border-line/60 px-3 py-1.5 text-xs font-semibold text-out transition hover:bg-page hover:text-ink sm:px-4 sm:py-2 sm:text-sm"
            >
              تمام
            </button>
          </>
        )}
      </div>
    </div>
  );
}