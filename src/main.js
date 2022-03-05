import Vue from 'vue'
import App from './App.vue'
import './plugins/element.js'
import scroll from 'vue-seamless-scroll'
import * as echarts from "echarts";
import router from './router'

Vue.use(scroll)
Vue.config.productionTip = false
Vue.prototype.$echarts = echarts;



new Vue({
  router,
  render: function (h) { return h(App) }
}).$mount('#app')
