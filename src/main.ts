import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import pinia from './store';
import "./assets/tailwind.css";
import "@icon-park/vue-next/styles/index.css";
import "highlight.js/styles/dark.css";

// toastr
import Toastr from '@meforma/vue-toaster';

const app = createApp(App);

app.use(router).use(pinia).use(Toastr).mount("#app");
