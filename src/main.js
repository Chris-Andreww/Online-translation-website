import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';
import VueClipboard from "vue-clipboard2";
import '@/assets/public.css'

Vue.use(ElementUI);

Vue.use(VueClipboard);

new Vue({
  el: '#app',
  render: h => h(App)
})