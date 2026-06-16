import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'

// Tell Font Awesome to skip adding the CSS automatically since Nuxt handles it
config.autoAddCss = false

// Add all solid icons to library for easy development
library.add(fas)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('font-awesome', FontAwesomeIcon)
})
