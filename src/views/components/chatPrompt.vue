<template>
    <div id="prompt" class="divFrame group" @blur="getPrompt('')">
        <ul class="" v-for="item of filterPrompts">
            <li class="" @click="getPrompt(item.prompt)">{{ item.act }}</li>
        </ul>
        <input type="text" class="" placeholder="Search" v-model="keyword">
        <div class="text-sm px-4 py-2 w-max">Prompts DataBase</div>
    </div>
</template>

<script lang="ts" setup>
import { storeSettings } from '@/store';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const keyword = ref("");

const filterPrompts = computed(()=> {
    if (keyword) {
        return storeSettings().getPrompts.filter((prompt) => prompt.act.toLowerCase().indexOf(keyword.value.toLowerCase())>=0).slice(0,15);
    }
    return storeSettings().getPrompts;
})

onMounted(() => {
    document.body.addEventListener('click', hidePrompt);
})
onBeforeUnmount(() => {
    document.body.removeEventListener('click', hidePrompt);
})

const hidePrompt = (event) => {
    const promptElement = document.getElementById('prompt');
    if (promptElement && !promptElement.contains(event.target)) {
        getPrompt("");
    }
}

const emits = defineEmits<{
    "getPrompt": [prompt:string]
}>()

const getPrompt = (prompt) => {
    emits("getPrompt", prompt);
}
</script>

<style scoped>
.divFrame {
    @apply absolute bottom-20 right-2 z-10 bg-white rounded-lg shadow-xl border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 dark:bg-gray-800 opacity-90
}
ul {
    @apply text-sm text-gray-700 dark:text-gray-200 p-0 m-0 max-w-sm max-md:max-w-[90vw] max-h-32 overflow-auto
}
li {
    @apply px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer text-start w-full
}
input {
    @apply text-gray-800 dark:text-white p-3 text-sm border-none bg-gray-200 dark:bg-gray-600 m-0 w-full mr-0 h-8 focus:outline-none
}
</style>