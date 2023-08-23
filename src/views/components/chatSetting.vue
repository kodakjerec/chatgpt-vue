<template>
    <div>
        <div id="shadow" class="fixed left-0 top-0 z-1000 w-full h-full overflow-x-hidden overflow-y-auto bg-slate-100">
            <div id="chatSettingDialog" class="relative top-10 z-2 w-full text-center px-6">
                <div class="p-2 rounded border border-black bg-white overflow-y-auto hide-scroll-bar" :class="{ 'shockWindow': shockWindow }">
                    <div id="model_header" class="w-full flex text-center justify-between">
                        <button class="btn" @click="resetValue('settings_chat')">Default</button>
                        <span class="text-2xl font-bold mt-2 text-center">{{ myTitle }}</span>
                        <close class="" theme="filled" size="24" fill="#000000" @click="closeDialog('')" />
                    </div>
                    <div id="model_content" class="flex flex-wrap rounded m-2">
                        <div class="w-full border-t mt-2 pt-2">
                            <label for="temperature" class="text-gray-700 mb2 flex items-center">
                                <span class="w-1/2">Model</span>
                                <select v-model="settings_chat.model" class="input w-1/2" @change="$event => contentSelectChange($event, 'settings_chat')">
                                    <option v-for="(value, key) of modelList" :key="key" :value="value.key">{{ value.key }}</option>
                                </select>
                            </label>
                            <div class="text-left text-sm mt-2">ID of the model to use.</div>
                            <div class="text-left text-sm">要使用的模型ID</div>
                        </div>
                        <div class="w-full border-t mt-2 pt-2">
                            <label for="temperature" class="text-gray-700 mb2 flex items-center">
                                <span class="w-1/2">Temperature: {{ settings_chat.temperature }}</span>
                                <input v-model.number="settings_chat.temperature" class="input w-1/2" type="range" step=".1" placeholder="0 to 2" :min="0" :max="2" @change="$event => contentInputChange($event, 'settings_chat')" />
                            </label>
                            <div class="text-left text-sm mt-2">What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.</div>
                            <div class="text-left text-sm">在0到2之間應該使用哪個選擇？較高的值（例如0.8）會使輸出更加隨機，而較低的值（例如0.2）則會使其更加集中和具有決定性。</div>
                        </div>
                        <div class="w-full border-t mt-2 pt-2">
                            <label for="presence_penalty" class="text-gray-700 mb2 flex items-center">
                                <span class="w-1/2">Presence_penalty: {{ settings_chat.presence_penalty }}</span>
                                <input v-model.number="settings_chat.presence_penalty" class="input w-1/2" type="range" step=".1" placeholder="-2 to 2" :min="-2" :max="2" @change="$event => contentInputChange($event, 'settings_chat')" />
                            </label>
                            <div class="text-left text-sm mt-2">Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.</div>
                            <div class="text-left text-sm">值介於-2.0到2.0之間。正值會根據它們是否在到目前為止的文本中出現來懲罰新的tokens，進一步增加模型談論新主題的可能性。</div>
                        </div>
                        <div class="w-full border-t mt-2 pt-2">
                            <label for="frequency_penalty" class="text-gray-700 mb2 flex items-center">
                                <span class="w-1/2">Frequency_penalty: {{ settings_chat.frequency_penalty }}</span>
                                <input v-model.number="settings_chat.frequency_penalty" class="input w-1/2" type="range" step=".1" placeholder="-2 to 2" :min="-2" :max="2" @change="$event => contentInputChange($event, 'settings_chat')" />
                            </label>
                            <div class="text-left text-sm mt-2">Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.</div>
                            <div class="text-left text-sm">數字介於-2.0和2.0之間。正值會根據文本中現有詞彙的頻率對新令牌進行處罰，減少模型重複原話的可能性。</div>
                        </div>
                    </div>
                    <div id="model_footer">
                        <div class="flex justify-center mt-2">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { storeSettings } from '@/store';
import { gptModelList } from '@/types/gpt';
import { Close } from "@icon-park/vue-next";

export default {
    name: "calendarDialog",
    components: {
        Close
    },
    props: {
        title: {
            type: String,
            default: "Setting"
        }
    },
    data() {
        return {
            myTitle: this.title,
            settings_chat: storeSettings().getSettings("settings_chat"),
            shockWindow: false,
            modelList: gptModelList
        }
    },
    mounted() {
        document.body.addEventListener('click', this.clickWhiteSpace);
    },
    beforeUnmount() {
        document.body.removeEventListener('click', this.clickWhiteSpace);
    },
    methods: {
        // 關閉視窗
        closeDialog(event) {
            this.$emit("close", event);
        },
        // 按到白色區域, 震動視窗
        // TODO 現在會順便關閉視窗
        clickWhiteSpace(event) {
            // 白色方框內按下按鈕, 不關閉
            const promptElement = document.getElementById('chatSettingDialog');
            if (promptElement && promptElement.contains(event.target)) {
                return;
            }
            this.shockWindow = true;

            setTimeout(() => {
                this.shockWindow = false;
                // this.myTitle = this.$t("_calendar_shockWindow");
            }, 50);

            setTimeout(() => {
                this.closeDialog("");
            }, 300);
        },
        inputFocus(event: any) {
            event.target.select();
        },
        contentSelectChange(event: any, myObjectName: string) {
            storeSettings().setSettings(myObjectName, this.settings_chat);
        },
        contentInputChange(event: any, myObjectName: string) {
            storeSettings().setSettings(myObjectName, this.settings_chat);
        },
        resetValue(myObjectName: string) {
            this.settings_chat = storeSettings().resetSettings(myObjectName);
            storeSettings().setSettings(myObjectName, this.settings_chat);
        }
    }
}
</script>

<style scoped>
.shockWindow {
    @apply m-1;
}
</style>