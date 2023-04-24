<template>
  <div class="bg-white w-full overflow-y-auto max-h-screen" ref="chatListDom">
    <div class="flex flex-col h-screen">
      <div class="flex flex-nowrap fixed w-full items-baseline top-0 py-4 bg-gray-100">
        <div class="text-2xl font-bold">{{ fromLogName }}<span class="text-xs text-gray-500" title="tokens">{{
          totalTokens }}</span></div>
      </div>

      <div class="flex-1 mx-2 mt-20 mb-2">
        <div class="group flex flex-col px-4 py-3 hover:bg-slate-100 rounded-lg" v-for="item of messageListView">
          <div class="flex justify-between items-center mb-2">
            <div class="font-bold">{{ roleAlias[item.role] }}：</div>
            <Copy class="invisible group-hover:visible" :content="item.content" />
          </div>
          <!-- chatGPT -->
          <template v-if="item.role !== 'user'">
            <div>
              <div class="prose max-w-full text-sm text-slate-600 leading-relaxed" v-html="mdRender(item.content)"></div>
              <Loding v-if="!item.content && isTalking" />
            </div>
          </template>
          <!-- Me -->
          <template v-else>
            <div>
              <div class="prose max-w-full text-sm text-slate-600 leading-relaxed bg-green-300 rounded"
                v-html="mdRender(item.content)"></div>
              <Loding v-if="!item.content && isTalking" />
            </div>
          </template>
        </div>
      </div>

      <div class="sticky bottom-0 w-full p-6 pb-8 bg-gray-100">
        <div class="flex">
          <textarea class="input" placeholder="Please input something" v-model="messageContent"
            @keydown="keydownEvent"></textarea>
          <button class="btn" :disabled="isTalking" @click="sendOrSave()">{{ "Send" }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { ChatMessage } from "@/types";
import cryptoJS from "crypto-js";
import { ref, nextTick } from "vue";
import { chat } from "@/libs/gpt";
import Loding from "@/components/Loding.vue";
import Copy from "@/components/Copy.vue";
import { md } from "@/libs/markdown";
import { encoding_for_model, Tiktoken } from '@dqbd/tiktoken';

export default {
  name: 'chat',
  components: {
    Loding, Copy
  },
  props: {
    sendLogName: {
      type: String,
      default: ''
    }
  },
  data(): {
    md: any,
    fromLogName: string,
    apiKey: string,
    getSecretKey: string,
    isTalking: boolean,
    messageContent: string,
    totalTokens: number,
    decoder: TextDecoder,
    roleAlias: any,
    messageList: Array<any>,
    enc: any
  } {
    return {
      md: md,
      fromLogName: "",
      apiKey: "",
      getSecretKey: "lianginx",
      isTalking: false,
      messageContent: "",
      totalTokens: 0,
      decoder: new TextDecoder("utf-8"),
      roleAlias: { user: "ME", assistant: "ChatGPT", system: "System" },
      messageList: [],
      enc: null // log尺寸
    }
  },
  computed: {
    messageListView() {
      return this.messageList.filter((v) => v.role !== 'system');
    }
  },
  watch: {
    // 同一個路徑下改變設定,更新對話紀錄
    sendLogName() {
      this.fromLogName = this.sendLogName;
      this.getChatLog(this.fromLogName);
    },
    'messageList.length'() {
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    }
  },
  mounted() {
    this.enc = encoding_for_model("gpt-3.5-turbo");
    this.fromLogName = this.sendLogName;
    this.getChatLog(this.fromLogName);
    nextTick(() => this.scrollToBottom());
  },
  beforeDestroy() {
    this.enc.free();
  },
  methods: {
    /**
     * 鍵盤指令
     */
    keydownEvent(e: any) {
      if (e.altKey && e.keyCode === 13) {
        this.messageContent += "\n";
      } else if (e.keyCode === 13) {
        e.preventDefault();
        this.sendChatMessage();
      }
    },
    mdRender(content: string) {
      return md.render(content);
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

        let calTokens: number = 0;
        let sendMessageList = [];
        for (let i = this.messageList.length - 1; i >= 0; i--) {
          let newTokens = this.calTiktoken(this.messageList[i].content);

          if (calTokens + newTokens < 3072) {
            calTokens += newTokens; // 計算訊息長度總和
            sendMessageList.push(this.messageList[i]);
          } else {
            break;
          }
        }
        sendMessageList = sendMessageList.reverse(); // 原本是倒著算, 要把陣列反過來
        const { body, status } = await chat(sendMessageList, this.getAPIKey());
        if (body) {
          const reader = body.getReader();
          await this.readStream(reader, status);
        }
      } catch (error: any) {
        this.appendLastMessageContent(error);
      } finally {
        this.isTalking = false;
        this.setChatLog(this.fromLogName);
        this.totalTokens = this.calAllTiktoken(this.messageList);
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
      this.sendChatMessage();
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
    getChatLog(logName: string) {
      let chatLog = localStorage.getItem(logName);
      if (chatLog) {
        this.messageList = JSON.parse(chatLog);
      } else {
        this.resetChatLog();
        this.setChatLog(logName);
      }
      this.totalTokens = this.calAllTiktoken(this.messageList);
    },
    // 紀錄log
    setChatLog(logName: string) {
      let saveItem = JSON.stringify(this.messageList);
      localStorage.setItem(logName, saveItem);
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
    // 清除輸入框內容
    clearMessageContent() {
      this.messageContent = ""
    },
    // 移到畫面最下方
    scrollToBottom() {
      if (!this.$refs.chatListDom) return;
      let dom = <HTMLDivElement>this.$refs.chatListDom;
      dom.scrollTop = dom.scrollHeight;
    },
    /**
     * 計算此段的token數量
     */
    calTiktoken(text: string) {
      let tokenArray = this.enc.encode_ordinary(text);
      // 如果有中文, 計算token會不準確, 大概會多1.5~2倍token
      let isChinese = false;
      for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) >= 0x4e00 && text.charCodeAt(i) <= 0x9fff) {
          isChinese = true;
          break;
        }
      }
      let tokens = Math.ceil(tokenArray.length * (isChinese ? 2 : 1));
      return tokens;
    },
    calAllTiktoken(targetArray: Array<any>): number {
      let tokens = 0;
      targetArray.map(item => {
        tokens += this.calTiktoken(item.content);
      })
      return tokens;
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
