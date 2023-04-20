<template>
  <div class="flex flex-col h-screen">
    <div class="flex flex-nowrap fixed w-full items-baseline top-0 px-6 py-4 bg-gray-100">
      <div class="text-2xl font-bold">ChatGPT</div>
      <div class="ml-4 text-sm text-gray-500">Log: {{ chatLogSize }} MB(Max:10)</div>
      <div class="ml-auto px-3 py-2 text-sm cursor-pointer hover:bg-white rounded-md" @click="clickClearLog()">清除Log</div>
      <div class="ml-auto px-3 py-2 text-sm cursor-pointer hover:bg-white rounded-md" @click="clickConfig()">設置</div>
    </div>

    <div class="flex-1 mx-2 mt-20 mb-2" ref="chatListDom">
      <div class="group flex flex-col px-4 py-3 hover:bg-slate-100 rounded-lg"
        v-for="item of messageList.filter((v) => v.role !== 'system')">
        <div class="flex justify-between items-center mb-2">
          <div class="font-bold">{{ roleAlias[item.role] }}：</div>
          <Copy class="invisible group-hover:visible" :content="item.content" />
        </div>
        <div>
          <div class="prose text-sm text-slate-600 leading-relaxed" v-html="md.render(item.content)"></div>
          <Loding v-if="!item.content && isTalking" />
        </div>
      </div>
    </div>

    <div class="sticky bottom-0 w-full p-6 pb-8 bg-gray-100">
      <div class="-mt-2 mb-2 text-sm text-gray-500" v-if="isConfig">請輸入 API Key：</div>
      <div class="flex">
        <input v-if="isConfig" class="input" type="password" paceholder="sk - xxxxxxxxxx" v-model="messageContent">
        <textarea v-else class="input" placeholder="請輸入" v-model="messageContent" @keydown="keydownEvent"></textarea>
        <button class="btn" :disabled="isTalking" @click="sendOrSave()">{{ isConfig ? "保存" : "發送" }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { ChatMessage } from "@/types";
import { ref, watch, nextTick, onMounted } from "vue";
import { chat } from "@/libs/gpt";
import cryptoJS from "crypto-js";
import Loding from "@/components/Loding.vue";
import Copy from "@/components/Copy.vue";
import { md } from "@/libs/markdown";

export default {
  name: 'home',
  components: {
    Loding, Copy
  },
  data() {
    return {
      md: md,
      getSecretKey: "lianginx",
      apiKey: "",
      isConfig: true,
      isTalking: false,
      messageContent: "",
      decoder: new TextDecoder("utf-8"),
      roleAlias: { user: "ME", assistant: "ChatGPT", system: "System" },
      messageList: ref<ChatMessage[]>([]),
      chatLogSize: '0' // log尺寸
    }
  },
  watch: {
    messageList: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      },
      deep: true
    }
  },
  mounted() {
    if (this.getAPIKey()) {
      this.getChatLog();
      this.switchConfigStatus();
      nextTick(() => this.scrollToBottom());
    }
  },
  methods: {
    keydownEvent(e: any) {
      if (e.altKey && e.keyCode === 13) {
        this.messageContent += "\n";
      } else if (e.keyCode === 13) {
        e.preventDefault();
        this.sendChatMessage();
      }
    },
    /**
     * 送出聊天訊息
     */
    async sendChatMessage() {
      let content: string = this.messageContent
      try {
        this.isTalking = true;
        if (this.messageList.length === 2) {
          this.messageList.pop();
        }
        this.messageList.push({ role: "user", content });
        this.clearMessageContent();
        this.messageList.push({ role: "assistant", content: "" });

        const { body, status } = await chat(this.messageList, this.getAPIKey());
        if (body) {
          const reader = body.getReader();
          await this.readStream(reader, status);
        }
      } catch (error: any) {
        this.appendLastMessageContent(error);
      } finally {
        this.isTalking = false;
        this.setChatLog();
        this.calChatLogSize();
      }
    },

    /**
     * 解析chatGpt回傳的stream
     * @param reader 格式
     * @param status response回傳狀態
     */
    async readStream(
      reader: ReadableStreamDefaultReader<Uint8Array>,
      status: number
    ) {
      let partialLine = "";

      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { value, done } = await reader.read();
        if (done) break;

        const decodedText = this.decoder.decode(value, { stream: true });

        if (status !== 200) {
          const json = JSON.parse(decodedText); // start with "data: "
          const content = json.error.message ?? decodedText;
          this.appendLastMessageContent(content);
          return;
        }

        const chunk = partialLine + decodedText;
        const newLines = chunk.split(/\r?\n/);

        partialLine = newLines.pop() ?? "";

        for (const line of newLines) {
          if (line.length === 0) continue; // ignore empty message
          if (line.startsWith(":")) continue; // ignore sse comment message
          if (line === "data: [DONE]") return; //

          const json = JSON.parse(line.substring(6)); // start with "data: "
          const content =
            status === 200
              ? json.choices[0].delta.content ?? ""
              : json.error.message;
          this.appendLastMessageContent(content);
        }
      }
    },
    /**
     * 將chatGpt回傳的單字組合
     */
    appendLastMessageContent(content: string) {
      this.messageList[this.messageList.length - 1].content += content
    },
    /**
     * 傳送指令 或是 儲存api字串
     */
    sendOrSave() {
      if (!this.messageContent.length) return;
      if (this.isConfig) {
        if (this.saveAPIKey(this.messageContent.trim())) {
          this.switchConfigStatus();
        }
        this.clearMessageContent();
      } else {
        this.sendChatMessage();
      }
    },
    /**
     * 按下 清除log
     */
    clickClearLog() {
      this.resetChatLog();
      this.setChatLog();
    },
    /**
     * 開啟設置畫面
     */
    clickConfig() {
      if (!this.isConfig) {
        this.messageContent = this.getAPIKey();
      } else {
        this.clearMessageContent();
      }
      this.switchConfigStatus();
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

    // 取得log
    getChatLog() {
      let chatLog = localStorage.getItem('chatLog');
      if (chatLog) {
        Object.assign(this.messageList, JSON.parse(chatLog));
        this.calChatLogSize();
      } else {
        this.resetChatLog();
        this.setChatLog();
        this.calChatLogSize();
      }
    },
    // 紀錄log
    setChatLog() {
      let saveItem = JSON.stringify(this.messageList);
      localStorage.setItem('chatLog', saveItem);
    },
    // 重置log
    resetChatLog() {
      this.messageList.length = 0;
      this.messageList.push(
        {
          role: "system",
          content: "你是 ChatGPT，OpenAI 訓練的大型語言模型，盡可能簡潔地回答。",
        });
      this.messageList.push(
        {
          role: "assistant",
          content: `你好，我是AI語言模型，我可以提供一些常用服務和信息，例如：
                1. 翻譯：我可以把中文翻譯成英文，英文翻譯成中文，還有其他一些語言翻譯，比如法語、日語、西班牙語等。
                2. 咨詢服務：如果你有任何問題需要咨詢，例如健康、法律、投資等方面，我可以盡可能為你提供幫助。
                3. 閒聊：如果你感到寂寞或無聊，我們可以聊一些有趣的話題，以減輕你的壓力。
                請告訴我你需要哪方面的幫助，我會根據你的需求給你提供相應的信息和建議。`,
        });
    },
    // 計算logsize
    calChatLogSize() {
      let saveItem = JSON.stringify(this.messageList);
      let bytes = new Blob([saveItem]).size;
      let megabytes = bytes / (1024 * 1024);
      // console.log("儲存此 JSON 配置文件所需的 MB 為：" + megabytes + " (max:10 MB)");
      this.chatLogSize = megabytes.toFixed(4);
    },

    // 切換設置狀態
    switchConfigStatus() { this.isConfig = !this.isConfig },

    // 清除輸入框內容
    clearMessageContent() { this.messageContent = "" },

    // 移到畫面最下方
    scrollToBottom() {
      if (!this.$refs.chatListDom) return;
      scrollTo(0, (<HTMLDivElement>this.$refs.chatListDom).scrollHeight);
    }
  }
}
</script>

<style scoped>
pre {
  font-family: "Microsoft JhengHei", -apple-system, "Noto Sans", "Helvetica Neue", Helvetica,
    "Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC", "Hiragino Sans GB",
    "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN",
    "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti",
    SimHei, "WenQuanYi Zen Hei Sharp", sans-serif;
}
</style>
