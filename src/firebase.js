import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// عدّل القيم دي بالبيانات اللي هتاخدها من Firebase Console
// (Project settings → عندك أيقونة </> اسمها "Web app")
const firebaseConfig = {
  apiKey: "AIzaSyDnFq8cePzzr5wfZHENZovHn3DncPMhWOo",
  authDomain: "khaled-sham-attendance.firebaseapp.com",
  projectId: "khaled-sham-attendance",
  storageBucket: "khaled-sham-attendance.firebasestorage.app",
  messagingSenderId: "870790744107",
  appId: "1:870790744107:web:63cde1b72255b169d7026e",
};

// كود صاحب الشركة — بيدخل بيه على كل الورش والتقارير مجمعة.
// غيّره لأي رقم/كود إنت عايزه، وحافظ عليه سري.
export const OWNER_PIN = "9999";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// لازم نعمل "دخول مجهول" (anonymous sign-in) قبل أي قراءة/كتابة، عشان قواعد
// الحماية (Firestore Rules) بقت بتطلب request.auth != null. ده مايغيرش
// أي حاجة في تجربة الاستخدام (لسه بتدخل بكود PIN زي ما إنت متعود)، بس
// بيمنع أي حد برا التطبيق (بوتات/سكريبتات) من قراءة أو كتابة البيانات
// مباشرة عن طريق الـ REST API من غير ما يعدي بالتطبيق نفسه.
export const authReady = signInAnonymously(auth);