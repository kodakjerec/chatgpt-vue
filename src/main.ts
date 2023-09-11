import "@icon-park/vue-next/styles/index.css";
import "highlight.js/styles/dark.css";
import { createApp } from "vue";
import vue3GoogleLogin from "vue3-google-login";
import App from "./App.vue";
import "./assets/tailwind.css";
import router from "./router";
import pinia from "./store";

// crypto-js
import AES from "crypto-js/aes";
import encUtf8 from "crypto-js/enc-utf8";
const gDriveId: string =
  "U2FsdGVkX1+2Iq6bBSeV4JvO21Mhx8R/u1/EDscLTJcBt6eC85VnMxtIIFTaDyZ8Xa949jy7zxa1taMwSrTdp8PidCTcDSvtUNM5SF/jleEF69ioXo3K6zAmtGc2SW4t";
const realId: string = AES.decrypt(gDriveId, "kodak19890604").toString(encUtf8);

const app = createApp(App);

app
  .use(router)
  .use(pinia)
  .use(vue3GoogleLogin, {
    clientId: gDriveId,
  })
  .mount("#app");
