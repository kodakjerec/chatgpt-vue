<template>
  <div class="bg-gray-100 flex h-screen overflow-x-hidden">
    <!-- Sidebar -->
    <div v-if="!sidebarActive" class="fixed top-1 right-1 w-8 h-8 cursor-pointer z-1000 bg-gray-100 rounded" @click="toggleSidebar">
      <menu-unfold theme="outline" size="30" fill="#333" />
    </div>
    <div ref="sidebar" class="bg-gray-800 text-white px-4 sidebar" :class="{ active: sidebarActive }" tabindex="0" @blur="closeSidebar">
      <ul class="mt-8 flex flex-col justify-between cursor-pointer">
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="gotoPath('home')">
          <span>Home</span>
        </li>
        <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="newChatLog()">
          <div class="flex items-center">
            <plus theme="outline" size="24" fill="#fff" />
            New Chat
          </div>
        </li>
        <div class="flex" v-for="(item, index) in logList" :key="index">
          <li class="py-2 border-t flex-auto border-gray-700 items-center hover:bg-slate-700 hover:rounded">
            <div v-if="oldLogName !== item" :class="{ 'text-yellow-300': selectLog === item }" @click="clickLogName(item)">{{ item }}</div>
            <input v-else type="text" class="border rounded-md bg-transparent" @blur="updateLogName" v-model="newLogName" ref="editingLogName">
          </li>
          <div v-if="!oldLogName">
            <edit theme="outline" size="20" fill="#fff" class="mt-3" @click="editLogName(item)" />
            <delete theme="outline" size="20" fill="#fff" class="mt-3" @click="delChatLog(item)" />
          </div>
        </div>
        <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="gotoPath('transcription')">
          <div class="flex items-center">
            <translate theme="outline" size="24" fill="#fff" />
            transcription
          </div>
        </li>
        <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="gotoPath('translation')">
          <div class="flex items-center">
            <translate theme="outline" size="24" fill="#fff" />
            translation
          </div>
        </li>
        <li>==========</li>
        <li class="mt-auto py-2 border-t border-b border-gray-700 hover:bg-slate-700 hover:rounded" @click="gotoPath('settings')">
          <span>Settings</span>
        </li>
        <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="gotoPath('createOneImage')">
          <div class="flex items-center">
            <photograph theme="outline" size="24" fill="#fff" />
            Image
          </div>
        </li>
      </ul>
    </div>
    <!-- shadow -->
    <div v-if="sidebarActive" class="absolute w-full h-screen bg-slate-100 opacity-60 z-10"></div>
    <!-- nowLoading -->
    <div v-if="nowLoading" class="absolute w-full h-screen bg-slate-100 opacity-90 z-10">
      <div class="inset-x-20 top-1/2 absolute font-black text-2xl">{{ nowLoading }}</div>
    </div>
    <!-- Content -->
    <div class="w-full">
      <component v-if="componentPath==='home'" :is="componentPath" @fromClick="(path) => nowPath = path"></component>
      <component v-else-if="componentPath==='chat'" :is="componentPath" :sendLogName="selectLog"></component>
      <component v-else :is="componentPath"></component>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { Photograph, Translate, Plus, Edit, Delete, MenuUnfold } from "@icon-park/vue-next";
import { storeSettings, storeGoogleDrive } from '@/store/index';
import { computed } from "vue";
// components
import home from "@/views/home.vue";
import chat from "@/views/chat.vue";
import transcription from "@/views/transcription.vue";
import translation from "@/views/translation.vue";
import settings from "@/views/settings.vue";
import createOneImage from "@/views/createOneImage.vue";

const logList = computed(() => storeSettings().getLogList )
</script>

