import { useLangStore } from '~/stores/lang'

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      t: (key: string, params?: Record<string, any>) => {
        const langStore = useLangStore()
        return langStore.t(key, params)
      }
    }
  }
})
