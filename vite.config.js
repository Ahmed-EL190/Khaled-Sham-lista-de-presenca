import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// رقم نسخة فريد بيتولد لحظة عمل الـ build (وقت الرفع على Vercel)، مش بيتغير
// إلا لما تعمل ديبلوي جديد. بنحطه جوه الكود نفسه (__APP_VERSION__) وكمان في
// ملف version.json منفصل، عشان نقارن بينهم وقت الشغل (شوف VersionChecker.jsx).
const buildVersion = String(Date.now())

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // بنسجل السيرفس ووركر يدويًا من React (شوف src/components/UpdatePrompt.jsx)
      // عشان نقدر نعرض للمستخدم رسالة "في تحديث جديد" بدل ما نعمل ريفريش فجأة
      // ونضيّع عليه بيانات بيسجلها في نفس اللحظة.
      injectRegister: false,
      registerType: 'prompt',

      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'apple-touch-icon.png',
      ],

      manifest: {
        id: '/',
        name: 'خالد شام | سجل الحضور',
        short_name: 'سجل الحضور',
        description:
          'تطبيق تسجيل حضور وانصراف عمال الورش، وحساب المرتبات، لشركة خالد شام للمقاولات.',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1e6fbf',
        background_color: '#f5f7fb',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // بنعمل precache لملفات التطبيق نفسه (JS/CSS/HTML/الصور/الخطوط) بس،
        // عشان الموقع/الواجهة يفتحوا حتى لو مفيش نت خالص (أول مرة يفتح فيها
        // ويتسجل السيرفس ووركر لازم يكون فيه نت مرة واحدة على الأقل).
        // بيانات الحضور نفسها مش بتتخزن هنا، دي بتتخزن IndexedDB عن طريق
        // Firestore persistence (شوف src/firebase.js).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      devOptions: {
        // مفيش سيرفس ووركر وقت التطوير المحلي (npm run dev) عشان ميعملش
        // مشاكل كاش وانت بتشتغل. بيتفعّل تلقائي في نسخة الـ build.
        enabled: false,
      },
    }),
    {
      // بلجن صغير بيكتب ملف public/version.json وقت الـ build فيه نفس
      // رقم النسخة (buildVersion) بالظبط. الملف ده بيتقرا بكاش معطّل
      // (شوف vercel.json) عشان نقدر نقارنه برقم النسخة اللي التطبيق شغال
      // بيه فعليًا في المتصفح، ونعرف لو فيه نسخة أحدث اتنشرت.
      name: 'write-version-json',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: buildVersion }),
        })
      },
    },
  ],
})