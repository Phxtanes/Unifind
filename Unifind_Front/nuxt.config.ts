export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:9001/api'
    }
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 1000
      },
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 9000
      }
    }
  },
  experimental: {
    appManifest: false
  },
  devtools: { enabled: true }
})
