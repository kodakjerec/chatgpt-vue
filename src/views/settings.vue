<template>
    <div class="w-screen overflow-y-auto max-h-screen">
        <div class="h-full w-full">
            <div class="sticky top-0 pt-4 w-full h-12 bg-gray-100"></div>
            <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="0">
                <div class="w-full text-center my-1">
                    <label class="text-gray-700 font-bold text-xl">API Key</label>
                </div>
                <div class="mb-2 text-sm text-gray-500">Input API Key：</div>
                <div class="flex w-full">
                    <input class="input" type="password" paceholder="sk - xxxxxxxxxx" v-model="messageContent">
                    <button class="btn" @click="sendOrSave()">Save</button>
                </div>
            </div>
            <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="1" @focus="showChatTooltip('')">
                <div class="w-full text-center my-1 flex">
                    <div class="w-1/3"></div>
                    <label class="text-gray-700 font-bold text-xl w-1/3">Chat</label>
                    <div class="w-1/3 flex justify-end">
                        <button class="btn" @click="resetChatValue()">Default</button>
                    </div>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">model</span>
                        <select v-model="chat.model"
                                class="input"
                                id= "model"
                                name= "model" @change="$event=>chatValueChange($event)" @focus="showChatTooltip('model')">
                            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                            <option value="gpt-4">gpt-4</option>
                        </select>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Temperature</span>
                        <input v-model.number.trim.lazy="chat.temperature"
                                class="input"
                                id= "temperature"
                                name= "temperature"
                                type ="number"
                                step =".1"
                                placeholder="0 to 2"
                                required :min="0" :max="2" @change="$event=>chatValueChange($event)" @focus="showChatTooltip('temperature')"/>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="presence_penalty" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Presence_penalty</span>
                        <input v-model.number.trim.lazy="chat.presence_penalty"
                                class="input"
                                id= "presence_penalty"
                                name= "presence_penalty"
                                type ="number"
                                step =".1"
                                placeholder="-2 to 2"
                                required :min="-2" :max="2" @change="$event=>chatValueChange($event)" @focus="showChatTooltip('presence_penalty')"/>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="frequency_penalty" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Frequency_penalty</span>
                        <input v-model.number.trim.lazy="chat.frequency_penalty"
                                class="input"
                                id= "frequency_penalty"
                                name= "frequency_penalty"
                                type ="number"
                                step =".1"
                                placeholder="-2 to 2"
                                required :min="-2" :max="2" @change="$event=>chatValueChange($event)" @focus="showChatTooltip('frequency_penalty')"/>
                    </label>
                </div>
                <div class="w-full text-right mt-2">
                    <p class="text-justify text-yellow-700" v-show="chatTooltipText">{{ chatTooltipText }}<br>{{ chatTooltipTextTw }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import cryptoJS from "crypto-js";

interface MyObject {
  [key: string]: any;
}

export default {
    name: 'settings',
    data() {
        return {
            apiKey: "",
            getSecretKey: "lianginx",
            messageContent: "",
            chat: {
                model: 'gpt-3.5-turbo',
                temperature: 1,
                presence_penalty: 0,
                frequency_penalty: 0
            },
            chatTooltipText: "",
            chatTooltipTextTw: ""
        }
    },
    mounted() {
        this.messageContent = this.getAPIKey();
        this.getSettingsChat();
    },
    methods: {
        sendOrSave() {
            this.saveAPIKey(this.messageContent.trim())
        },

        /**
         * 儲存apiKey
         * @param apiKey 明文apiKey
         */
        saveAPIKey(apiKey: string) {
            if (apiKey.slice(0, 3) !== "sk-" || apiKey.length !== 51) {
                alert("API Key 錯誤，請檢查後重新輸入！");
                return false;
            }
            const aesAPIKey = cryptoJS.AES.encrypt(apiKey, this.getSecretKey).toString();
            localStorage.setItem("apiKey", aesAPIKey);
            return true;
        },
        /**
         * 取得apiKey
         *  @return 明文apiKey
         */
        getAPIKey() {
            if (this.apiKey) return this.apiKey;
            const aesAPIKey = localStorage.getItem("apiKey") ?? "";
            this.apiKey = cryptoJS.AES.decrypt(aesAPIKey, this.getSecretKey).toString(
                cryptoJS.enc.Utf8
            );
            return this.apiKey;
        },
        /**
         * 取得chat settings
         * @return chat settings
         */
        getSettingsChat() {
            const settings_Chat = localStorage.getItem("settings_chat");
            if (!settings_Chat) {
                this.resetChatValue();
                return;
            }

            Object.assign(this.chat, JSON.parse(settings_Chat));
        },
        /**
         * 調整chat設定
         */
        chatValueChange(event: any) {
            const target = event.target as HTMLInputElement;

            if (target.value<target.min) {
                if(target.name) {
                    (this.chat as MyObject)[target.name] = parseInt(target.min);
                }
            } else if (target.value>target.max) {
                if(target.name) {
                    (this.chat as MyObject)[target.name] = parseInt(target.max);
                }
            }
            localStorage.setItem('settings_chat', JSON.stringify(this.chat));
        },
        /**
         * 重設chat設定
         */
        resetChatValue() {
            this.chat = {
                model: 'gpt-3.5-turbo',
                temperature: 1,
                presence_penalty: 0,
                frequency_penalty: 0
            };
            localStorage.setItem('settings_chat', JSON.stringify(this.chat));
        },
        /**
         * 顯示說明
         */
        showChatTooltip(type: string) {
            switch(type) {
                case "model":
                    this.chatTooltipText = "ID of the model to use. GPT-4 is currently in a limited beta and only accessible to those who have been granted access.";
                    this.chatTooltipTextTw = "要使用的模型ID。GPT-4目前處於有限的測試版階段，只有獲得許可的人才能使用。";
                    break;
                case "temperature":
                    this.chatTooltipText = "What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.";
                    this.chatTooltipTextTw = "在0到2之間應該使用哪個選擇？較高的值（例如0.8）會使輸出更加隨機，而較低的值（例如0.2）則會使其更加集中和具有決定性。";
                    break;
                case "presence_penalty":
                    this.chatTooltipText = "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.";
                    this.chatTooltipTextTw = "值介於-2.0到2.0之間。正值會根據它們是否在到目前為止的文本中出現來懲罰新的tokens，進一步增加模型談論新主題的可能性。";
                    break;
                case "frequency_penalty":
                    this.chatTooltipText = "Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.";
                    this.chatTooltipTextTw = "在 0 到2之間選擇使用哪種取樣，高值如 0.8 將使輸出更加隨機，而低值 如 0.2則會讓它變得更有焦點和確定性。";
                    break;
                default:
                    this.chatTooltipText = "";
                    this.chatTooltipTextTw = "";
                    break;
            }
        }
    }
}
</script>