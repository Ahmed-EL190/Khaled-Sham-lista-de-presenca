import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// __APP_VERSION__ بيتحط جوه الكود وقت الـ build (شوف vite.config.js)، وده
// رقم النسخة اللي التطبيق شغال بيها فعليًا دلوقتي في المتصفح.
/* global __APP_VERSION__ */
const CURRENT_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "";

const CHECK_INTERVAL_MS = 60 * 1000; // كل دقيقة

// الطريقة دي مستقلة تمامًا عن حالة الـ Service Worker (اللي أحيانًا بيحدّث
// نفسه بصمت من غير ما يقولنا، أو العكس). إحنا بنسأل السيرفر بنفسنا كل دقيقة:
// "إيه رقم آخر نسخة منشورة؟" (ملف version.json بيتقرا بكاش معطّل تمامًا)،
// ولو مختلف عن اللي شغالين بيه، نوري رسالة وناخد المستخدم لآخر نسخة.
export default function UpdatePrompt() {
  const [updating, setUpdating] = useState(false);
  const [versionMismatch, setVersionMismatch] = useState(false);
  const checkingRef = useRef(false);

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

  function closeOfflineReady() {
    setOfflineReady(false);
  }

  if (!versionMismatch && !offlineReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-lg">
        {versionMismatch ? (
          <>
            <span className="flex-1 text-xs font-semibold text-ink">
              🔄 في نسخة جديدة من التطبيق — حدّث دلوقتي؟
            </span>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={updating}
              className="rounded-lg bg-steel px-3 py-1.5 text-xs font-bold text-white hover:bg-steel-light disabled:opacity-60"
            >
              {updating ? "بيحدّث…" : "تحديث"}
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-xs font-semibold text-ink">
              ✅ التطبيق بقى جاهز يشتغل من غير نت
            </span>
            <button
              type="button"
              onClick={closeOfflineReady}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-out hover:bg-out-soft"
            >
              تمام
            </button>
          </>
        )}
      </div>
    </div>
  );
}