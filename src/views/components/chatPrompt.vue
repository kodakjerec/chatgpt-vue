<template>
    <div id="prompt" class="divFrame flex flex-col" @blur="getPrompt('')">
        <div class="grow overflow-y-scroll">
                <template class="overflow-y-scroll" v-for="item of filterPrompts">
                    <div class="m-4" @click="getPrompt(item.prompt)">{{ item.act }}</div>
                </template>
        </div>
        <input type="text" class="" placeholder="Search in Prompts DataBase" v-model="keyword">
    </div>
</template>

<script lang="ts" setup>
import { storeSettings } from '@/store';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const keyword = ref("");

const filterPrompts = computed(()=> {
    if (keyword) {
        return storeSettings().getPrompts.filter((prompt) => prompt.act.toLowerCase().indexOf(keyword.value.toLowerCase())>=0);
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
    @apply absolute bottom-20 right-2 h-96 z-10 bg-white rounded-lg shadow-xl border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 dark:bg-gray-800
}
input {
    @apply text-gray-800 dark:text-white p-3 text-sm border-none bg-gray-200 dark:bg-gray-600 m-0 w-full mr-0 h-8 focus:outline-none
}
</style>