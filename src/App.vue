
<script lang="ts" setup>
import { storeSettings, storeGoogleDrive } from '@/store/index';
// components
import home from "@/views/home.vue";
import chat from "@/views/chat.vue";
import transcription from "@/views/transcription.vue";
import translation from "@/views/translation.vue";
import settings from "@/views/settings.vue";
import createOneImage from "@/views/createOneImage.vue";
import prompts from './views/prompts.vue';
import sideBar from "@/views/components/sideBar.vue";
import { computed } from "vue";

const lastPath = computed(() => storeSettings().getLastPath);
const componentPath = computed(() => {
      if (lastPath.value.indexOf("chat")>=0) {
        return "chat";
      }
      return lastPath.value;
    });
const selectLog = computed(() => {
    if (lastPath.value.indexOf("chat")>=0) {
        return lastPath.value.replace("chat/","");
      }
      return "";
})

let nowLoading = "";
let lastActiveTime = new Date().getTime();  // 最後一次操作時間
/**
 * Refresh the screen after being idle for a long time
 */
const handlePageFocus = () => {
      const currentTime: number = new Date().getTime();
      const timeDiff: number = currentTime - lastActiveTime;
      lastActiveTime = currentTime;
      // 如果背景中放置的時間超過指定時間，就重新載入頁面
      if (timeDiff > 60 * 60 * 1000) { // 60 分鐘
        location.reload();
      }
    }

</script>
<template>
  <div class="bg-gray-100 flex h-screen overflow-x-hidden">
    <!-- Sidebar -->
    <side-bar></side-bar>
    <!-- nowLoading -->
    <div v-if="nowLoading" class="absolute w-full h-screen bg-slate-100 opacity-90 z-10">
      <div class="inset-x-20 top-1/2 absolute font-black text-2xl">{{ nowLoading }}</div>
    </div>
    <!-- Content -->
    <div class="w-full">
      <component v-if="componentPath==='chat'" :is="componentPath" :sendLogName="selectLog"></component>
      <component v-else :is="componentPath"></component>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'App',
  components: {
    home, chat, transcription, translation, settings, createOneImage, prompts
  },
  async mounted() {
    window.addEventListener('focus', this.handlePageFocus);

    const token = storeSettings().getGDriveToken;

    if (token) {
      this.nowLoading = "Loading cloud data.";
      await storeGoogleDrive().cloundToLocalStorage();
      this.nowLoading = "";
    }
  },
  beforeUnmount() {
    window.removeEventListener('focus', this.handlePageFocus)
  }
}
</script>
<style>
html,
body,
#app {
  height: 100%;
}
</style>
