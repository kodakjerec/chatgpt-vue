<template>
  <div class="bg-gray-100 flex h-screen">
    <!-- Sidebar -->
    <div class="sidebar-toggle" @click="toggleSidebar">Menu</div>
    <div ref="sidebar" class="bg-gray-800 text-white px-4 sidebar" :class="{ active: sidebarActive }" tabindex="0"
      @blur="closeSidebar">
      <ul class="mt-8 flex flex-col justify-between cursor-pointer">
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="gotoPath('home')">
          <span>Home</span>
        </li>
        <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded"
          @click="newChatLog()">
          <div class="flex items-center">
            <plus theme="outline" size="24" fill="#fff"/>
            New Chat
          </div>
        </li>
        <div class="flex" v-for="(item, index) in logList" :key="index">
          <li class="py-2 border-t flex-auto border-gray-700 items-center hover:bg-slate-700 hover:rounded">
            <div :class="{ 'text-yellow-300': selectLog === item }" @click="clickLogName(item)">{{ item }}</div>
          </li>
            <delete theme="outline" size="20" fill="#fff" class="mt-3" v-show="logList.length > 1" @click="delChatLog(item)"/>
        </div>
        <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded"
          @click="gotoPath('createOneImage')">
          <div class="flex items-center line-through">
            <photograph theme="outline" size="24" fill="#fff"/>
            Image
          </div>
        </li>
        <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded"
          @click="gotoPath('translation')">
          <div class="flex items-center">
            <translate theme="outline" size="24" fill="#fff"/>
            translation
          </div>
        </li>
        <li>==========</li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded"
          @click="gotoPath('transcription')">
          <div class="flex items-center">
            <translate theme="outline" size="24" fill="#fff"/>
            transcription
          </div>
        </li>
        <li>==========</li>
        <li class="mt-auto py-2 border-t border-b border-gray-700 hover:bg-slate-700 hover:rounded" @click="gotoPath('settings')">
          <span>Settings</span>
        </li>
      </ul>
    </div>
    <!-- Content -->
    <div class="blockContent" v-if="sidebarActive"></div>
    <div>
      <div v-if="sidebarActive" class="absolute w-full h-full bg-slate-100 opacity-60 z-10"></div>
      <router-view v-if="nowPath === 'home'" name="home" @fromClick="nowPath = 'settings'" />
      <router-view v-if="nowPath.slice(0, 4) === 'chat'" name="chat" :sendLogName="selectLog" @updateLogName="updateLogName" />
      <router-view v-if="nowPath === 'createOneImage'" name="createOneImage" />
      <router-view v-if="nowPath === 'translation'" name="translation" />
      <router-view v-if="nowPath === 'transcription'" name="transcription" />
      <router-view v-if="nowPath === 'settings'" name="settings" />
    </div>
  </div>
</template>
<script lang="ts">
import { faker } from '@faker-js/faker';
import { Photograph, Translate, Plus, Delete } from "@icon-park/vue-next";

export default {
  name: 'App',
  components: {
    Photograph, Translate, Plus, Delete
  },
  data(): {
    nowPath: string,
    selectLog: string,
    logList: Array<string>,
    messageList: Array<any>,
    sidebarActive: boolean
  } {
    return {
      nowPath: 'home',
      selectLog: '',
      logList: [],
      messageList: [],
      sidebarActive: false
    }
  },
  mounted() {
    window.addEventListener('focus', this.handlePageFocus);
    this.getLogList();
  },
  beforeDestroy() {
    window.removeEventListener('focus', this.handlePageFocus)
  },
  methods: {
    /**
     * get all log list
     */
    getLogList() {
      let logList = localStorage.getItem('logList');
      if (logList) {
        Object.assign(this.logList, JSON.parse(logList));
      }

      let lastPath = localStorage.getItem('lastPath');
      if (lastPath) {
        this.nowPath = lastPath;
        if (this.nowPath.slice(0, 4) === 'chat') {
          this.selectLog = this.nowPath.substring(5, this.nowPath.length);
        }
      }
    },
    /**
     * save log list
     */
    setLogList() {
      localStorage.setItem('logList', JSON.stringify(this.logList));
    },
    /**
     * add new chat block
     */
    newChatLog() {
      let generatedString: string = ""
      const stringLength: number = 6
      let isDuplicate: boolean = true

      while (isDuplicate) {
        // 生成一個隨機6個字符的字符串
        generatedString = faker.word.adjective(6);

        // 檢查新字符串是否已經存在於列表中
        if (!this.logList.includes(generatedString)) {
          isDuplicate = false
        } else {
          generatedString = ""
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
      localStorage.removeItem(logName);
      let findIndex = this.logList.findIndex(element => element === logName);
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
      let newLogName = fromObject.newLogName;
      let oldName = fromObject.oldName;
      console.log(newLogName, oldName);
      let index = this.logList.findIndex(item => item === oldName);

      if (newLogName) {
        const oldName = this.logList[index];
        // change list
        this.logList[index] = newLogName;
        this.setLogList();
        // change chatLog
        let chatLog = localStorage.getItem(oldName) ?? "";
        localStorage.setItem(newLogName, chatLog);
        localStorage.removeItem(oldName);
        this.clickLogName(newLogName);
      }
    },
    gotoPath(path:string) {
      this.nowPath = path;
      localStorage.setItem('lastPath', this.nowPath);
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
      let lastActiveTime: number = Number(localStorage.getItem('lastActiveTime') ?? new Date().getTime());
      let currentTime: number = new Date().getTime();
      let timeDiff: number = currentTime - lastActiveTime;
      localStorage.setItem('lastActiveTime', currentTime.toString());
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
  width: 150px;
  height: 100%;
  position: fixed;
  top: 0;
  left: -150px;
  z-index: 999;
  transition: transform 0.3s ease-in-out;
}

/* Default sidebar hide */
.sidebar-toggle+.sidebar {
  transform: translateX(-150px);
}

/* sidebar icon */
.sidebar-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 24px;
  cursor: pointer;
  z-index: 1000;
}

/* sidebar active */
.sidebar.active {
  transform: translateX(150px);
}

.blockContent {
  width: 150px;
  flex-shrink: 0;
}
</style>
