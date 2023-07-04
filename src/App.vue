<template>
  <div class="bg-gray-100 flex h-screen overflow-x-hidden">
    <!-- Sidebar -->
    <div v-if="!sidebarActive" class="fixed top-1 right-1 w-8 h-8 cursor-pointer z-1000 bg-gray-100 rounded" @click="toggleSidebar">
      <menu-unfold theme="outline" size="24" fill="#333" />
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
            <div :class="{ 'text-yellow-300': selectLog === item }" @click="clickLogName(item)">{{ item }}</div>
          </li>
          <delete theme="outline" size="20" fill="#fff" class="mt-3" v-show="logList.length > 1" @click="delChatLog(item)" />
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
        <!-- <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="gotoPath('createOneImage')">
          <div class="flex items-center line-through">
            <photograph theme="outline" size="24" fill="#fff" />
            Image
          </div>
        </li> -->
      </ul>
    </div>
    <!-- shadow -->
    <div v-if="sidebarActive" class="absolute w-full h-screen bg-slate-100 opacity-60 z-10"></div>
    <!-- nowLoading -->
    <div v-if="nowLoading" class="absolute w-full h-screen bg-slate-100 opacity-90 z-10">
      <div class="left-1/3 top-1/2 absolute font-black text-2xl">{{ loadingMessage }}</div>
    </div>
    <!-- Content -->
    <div class="w-full">
      <router-view v-if="nowPath === 'home'" name="home" @fromClick="(path) => nowPath = path" />
      <router-view v-if="nowPath.slice(0, 4) === 'chat'" name="chat" :sendLogName="selectLog" @updateLogName="updateLogName" />
      <router-view v-if="nowPath === 'createOneImage'" name="createOneImage" />
      <router-view v-if="nowPath === 'translation'" name="translation" />
      <router-view v-if="nowPath === 'transcription'" name="transcription" />
      <router-view v-if="nowPath === 'settings'" name="settings" />
    </div>
  </div>
</template>
<script lang="ts">
import { Photograph, Translate, Plus, Delete, MenuUnfold } from "@icon-park/vue-next";
import { storeSettings, storeGoogleDrive } from '@/store/index';

export default {
  name: 'App',
  components: {
    Photograph, Translate, Plus, Delete, MenuUnfold
  },
  data() {
    return {
      nowPath: 'home',
      selectLog: '',
      logList: [],
      messageList: [],
      sidebarActive: false,
      nowLoading: false,
      loadingMessage: "",
      lastActiveTime: null
    }
  },
  async mounted() {
    window.addEventListener('focus', this.handlePageFocus);

    const token = storeSettings().getGDriveToken;

    if (token) {
      this.nowLoading = true;
      this.loadingMessage = "Loading cloud data.";
      await storeGoogleDrive().cloundToLocalStorage();
      this.nowLoading = false;
      this.loadingMessage = "";
    }
    this.bringlogList();
  },
  beforeDestroy() {
    window.removeEventListener('focus', this.handlePageFocus)
  },
  methods: {
    /**
     * get all log list
     */
    bringlogList() {
      this.logList = storeSettings().getLogList;

      const lastPath = storeSettings().getLastPath;
      if (lastPath) {
        this.nowPath = lastPath;
      } else {
        this.nowPath = "settings";
      }
      if (this.nowPath.slice(0, 4) === 'chat') {
        this.selectLog = this.nowPath.substring(5, this.nowPath.length);
      }
    },
    /**
     * save log list
     */
    setLogList() {
      storeSettings().setLogList(this.logList);
    },
    /**
     * add new chat block
     */
    newChatLog() {
      let generatedString: string = ''
      const stringLength: number = 6
      let isDuplicate: boolean = true

      while (isDuplicate) {
        // 生成一個隨機6個字符的字符串
        generatedString = 'chat' + (Math.round(Math.random() * 1000)).toString();

        // 檢查新字符串是否已經存在於列表中
        if (!this.logList.includes(generatedString)) {
          isDuplicate = false
        } else {
          generatedString = ''
        }
      }
      this.logList.push(generatedString);
      this.clickLogName(generatedString);
      this.setLogList();
    },
    /**
     * delete one chat block
     */
    delChatLog(logName: string) {
      storeSettings().delLogData(logName);
      const findIndex = this.logList.findIndex(element => element === logName);
      if (findIndex > -1) {
        this.logList.splice(findIndex, 1);
        this.clickLogName(this.logList[0]);
        this.setLogList();
      }
    },
    /**
     * select one chat
     */
    clickLogName(logName: string) {
      this.selectLog = logName;
      this.gotoPath('chat/' + this.selectLog);
    },
    updateLogName(fromObject: { newLogName: string, oldName: string }) {
      const newLogName = fromObject.newLogName;
      const oldName = fromObject.oldName;

      const index = this.logList.findIndex(item => item === oldName);

      if (newLogName) {
        const oldName = this.logList[index];
        // change list
        this.logList[index] = newLogName;
        this.setLogList();
        // change chatLog
        const chatLog = storeSettings().getLogData(oldName);
        storeSettings().setLogData(newLogName, chatLog);
        storeSettings().delLogData(oldName);
        this.clickLogName(newLogName);
      }
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
