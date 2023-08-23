<script lang="ts" setup>
import { storeSettings } from '@/store/index';
import { Delete, Edit, MenuUnfold, Photograph, Plus, Setting, TipsOne, Translate } from "@icon-park/vue-next";
import { computed, nextTick, ref } from 'vue';

let sidebarActive = ref(false); // 顯示sidebar
const sidebar = ref(null);
let editingLogName = ref<HTMLInputElement| null>(null);
let oldLogName = ref(""); // 是否正在編輯標題文字, 並作為儲存舊文字
let newLogName = ref(""); // 新文字

const lastPath = computed(() => storeSettings().getLastPath);
const logList = computed(() => storeSettings().getLogList );
const selectLog = computed(() => {
    if (lastPath.value.indexOf("chat")>=0) {
        return lastPath.value.replace("chat/","");
      }
      return "";
})
/**
 * click sidebar
 */
const toggleSidebar = (event) => {
    sidebarActive.value = true;
}
/**
 * close sidebar
 */
const closeSidebar = (event) => {
    sidebarActive.value = false;
}

/**
 * add new chat block
 */
const newChatLog = () => {
    let generatedString: string = '';
    let startIndex: number = 1;
    let isDuplicate: boolean = true;

    while (isDuplicate) {
    // 生成一個隨機6個字符的字符串
    generatedString = 'chat' + startIndex.toString();

    // 檢查新字符串是否已經存在於列表中
    if (!logList.value.includes(generatedString)) {
        isDuplicate = false;
    } else {
        generatedString = '';
        startIndex++;
    }
    }
    clickLogName(generatedString);
}
/**
 * delete one chat block
 */
const delChatLog = (logName: string) => {
    storeSettings().delLogData(logName);
    
    if(logList.value.length===0) {
        newChatLog();
    } else {
        clickLogName(logList.value[0]);
    }
}
/**
 * select one chat
 */
const clickLogName = (logName: string) => {
    gotoPath('chat/' + logName);
}
const editLogName = async (item) => {
    oldLogName.value = item;
    newLogName.value = item;

    await nextTick()
    if (editingLogName.value) {
        const refInput = (editingLogName.value[0] as HTMLInputElement);
        refInput.select();
    }
}

const updateLogName = () => {
    if (newLogName && newLogName.value !== oldLogName.value) {
        // change chatLog
        const chatLog = storeSettings().getLogData(oldLogName.value);
        storeSettings().setLogData(newLogName.value, chatLog);
        storeSettings().delLogData(oldLogName.value);
        clickLogName(newLogName.value);
    }
    // finally
    oldLogName.value = "";
    newLogName.value = "";
}

const gotoPath = (path: string) => {
    storeSettings().setLastPath(path);
}

</script>

<template>
    <div v-if="!sidebarActive" class="fixed top-1 right-1 w-8 h-8 cursor-pointer z-1000 bg-gray-100 rounded" @click="toggleSidebar">
        <menu-unfold theme="outline" size="30" fill="#333" />
    </div>
    <div ref="sidebar" class="bg-gray-800 text-white px-4 sidebar" :class="{ active: sidebarActive }" tabindex="0">
        <ul class="mt-8 flex flex-col justify-between cursor-pointer">
            <li class="sidebarLi"
                :class="{ 'text-yellow-300': lastPath === 'home' }"
                @click="gotoPath('home')">
                <span>Home</span>
            </li>
            
            <li class="sidebarLi" @click="newChatLog()">
                <div class="flex items-center">
                <plus theme="outline" size="24" fill="#fff" />
                New Chat
                </div>
            </li>
            <div class="flex" v-for="(item, index) in logList" :key="index">
                <li class="sidebarLi">
                    <div v-if="oldLogName !== item" class="w-full" :class="{ 'text-yellow-300': selectLog === item }" @click="clickLogName(item)">
                        <span class="inline-block">{{ item }}</span>
                    </div>
                    <input v-else type="text" class="border rounded-md bg-transparent" @blur="updateLogName" v-model="newLogName" ref="editingLogName">
                </li>
                <div v-if="!oldLogName">
                    <edit theme="outline" size="20" fill="#fff" class="mt-3" @click="editLogName(item)" />
                    <delete v-if="logList.length>1" theme="outline" size="20" fill="#fff" class="mt-3" @click="delChatLog(item)" />
                </div>
            </div>
            
            <li class="sidebarLi"
                :class="{ 'text-yellow-300': lastPath === 'prompts' }"
                @click="gotoPath('prompts')">
                <div class="flex items-center">
                <tips-one theme="outline" size="24" fill="#fff" />
                Prompts
                </div>
            </li>
            
            <li class="sidebarLi"
                :class="{ 'text-yellow-300': lastPath === 'settings' }"
                @click="gotoPath('settings')">
                <div class="flex items-center">
                <setting theme="outline" size="24" fill="#fff" />
                Settings
                </div>
            </li>
            
            <li class="sidebarLi"
                :class="{ 'text-yellow-300': lastPath === 'transcription' }"
                @click="gotoPath('transcription')">
                <div class="flex items-center">
                <translate theme="outline" size="24" fill="#fff" />
                transcription
                </div>
            </li>
            
            <li class="sidebarLi"
                :class="{ 'text-yellow-300': lastPath === 'translation' }"
                @click="gotoPath('translation')">
                <div class="flex items-center">
                <translate theme="outline" size="24" fill="#fff" />
                translation
                </div>
            </li>
            
            <li class="sidebarLi"
                :class="{ 'text-yellow-300': lastPath === 'createOneImage' }"
                @click="gotoPath('createOneImage')">
                <div class="flex items-center">
                <photograph theme="outline" size="24" fill="#fff" />
                Image
                </div>
            </li>
        </ul>
    </div>
    <!-- shadow -->
    <div v-if="sidebarActive" class="absolute w-full h-screen bg-slate-100 opacity-60 z-10" @click="closeSidebar"></div>
</template>

<style scoped>
.sidebarLi {
    @apply py-2 border-t border-gray-700 flex items-center hover:bg-slate-700 hover:rounded grow
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