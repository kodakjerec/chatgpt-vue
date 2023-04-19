<template>
  <div class="flex flex-col h-screen">
    <div class="flex flex-nowrap fixed w-full items-baseline top-0 px-6 py-4 bg-gray-100">
      <div class="text-2xl font-bold">ChatGPT</div>
      <div class="ml-4 text-sm text-gray-500">基於 OpenAI 的 ChatGPT 自然語言模型人工智能對話</div>
      <div
        class="ml-auto px-3 py-2 text-sm cursor-pointer hover:bg-white rounded-md"
        @click="clickConfig()"
      >設置</div>
    </div>

    <div class="flex-1 mx-2 mt-20 mb-2" ref="chatListDom">
      <div
        class="group flex flex-col px-4 py-3 hover:bg-slate-100 rounded-lg"
        v-for="item of messageList.filter((v) => v.role !== 'system')"
      >
        <div class="flex justify-between items-center mb-2">
          <div class="font-bold">{{ roleAlias[item.role] }}：</div>
          <Copy class="invisible group-hover:visible" :content="item.content"/>
        </div>
        <div>
          <div
            class="prose text-sm text-slate-600 leading-relaxed"
            v-html="md.render(item.content)"
          ></div>
          <Loding v-if="!item.content && isTalking"/>
        </div>
      </div>
    </div>

    <div class="sticky bottom-0 w-full p-6 pb-8 bg-gray-100">
      <div class="-mt-2 mb-2 text-sm text-gray-500" v-if="isConfig">請輸入 API Key：</div>
      <div class="flex">
        <input v-if="isConfig" class="input" type="password" :paceholder="sk-xxxxxxxxxx" v-model="messageContent">
        <textarea v-else
          class="input"
          placeholder="請輸入"
          v-model="messageContent"
          @keydown="keydownEvent"
        ></textarea>
        <button class="btn" :disabled="isTalking" @click="sendOrSave()">{{ isConfig ? "保存" : "發送" }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ChatMessage } from "@/types";
  import { ref, watch, nextTick, onMounted } from "vue";
  import { chat } from "@/libs/gpt";
  import cryptoJS from "crypto-js";
  import Loding from "@/components/Loding.vue";
  import Copy from "@/components/Copy.vue";
  import { md } from "@/libs/markdown";

  let apiKey = "";
  let isConfig = ref(true);
  let isTalking = ref(false);
  let messageContent = ref("");
  const chatListDom = ref<HTMLDivElement>();
  const decoder = new TextDecoder("utf-8");
  const roleAlias = { user: "ME", assistant: "ChatGPT", system: "System" };
  const messageList = ref<ChatMessage[]>([
    {
      role: "system",
      content: "你是 ChatGPT，OpenAI 訓練的大型語言模型，盡可能簡潔地回答。",
    },
    {
      role: "assistant",
      content: `你好，我是AI語言模型，我可以提供一些常用服務和信息，例如：

  1. 翻譯：我可以把中文翻譯成英文，英文翻譯成中文，還有其他一些語言翻譯，比如法語、日語、西班牙語等。

  2. 咨詢服務：如果你有任何問題需要咨詢，例如健康、法律、投資等方面，我可以盡可能為你提供幫助。

  3. 閒聊：如果你感到寂寞或無聊，我們可以聊一些有趣的話題，以減輕你的壓力。

  請告訴我你需要哪方面的幫助，我會根據你的需求給你提供相應的信息和建議。`,
    },
  ]);

  onMounted(() => {
    if (getAPIKey()) {
      switchConfigStatus();
    }
  });

  const keydownEvent = (e) => {
    if (e.altKey && e.keyCode === 13) {
          messageContent.value += "\n";
      } else if (e.keyCode === 13) {
        e.preventDefault();
        sendChatMessage();
      }
  };

  /**
   * 送出聊天訊息
   */
  const sendChatMessage = async (content: string = messageContent.value) => {
    try {
      isTalking.value = true;
      if (messageList.value.length === 2) {
        messageList.value.pop();
      }
      messageList.value.push({ role: "user", content });
      clearMessageContent();
      messageList.value.push({ role: "assistant", content: "" });

      const { body, status } = await chat(messageList.value, getAPIKey());
      if (body) {
        const reader = body.getReader();
        await readStream(reader, status);
      }
    } catch (error: any) {
      appendLastMessageContent(error);
    } finally {
      isTalking.value = false;
    }
  };

  const readStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    status: number
  ) => {
    let partialLine = "";

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { value, done } = await reader.read();
      if (done) break;

      const decodedText = decoder.decode(value, { stream: true });

      if (status !== 200) {
        const json = JSON.parse(decodedText); // start with "data: "
        const content = json.error.message ?? decodedText;
        appendLastMessageContent(content);
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
        appendLastMessageContent(content);
      }
    }
  };

  const appendLastMessageContent = (content: string) =>
    (messageList.value[messageList.value.length - 1].content += content);

  const sendOrSave = () => {
    if (!messageContent.value.length) return;
    if (isConfig.value) {
      if (saveAPIKey(messageContent.value.trim())) {
        switchConfigStatus();
      }
      clearMessageContent();
    } else {
      sendChatMessage();
    }
  };

  const clickConfig = () => {
    if (!isConfig.value) {
      messageContent.value = getAPIKey();
    } else {
      clearMessageContent();
    }
    switchConfigStatus();
  };

  const getSecretKey = () => "lianginx";

  const saveAPIKey = (apiKey: string) => {
    if (apiKey.slice(0, 3) !== "sk-" || apiKey.length !== 51) {
      alert("API Key 錯誤，請檢查後重新輸入！");
      return false;
    }
    const aesAPIKey = cryptoJS.AES.encrypt(apiKey, getSecretKey()).toString();
    localStorage.setItem("apiKey", aesAPIKey);
    return true;
  };

  const getAPIKey = () => {
    if (apiKey) return apiKey;
    const aesAPIKey = localStorage.getItem("apiKey") ?? "";
    apiKey = cryptoJS.AES.decrypt(aesAPIKey, getSecretKey()).toString(
      cryptoJS.enc.Utf8
    );
    return apiKey;
  };

  const switchConfigStatus = () => (isConfig.value = !isConfig.value);

  const clearMessageContent = () => (messageContent.value = "");

  const scrollToBottom = () => {
    if (!chatListDom.value) return;
    scrollTo(0, chatListDom.value.scrollHeight);
  };

  watch(messageList.value, () => nextTick(() => scrollToBottom()));
</script>

<style scoped>
pre {
  font-family: -apple-system, "Noto Sans", "Helvetica Neue", Helvetica,
    "Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC", "Hiragino Sans GB",
    "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN",
    "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti",
    SimHei, "WenQuanYi Zen Hei Sharp", sans-serif;
}
</style>
