import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import pinia from "./store";
import "./assets/tailwind.css";
import "@icon-park/vue-next/styles/index.css";
import "highlight.js/styles/dark.css";
import vue3GoogleLogin from "vue3-google-login";

// toaster
import Toaster from "@meforma/vue-toaster";

const app = createApp(App);

app
  .use(router)
  .use(pinia)
  .use(Toaster)
  .use(vue3GoogleLogin, {
    clientId: "929956701294-bvbtd8uh85cnb8gbf1fi5sboa9ue1f5r.apps.googleusercontent.com",
  })
  .mount("#app");
