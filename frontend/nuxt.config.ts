export default defineNuxtConfig({
  compatibilityDate: '2026-11-07',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/main.css', '~/assets/letter.css'],
  runtimeConfig: {
    letterMailKey: '',
    backendUrl: 'http://127.0.0.1:5080',
    public: { apiBase: '', storageMode: 'api' }
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Nitoh · Letter Studio',
      htmlAttrs: { lang: 'de' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: `${process.env.NUXT_APP_BASE_URL || '/'}nitoh-mark.svg` }],
      meta: [{ name: 'description', content: 'Durchdachte Briefe. Persönliche Vorlagen. Ein professionelles A4-Layout.' }]
    }
  }
})
