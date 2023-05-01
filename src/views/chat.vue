<template>
  <div class="bg-white w-full overflow-y-auto max-h-screen" ref="chatListDom">
    <div class="flex flex-col h-screen">
      <div class="flex flex-nowrap fixed w-full items-baseline top-0 py-4 bg-gray-100">
        <div class="text-2xl font-bold" v-if="!editing">{{ fromLogName }}
          <div class="inline-flex cursor-pointer" @click="editLogName"><svg xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <span class="text-xs text-gray-500" title="tokens">{{ totalTokens }}</span>
        </div>
        <input type="text" class="text-black bg-slate-400" v-else @blur="updateLogName" v-model="newLogName"
          ref="editingLogName">
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
              <div class="pyramid ml-2"></div>
              <div class="prose max-w-full text-sm text-slate-600 leading-relaxed bg-green-300 rounded"
                v-html="mdRender(item.content)"></div>
              <Loding v-if="!item.content && isTalking" />
            </div>
          </template>
        </div>
      </div>
      <div class="sticky bottom-0 w-full p-6 pb-8 bg-gray-100">
        <div>
          <div class="flex">
            <textarea class="input" placeholder="Please input something" v-model="messageContent"
              @keydown="keydownEvent"></textarea>
            <button class="btn" :disabled="isTalking" @click="sendOrSave()">{{ "Send" }}</button>
          </div>
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
    editing: string,
    newLogName: string,
    fromLogName: string,
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
      editing: '',
      newLogName: '',
      fromLogName: "",
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
      if (e.keyCode === 13 && !e.shiftKey) {
        // 不按shift視為電腦上的enter
        this.handleEnterKeydown(e);
      }
    },
    handleEnterKeydown(e: any) {
      // 在手機上按下Return鍵時換行
      if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
        if (e.keyCode === 13) {
          e.preventDefault();
          this.messageContent += '\n';
        }
      } else {
        this.sendOrSave();
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
        if (this.messageList[0].role === "system") {
          this.messageList = [];
        }
        this.messageList.push({ role: "user", content });
        this.clearMessageContent();

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
        const { body, status } = await chat(sendMessageList);
        if (body) {
          this.messageList.push({ role: "assistant", content: "" }); // 有回應, 準備塞進去資料
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
        const { done, value } = await reader.read();
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
          console.log(json)
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
          content: "You are ChatGPT, a large-scale language model trained by OpenAI, and you respond as concisely as possible.",
        });
      this.messageList.push(
        {
          role: "assistant",
          content: `Hello, I am an AI language model and I can provide some common services and information, such as:

Translation: I can translate Chinese to English, English to Chinese, and other languages such as French, Japanese, Spanish, etc.
Consultation Services: If you need advice for any questions, such as health, legal, investment, etc., I will do my best to help you.
Chatting: If you feel lonely or bored, we can talk about some interesting topics to relieve your stress.
Please let me know what kind of help you need, and I will provide relevant information and advice based on your needs.`,
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
    },
    editLogName() {
      this.editing = this.fromLogName;
      this.newLogName = this.fromLogName;
      this.$nextTick(() => {
        if (this.$refs.editingLogName) {
          const refInput = (this.$refs.editingLogName as HTMLInputElement);
          refInput.select();
        }
      })
    },
    updateLogName() {
      this.$emit('updateLogName', { newLogName: this.newLogName, oldName: this.editing });
      this.editing = '';
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

.pyramid {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 20px solid rgb(134, 239, 172, 1);
}
</style>
