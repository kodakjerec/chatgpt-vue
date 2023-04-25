<template>
    <div class="sticky bottom-0 w-full p-6 pb-8 bg-gray-100">
        <div class="-mt-2 mb-2 text-sm text-gray-500 mt-10">請輸入 API Key：</div>
        <div class="flex">
            <input class="input" type="password" paceholder="sk - xxxxxxxxxx" v-model="messageContent">
            <button class="btn" @click="sendOrSave()">{{ "保存" }}</button>
        </div>
    </div>
</template>

<script lang="ts">
import cryptoJS from "crypto-js";

export default {
    name: 'settings',
    data() {
        return {
            apiKey: "",
            getSecretKey: "lianginx",
            messageContent: ""
        }
    },
    mounted() {
        this.messageContent = this.getAPIKey();
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
    }
}
</script>