<script lang="ts">
export default {
  name: 'App',
  components: {
    Photograph, Translate, Plus, Edit, Delete, MenuUnfold,
    home, chat, transcription, translation, settings, createOneImage
  },
  data() {
    return {
      nowPath: 'home',
      messageList: [],
      sidebarActive: false, // 顯示sidebar
      nowLoading: false,
      loadingMessage: "",   // 讀取視窗文字
      lastActiveTime: null,  // 最後一次操作時間
      oldLogName: "",  // 是否正在編輯標題文字, 並作為儲存舊文字
      newLogName: "" // 新文字
    }
  },
  computed: {
    selectLog() {
      if (this.nowPath.indexOf("chat")>=0) {
        return this.nowPath.replace("chat/","");
      }
      return "";
    },
    componentPath() {
      let returnPath = this.nowPath;
      if (returnPath.indexOf("chat")>=0) {
        returnPath = "chat";
      }
      return returnPath;
    }
  },
  async mounted() {
    window.addEventListener('focus', this.handlePageFocus);

    const token = storeSettings().getGDriveToken;

    if (token) {
      this.nowLoading = "Loading cloud data.";
      await storeGoogleDrive().cloundToLocalStorage();
      this.nowLoading = "";
    }
    const lastPath = storeSettings().getLastPath;
    if (lastPath) {
      this.nowPath = lastPath;
    } else {
      this.nowPath = "settings";
    }
  },
  beforeDestroy() {
    window.removeEventListener('focus', this.handlePageFocus)
  },
  methods: {
    /**
     * add new chat block
     */
    newChatLog() {
      let generatedString: string = '';
      let startIndex: number = 1;
      let isDuplicate: boolean = true;

      while (isDuplicate) {
        // 生成一個隨機6個字符的字符串
        generatedString = 'chat' + startIndex.toString();

        // 檢查新字符串是否已經存在於列表中
        if (!this.logList.includes(generatedString)) {
          isDuplicate = false;
        } else {
          generatedString = '';
          startIndex++;
        }
      }
      this.clickLogName(generatedString);
    },
    /**
     * delete one chat block
     */
    delChatLog(logName: string) {
      storeSettings().delLogData(logName);
      this.clickLogName(this.logList[0]);
    },
    /**
     * select one chat
     */
    clickLogName(logName: string) {
      this.gotoPath('chat/' + logName);
    },
    editLogName(item) {
      this.oldLogName = item;
      this.newLogName = item;
      // this.$nextTick(() => {
      //   if (this.$refs.editingLogName) {
      //     const refInput = (this.$refs.editingLogName as HTMLInputElement);
      //     refInput.select();
      //   }
      // })
    },
    updateLogName() {
      const oldName = this.oldLogName;
      const newLogName = this.newLogName;
      if (newLogName) {
        // change chatLog
        const chatLog = storeSettings().getLogData(oldName);
        storeSettings().setLogData(newLogName, chatLog);
        storeSettings().delLogData(oldName);
        this.clickLogName(newLogName);
      }
      // finally
      this.oldLogName = "";
      this.newLogName = "";
    },
    gotoPath(path: string) {
      this.nowPath = path;
      storeSettings().setLastPath(this.nowPath);
    },
    /**
     * click sidebar
     */
    toggleSidebar() {
      if (!this.sidebarActive) {
        if (this.$refs.sidebar)
          (this.$refs.sidebar as HTMLBodyElement).focus();
      }
      this.sidebarActive = !this.sidebarActive;
    },
    /**
     * close sidebar
     */
    closeSidebar() {
      this.sidebarActive = false;
    },
    /**
     * Refresh the screen after being idle for a long time
     */
    handlePageFocus() {
      const lastActiveTime: number = Number(this.lastActiveTime ?? new Date().getTime());
      const currentTime: number = new Date().getTime();
      const timeDiff: number = currentTime - lastActiveTime;
      this.lastActiveTime = currentTime;
      // 如果背景中放置的時間超過指定時間，就重新載入頁面
      if (timeDiff > 60 * 60 * 1000) { // 60 分鐘
        location.reload();
      }
    }
  }
}
</script>
<style>
html,
body,
#app {
  height: 100%;
}

/* Default sidebar styles */
.sidebar {
  width: 200px;
  height: 100%;
  position: fixed;
  top: 0;
  left: -200px;
  z-index: 999;
  transition: transform 0.3s ease-in-out;
}

/* Default sidebar hide */
.sidebar-toggle+.sidebar {
  transform: translateX(-200px);
}


/* sidebar active */
.sidebar.active {
  transform: translateX(200px);
}
</style>
