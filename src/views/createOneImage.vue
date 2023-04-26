<template>
    <div class="bg-white w-full overflow-y-auto max-h-screen">
      <div class="mt-10">
        <label class="block font-medium text-black" for="prompt">Prompt</label>
        <textarea
          class="block w-full mt-1 rounded-md border-red-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows="3"
          placeholder="請輸入 Prompt"
          v-model="inputPrompt"
        ></textarea>
      </div>
      <div>
        <label class="block font-medium text-black" for="number">Number</label>
        <input
          class="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          type="number"
          placeholder="請輸入 Number"
          v-model="inputNumber"
        >
      </div>
      <div>
        <label class="block font-medium text-black" for="size">Size</label>
        <select
          class="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          v-model="inputSize">
          <option>256x256</option>
          <option>512x512</option>
          <option>1024x1024</option>
        </select>
      </div>
      <div>
        <button
          class="btn"
          id="createButton"
          :disabled="isTalking"
          @click="createImage"
        >Create</button>
      </div>
    </div>
    <!-- images -->
    <Loding v-if="isTalking" />
    <div v-else>
      <img class="w-100 h-50" :src="resultURL">
    </div>
</template>

<script lang="ts">
import cryptoJS from "crypto-js";
import { createImage } from "@/libs/gpt";
import Loding from "@/components/Loding.vue";

export default {
  name: "createOneImage",
  components: {
    Loding
  },
  data(): {
        isTalking: boolean,
        apiKey: string,
        getSecretKey: string,
        decoder: TextDecoder,
        resultURL: string,
        inputPrompt: string,
        inputNumber: number,
        inputSize: string
    } {
    return {
        isTalking: false,
        apiKey: "",
        getSecretKey: "lianginx",
        decoder: new TextDecoder("utf-8"),
        resultURL: "/favicon.ico",
        inputPrompt: "An otter",
        inputNumber: 1,
        inputSize: "256x256"
    }
  },
  methods: {
    async createImage() {
        this.isTalking = true;
        let sendObject = {
            prompt: this.inputPrompt,
            n: this.inputNumber,
            size: this.inputSize
        };
        try {
            const { body, status } = await createImage(sendObject, this.getAPIKey());
            if (body) {
                const reader = body.getReader();
                await this.readStream(reader, status);
            }
        } catch (error: any) {
        } finally {
        this.isTalking = false;
        }
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
          return;
        }

        // 回傳URL
        let response = JSON.parse(decodedText);
        this.resultURL = response.data[0].url;
        console.log(this.resultURL)

      }
    }
  }
};
</script>
