<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="bg-gray-800 text-white w-1/6 px-4">
      <ul class="mt-8 flex flex-col justify-between">
        <li class="py-2 border-t border-gray-700 flex items-center newChat">
          <div class="flex items-center" @click="newChatLog()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </div>
        </li>
        <li class="py-2 border-t border-gray-700 flex items-center" v-for="(item, index) in logList" :key="index">
          <div :class="{ 'text-green': selectLog === item }" v-if="item !== editing" @dblclick="editLogName(item)"
            @click="clickLogName(item)">{{ item }}</div>
          <input type="text" class="update-input" v-else @keyup.enter="updateLogName(index)" @blur="cancelUpdateLogName"
            v-model="newLogName" ref="editingLogName">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-12 0 36 24" stroke-width="1.5"
            stroke="currentColor" class="w-6 h-6 trashCan" v-show="logList.length > 1" @click="delChatLog(item)">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </li>
        <li class="mt-auto py-2 border-t border-b border-gray-700">
          <router-link to="/settings">Settings</router-link>
        </li>
      </ul>
    </div>
    <!-- Content -->
    <RouterView />
  </div>
</template>
<script>
export default {
  name: 'App',
  data() {
    return {
      selectLog: '',
      editing: '',
      newLogName: '',
      logList: [],
      messageList: []
    }
  },
  mounted() {
    this.getLogList();
    this.clickLogName(this.logList[0]);
    this.setLogList();
  },
  methods: {
    /**
     * 取得所有的 對話紀錄清單
     */
    getLogList() {
      let logList = localStorage.getItem('logList');
      if (logList) {
        Object.assign(this.logList, JSON.parse(logList));
      } else {
        this.logList = ["chatGPT"];
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
      let generatedString = ""
      const alphabet = "abcdefghijklmnopqrstuvwxyz"
      const stringLength = 6
      let isDuplicate = true

      while (isDuplicate) {
        // 生成一個隨機6個字符的字符串
        for (let i = 0; i < stringLength; i++) {
          generatedString += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
        }

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
    delChatLog(logName) {
      if (this.logList.length < 2) return;

      localStorage.removeItem(logName);
      let findIndex = this.logList.findIndex(element => element === logName);
      if (findIndex > -1) {
        this.logList.splice(findIndex, 1);
        this.setLogList();
      }
      this.clickLogName(this.logList[0]);
    },
    editLogName(item) {
      this.editing = item;
      this.newLogName = item;
      this.$nextTick(() => {
        const refInput = this.$refs.editingLogName[0];
        refInput.select();
      })
    },
    updateLogName(index) {
      this.editing = '';
      this.newLogName = this.newLogName.trim();

      // 這裡可以連結 API 更新 item
      if (this.newLogName) {
        const oldName = this.logList[index];
        // change list
        this.logList[index] = this.newLogName;
        this.setLogList();
        // change chatLog
        let chatLog = localStorage.getItem(oldName);
        localStorage.setItem(this.newLogName, chatLog);
        localStorage.removeItem(oldName);
        this.clickLogName(this.newLogName);
      }
    },
    cancelUpdateLogName() {
      this.editing = '';
    },
    /**
     * 按下按鈕 chatlog
     */
    clickLogName(logName) {
      this.selectLog = logName;
      this.gotoChat();
    },
    /**
     * 跳頁
     */
    gotoChat() {
      this.$router.push({ name: 'chat', params: { sendLogName: this.selectLog } })
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

.content {
  max-height: 100vh;
}

.trashCan {
  cursor: pointer;
  color: gray;
}

.newChat:hover {
  cursor: pointer;
  background-color: rgba(17, 24, 39, 0.5);
  border-radius: 10px;
}

.trashCan:hover {
  cursor: pointer;
  color: red;
}

.text-green {
  color: green;
}

.update-input {
  background-color: #ccc;
  color: black;
}
</style>
