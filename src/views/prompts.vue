<script lang="ts" setup>
import { storeSettings, type promptInterface } from '@/store';
import { createToaster } from "@meforma/vue-toaster";
import { computed } from 'vue';
import * as awesomeChatGPTPrompts from '@/assets/prompts.csv';

const prompts = computed(()=> storeSettings().getPrompts)

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

if (prompts.value.length===0) {
    loadCSV(awesomeChatGPTPrompts);
}
</script>

<template>
    <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="0">
        <div class="w-full text-center my-1">
            <label class="text-gray-700 font-bold text-xl">Import</label>
        </div>
        <input type="file" acept="*" ref="fileInput" @change="importCSV">
    </div>
    <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="1">
        <div class="w-full text-center my-1">
            <label class="text-gray-700 font-bold text-xl">Export</label>
        </div>
    </div>
    <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="2">
        <div class="w-full text-center my-1">
            <label class="text-gray-700 font-bold text-xl">List</label>
        </div>
        <div>
            <div v-for="item of prompts" class="my-2">
                <h6 class="cursor-pointer bg-gray-200 text-lg font-bold">{{ item.act }}</h6>
                <div class="border-l-4 border-black">{{ item.prompt }}</div>
            </div>
        </div>
    </div>
</template>