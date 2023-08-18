<script lang="ts" setup>
import { storeSettings, type promptInterface } from '@/store';
import { EfferentFour } from "@icon-park/vue-next";
import { createToaster } from "@meforma/vue-toaster";
import { computed, ref } from 'vue';

const keyword = ref("");
const prompts = computed(()=> {
    if (keyword) {
        return storeSettings().getPrompts.filter((prompt) => prompt.act.toLowerCase().indexOf(keyword.value.toLowerCase())>=0);
    }
    return storeSettings().getPrompts;
})
const appendStyle = ref(1);
const linka = "https://github.com/f/awesome-chatgpt-prompts/blob/main/prompts.csv";
const linkb = "https://github.com/PlexPt/awesome-chatgpt-prompts-zh/blob/main/prompts-zh-TW.json";

const loadData = (filearray:Array<promptInterface>):Array<promptInterface> => {
    let promptsArray = [] as Array<promptInterface>;
    if(appendStyle.value === 2) {
        promptsArray = storeSettings().getPrompts;
    }
    filearray.map(row=>{
        const findIndex = promptsArray.findIndex(item=>item.act===row.act);
        if (findIndex>=0) {
            promptsArray[findIndex] = {
                act: row.act,
                prompt: row.prompt
            }
        } else {
            promptsArray.push({
                act: row.act,
                prompt: row.prompt
            })
        }
    })
    return promptsArray;
}

const importCSV = (event) => {
    if (!event.target) return;
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    const file = files[0];
    (event.target as HTMLInputElement).value = '';
    const reader = new FileReader();

    reader.onload = async (e:any) => {
        // 將檔案內容存儲到data變數中
        const fileContent = e.target.result;
        try {
            // 產生轉化後的array
            let fromArray = [] as Array<promptInterface>;
            fileContent.split("\n").map(row=>{
                if (row) {
                    let items = row.split(",");
                    fromArray.push({
                        act: items[0].replaceAll("\"",""),
                        prompt: items[1].replaceAll("\"","")
                    })
                }
            })
            const promptsArray:Array<promptInterface> = loadData(fromArray);
                
            if(promptsArray) {
                storeSettings().setPrompts(promptsArray);
                createToaster().success("Loading Complete.");
            }
        } catch {
            createToaster().success("Loading Fail.");
        }
    };

    reader.readAsText(file); // 讀取檔案內容，此處假設為純文字檔案
}

const importJSON = (event) => {
    if (!event.target) return;
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    const file = files[0];
    (event.target as HTMLInputElement).value = '';
    const reader = new FileReader();

    reader.onload = (e:any) => {
        // 將檔案內容存儲到data變數中
        const fileContent = e.target.result;
        try {
            // 產生轉化後的array
            let fromArray: Array<promptInterface> = JSON.parse(fileContent);
                
            const promptsArray:Array<promptInterface> = loadData(fromArray);
            if(promptsArray) {
                storeSettings().setPrompts(promptsArray);
                createToaster().success("Loading Complete.");
            }
        } catch {
            createToaster().success("Loading Fail.");
        }
    };

    reader.readAsText(file); // 讀取檔案內容，此處假設為純文字檔案
}

const exportCSV = () =>{
    let fileContent = "";
    storeSettings().getPrompts.map(item=>{
        fileContent += `"${item.act}","${item.prompt}"\n`
    })
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "prompts.csv";
    link.click();
    link.remove();

    createToaster().success("Output File: prompts.csv");
}
</script>

<template>
    <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="0">
        <div class="w-full text-center">
            <label class="text-gray-700 font-bold text-xl">Import</label>
        </div>
        <div class="w-full m-2 flex">
            <div class="radioBtn">
                <input name="appendStyle" id="appendStyle_1" type="radio" :value="1" v-model="appendStyle">
                <label for="appendStyle_1">Overwrite</label>
            </div>
            <div class="radioBtn">
                <input name="appendStyle" id="appendStyle_2" type="radio" :value="2" v-model="appendStyle">
                <label for="appendStyle_2">Append</label>
            </div>
        </div>
        <div class="flex m-1 flex-col text-center">
            <label for="file-upload" class="btn">
                Import CSV
            </label>
            <span class="text-blue-500">
                <a :href="linka" target="_blank">
                    awesome-chatgpt-prompts
                    <efferent-four theme="outline" size="18" fill="#0000ff"/>
                </a>
            </span>
            <input id="file-upload" class="input-file" type="file" accept="*" @change="importCSV" />
        </div>
        <div class="flex m-1 flex-col text-center">
            <label for="file-upload-2" class="btn">
                Import JSON
            </label>
            <span class="text-blue-500">
                <a :href="linkb" target="_blank">
                    awesome-chatgpt-prompts-zh
                    <efferent-four theme="outline" size="18" fill="#0000ff"/>
                </a>
            </span>
            <input id="file-upload-2" class="input-file" type="file" accept="*" @change="importJSON" />
        </div>
    </div>
    <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="1">
        <div class="w-full text-center">
            <label class="text-gray-700 font-bold text-xl">Export</label>
        </div>
        <button class="btn" @click="exportCSV">Export</button>
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
<style scoped>
.radioBtn {
    @apply mr-2 border p-2 rounded hover:bg-blue-300
}
.radioBtn input {
    @apply mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300
}
</style>