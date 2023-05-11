<template>
  <div class="w-screen overflow-y-auto max-h-screen" ref="chatListDom">
    <div class="min-h-screen w-full">
      <div class="sticky top-0 pt-4 w-full h-12 bg-gray-100">
        <div class="text-2xl font-bold" v-if="!editing">{{ fromLogName }}
          <div class="inline-flex cursor-pointer" @click="editLogName">
            <edit theme="outline" size="24" fill="#000"/>
          </div>
          <span class="text-xs text-gray-500" title="tokens">{{ totalTokens }}</span>
        </div>
        <input type="text" class="px-4 py-2 text-gray-700 bg-white border rounded-md mr-2 text-black bg-slate-400" v-else @blur="updateLogName" v-model="newLogName"
          ref="editingLogName">
      </div>
      <div class="flex-1 mx-2 mt-20 mb-2">
        <div class="group flex flex-col px-2 py-1 hover:bg-slate-100 rounded-lg" v-for="(item,index) of messageListView" :key="index">
          <div class="flex justify-between items-center">
            <div class="font-bold flex">
              <span>{{ roleAlias[item.role] }}：</span>
              <voice :content="item.content" v-show="!isTalking" />
            </div>
            <CopyContent class="invisible group-hover:visible w-30 h-10" v-show="!isTalking" :content="item.content" :index="index" @deleteItem="deleteItem" />
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
    </div>
    <div class="sticky bottom-0 w-full p-2 bg-gray-100">
      <div>
        <div class="flex">
          <textarea class="input" placeholder="Please input something" v-model="messageContent"
            @keydown="keydownEvent"></textarea>
          <button class="redBtn" v-if="isTalking"  @click="callAbortChat()">Stop</button>
          <button class="btn" v-else @click="sendChatMessage()">Send</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import cryptoJS from "crypto-js";
import { chat, abortChat } from "@/libs/gpt";
import Loding from "@/components/Loding.vue";
import CopyContent from "@/components/Copy.vue";
import Voice from "@/components/Voice.vue";
import { md } from "@/libs/markdown";
import { encoding_for_model, Tiktoken } from '@dqbd/tiktoken';
import { Edit, Delete } from "@icon-park/vue-next";

export default {
  name: 'chat',
  components: {
    Loding, CopyContent, Voice,
    Edit, Delete
  },
  props: {
    sendLogName: {
      type: String,
      default: ''
    }
  },
  data() {
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
      messageList: [] as Array<any>,
      maxTokens: 3072,
      enc: null // log size
    }
  },
  computed: {
    messageListView():any[] {
      return this.messageList.filter((v) => v.role !== 'system');
    }
  },
  watch: {
    // vue: under the same path, and change different chat-log
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
    this.$nextTick(() => this.scrollToBottom());
  },
  beforeDestroy() {
    this.enc.free();
  },
  methods: {
    /**
     * keyboard keydown event
     */
    keydownEvent(e: any) {
      if (e.keyCode === 13) {
        // cellphone
        if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
          e.preventDefault();
          this.messageContent += '\n';
        } else {
          // pc
          if (!e.shiftKey) {
            e.preventDefault();
            this.sendChatMessage();
          }
        }
      }
    },
    mdRender(content: string) {
      return md.render(content);
    },
    /**
     * send message
     */
    async sendChatMessage() {
      if (!this.messageContent.length) return;

      let content: string = this.messageContent
      try {
        this.isTalking = true;
        // first time use
        if (this.messageList[0].role === "system") {
          this.messageList = [];
        }

        this.messageList.push({ role: "user", content });
        this.clearMessageContent();

        let calTokens: number = 0;
        let sendMessageList: Array<any> = [];
        for (let i = this.messageList.length - 1; i >= 0; i--) {
          let newTokens = this.calTiktoken(this.messageList[i].content);

          if (calTokens + newTokens < this.maxTokens) {
            calTokens += newTokens; // accumulation of tokens
            sendMessageList.push(this.messageList[i]);
          } else {
            break;
          }
        }

        sendMessageList = sendMessageList.reverse(); // newest message on top level
        this.messageList.push({ role: "assistant", content: "" }); // waiting for ai answer
        const { body, status } = await chat(sendMessageList);
        if (body) {
          const reader = body.getReader();
          await this.readStream(reader, status);
        }
      } catch (error: any) {
        this.appendLastMessageContent(error);
      } finally {
        this.isTalking = false;
        this.setChatLog();
        this.totalTokens = this.calAllTiktoken(this.messageList);
      }
    },
    /**
     * Parse the stream returned by chatGpt
     * @param reader 格式
     * @param status response status
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
          const content =
            status === 200
              ? json.choices[0].delta.content ?? ""
              : json.error.message;
          this.appendLastMessageContent(content);
        }
      }
    },
    /**
     * combine words to one block (chatGpt block)
     */
    appendLastMessageContent(content: string) {
      this.messageList[this.messageList.length - 1].content += content
    },
    /**
     * Abort chat message
     */
    callAbortChat() {
      abortChat();
    },
    /**
     * get saved chat-log
     *  */ 
    getChatLog(logName: string) {
      let chatLog = localStorage.getItem(logName);
      if (chatLog) {
        this.messageList = JSON.parse(chatLog);
      } else {
        this.resetChatLog();
        this.setChatLog();
      }
      this.totalTokens = this.calAllTiktoken(this.messageList);
    },
    // save log to localStorage
    setChatLog() {
      let saveItem = JSON.stringify(this.messageList);
      localStorage.setItem(this.fromLogName, saveItem);
    },
    // reset log
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
    // clean message content
    clearMessageContent() {
      this.messageContent = ""
    },
    // scroll to screen bottom
    scrollToBottom() {
      if (!this.$refs.chatListDom) return;
      let dom = <HTMLDivElement>this.$refs.chatListDom;
      dom.scrollTop = dom.scrollHeight;
    },
    /**
     * calculate one block tokens
     */
    calTiktoken(text: string) {
      let tokenArray = this.enc.encode_ordinary(text);
      // If there is Chinese, the calculation of token will be inaccurate, probably 1.5~2 times more tokens
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
    },
    /**
     * delete one chat-log block
     * @param index 順序
     */
    deleteItem(index:Number) {
      this.messageList.splice(index, 1);
    },
    speak(content:string) {
      let msg = new window.SpeechSynthesisUtterance();
      msg.text= content;
      msg.volume= 1 ;
      msg.rate= 2 ;  
      msg.pause = 100;   
      window.speechSynthesis.speak(msg);
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
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 8px solid rgb(134, 239, 172, 1);
}
</style>
