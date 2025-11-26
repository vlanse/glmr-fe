import './assets/main.css'

import {createApp} from 'vue'
import App from './App.vue'
import ui from '@nuxt/ui/vue-plugin'
import {createPinia} from 'pinia'

const pinia = createPinia()
const app = createApp(App)

app.use(ui)
app.use(pinia)

createApp(App).mount('#app')
