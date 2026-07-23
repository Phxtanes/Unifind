export {}

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (key: string, params?: Record<string, any>) => string
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string, params?: Record<string, any>) => string
  }
}

declare module '#app' {
  interface NuxtApp {
    $t: (key: string, params?: Record<string, any>) => string
  }
}
