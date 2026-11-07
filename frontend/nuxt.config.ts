export default defineNuxtConfig({
  compatibilityDate: '2026-11-07',
  devtools: { enabled: false },
  css: ['~/assets/main.css'],
  runtimeConfig: {
    backendUrl: 'http://127.0.0.1:5080'
  },
  app: {
    head: {
      title: 'Document Generator',
      htmlAttrs: { lang: 'de' },
      meta: [{ name: 'description', content: 'Vorlagen verwalten und persönliche Dokumente erstellen.' }]
    }
  }
})
