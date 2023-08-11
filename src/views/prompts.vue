<script lang="ts" setup>
import { storeSettings, type promptInterface } from '@/store';
import { createToaster } from "@meforma/vue-toaster";
import { computed, onMounted, ref } from 'vue';

const keyword = ref("");
const prompts = computed(()=> {
    if (keyword) {
        return storeSettings().getPrompts.filter((prompt) => prompt.act.toLowerCase().indexOf(keyword.value.toLowerCase())>=0);
    }
    return storeSettings().getPrompts;
})

const loadCSV = (fileContent) => {
    let promptsArray = [] as Array<promptInterface>;
    const filearray = fileContent.split("\n");
    filearray.map(row=>{
        if (row) {
            let items = row.split(",");
            promptsArray.push({
                act: items[0].replaceAll("\"",""),
                prompt: items[1].replaceAll("\"","")
            });
        }
    })
    storeSettings().setPrompts(promptsArray);
    createToaster().success("Loading Complete.")
}

const importCSV = (event) => {
    if (!event.target) return;
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    const file = files[0];
    (event.target as HTMLInputElement).value = '';
        const reader = new FileReader();

        reader.onload = (e:any) => {
            // 將檔案內容存儲到data變數中
            const fileContent = e.target.result;
            loadCSV(fileContent);
        };

        reader.readAsText(file); // 讀取檔案內容，此處假設為純文字檔案
}
</script>

<template>
    <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="0">
        <div class="w-full text-center">
            <label class="text-gray-700 font-bold text-xl">Import</label>
        </div>
        <input type="file" acept="*" ref="fileInput" @change="importCSV">
    </div>
    <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="1">
        <div class="w-full text-center">
            <label class="text-gray-700 font-bold text-xl">Export</label>
        </div>
    </div>
    <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="2">
        <div class="w-full flex text-center">
            <div class="flex items-center w-1/3">
                <input class="input w-full" placeholder="Search" v-model="keyword">
            </div>
            <label class="text-gray-700 font-bold text-xl w-1/3">
                <span>List</span>
                <span class="text-gray-500 text-xs">{{ " " + prompts.length }}</span>
            </label>
            <div class="flex items-center w-1/3">
            </div>
        </div>
        <div>
            <div v-for="item of prompts" class="my-2">
                <h6 class="cursor-pointer bg-gray-200 text-lg font-bold">{{ item.act }}</h6>
                <div class="border-l-4 border-gray-200">{{ item.prompt }}</div>
            </div>
        </div>
    </div>
</template>