import { createApp } from 'vue'
import './style.css' // Si tienes estilos globales
import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)
  .mount('#app')