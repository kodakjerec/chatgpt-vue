<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="sidebar-toggle" @click="toggleSidebar">
      Menu
    </div>
    <div class="bg-gray-800 text-white px-4 sidebar" :class="{ active: sidebarActive }">
      <ul class="mt-8 flex flex-col justify-between cursor-pointer">
        <li class="py-2 border-t border-gray-700 flex items-center" @click="toggleSidebar">
          <span>Hide Menu</span>
        </li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="goHome()">
          <span>Home</span>
        </li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="newChatLog()">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </div>
        </li>
        <li class="py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded" @click="clickLogName(item)"
          v-for="(item, index) in logList" :key="index">
          <div :class="{ 'text-yellow-300': selectLog === item }" v-if="item !== editing" @dblclick="editLogName(item)"
            >{{ item }}</div>
          <input type="text" class="text-black bg-slate-400" v-else @blur="updateLogName(index)" v-model="newLogName"
            ref="editingLogName">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-12 0 36 24" stroke-width="1.5"
            stroke="currentColor" class="w-6 h-6 text-gray-500 hover:text-red-500" v-show="logList.length > 1"
            @click="delChatLog(item)">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </li>
        <li class="mt-auto py-2 border-t border-b border-gray-700 hover:bg-slate-700 hover:rounded" @click="goSettings()">
          <span>Settings</span>
        </li>
      </ul>
    </div>
    <!-- Content -->
    <div class="blockContent" v-if="sidebarActive"></div>
    <RouterView />
  </div>
</template>
<script lang="ts">
import { faker } from '@faker-js/faker';

export default {
  name: 'App',
  data(): {
    selectLog: string,
    editing: string,
    newLogName: string,
    logList: Array<string>,
    messageList: Array<any>,
    sidebarActive: boolean
  } {
    return {
      selectLog: '',
      editing: '',
      newLogName: '',
      logList: [],
      messageList: [],
      sidebarActive: false
    }
  },
  mounted() {
    this.getLogList();
  },
  methods: {
    /**
     * 取得所有的 對話紀錄清單
     */
    getLogList() {
      let logList = localStorage.getItem('logList');
      if (logList) {
        Object.assign(this.logList, JSON.parse(logList));
      }
    },
    /**
     * 儲存 對話紀錄清單
     */
    setLogList() {
      localStorage.setItem('logList', JSON.stringify(this.logList));
    },
    /**
     * 新增一個對話
     */
    newChatLog() {
      let generatedString: string = ""
      const stringLength: number = 6
      let isDuplicate: boolean = true

      while (isDuplicate) {
        // 生成一個隨機6個字符的字符串
        generatedString = faker.internet.userName();

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
     * 刪除一個對話
     */
    delChatLog(logName: string) {
      if (this.logList.length < 2) return;

      localStorage.removeItem(logName);
      let findIndex = this.logList.findIndex(element => element === logName);
      if (findIndex > -1) {
        this.logList.splice(findIndex, 1);
        this.setLogList();
      }
      this.clickLogName(this.logList[0]);
    },
    editLogName(item: any) {
      this.editing = item;
      this.newLogName = item;
      this.$nextTick(() => {
        if (this.$refs.editingLogName) {
          const refInput = (this.$refs.editingLogName as HTMLInputElement[])[0];
          refInput.select();
        }
      })
    },
    updateLogName(index: number) {
      this.editing = '';
      this.newLogName = this.newLogName.trim();

      // 這裡可以連結 API 更新 item
      if (this.newLogName) {
        const oldName = this.logList[index];
        // change list
        this.logList[index] = this.newLogName;
        this.setLogList();
        // change chatLog
        let chatLog = localStorage.getItem(oldName) ?? "";
        localStorage.setItem(this.newLogName, chatLog);
        localStorage.removeItem(oldName);
        this.clickLogName(this.newLogName);
      }
    },
    /**
     * 按下按鈕 chatlog
     */
    clickLogName(logName: string) {
      this.selectLog = logName;
      this.gotoChat();
    },
    /**
     * 跳頁
     */
    gotoChat() {
      this.$router.push({ name: 'chat', params: { sendLogName: this.selectLog } })
    },
    goHome() {
      this.$router.push({ name: 'home' });
    },
    goSettings() {
      this.$router.push({ name: 'settings' });
    },
    toggleSidebar() {
      this.sidebarActive = !this.sidebarActive;
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

/* 預設側邊欄樣式 */
.sidebar {
  width: 150px;
  height: 100%;
  position: fixed;
  top: 0;
  left: -150px;
  z-index: 999;
  transition: transform 0.3s ease-in-out;
}

/* 預設側邊欄隱藏 */
.sidebar-toggle+.sidebar {
  transform: translateX(-150px);
}

/* 小方塊樣式 */
.sidebar-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 24px;
  cursor: pointer;
  z-index: 1000;
}

/* 側邊欄展開時的樣式 */
.sidebar.active {
  transform: translateX(150px);
}

.blockContent {
  width: 150px;
  flex-shrink: 0;
}</style>
