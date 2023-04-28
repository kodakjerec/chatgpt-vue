<template>
    <div class="bg-white w-full overflow-y-auto max-h-screen">
      <div class="bg-gray-100">
        <div class="mt-10">
          <label class="block font-medium text-black" for="prompt">Prompt</label>
          <textarea
            class="block w-full mt-1 rounded-md border-red-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="3"
            placeholder="請輸入 Prompt"
            v-model="inputPrompt"
          ></textarea>
        </div>
          <div class="flex">
            <div class="w-1/3">
              <label class="block font-medium text-black" for="number">Number</label>
              <input
                class="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                type="number"
                placeholder="請輸入 Number"
                v-model="inputNumber"
              >
            </div>
            <div class="w-1/3">
              <label class="block font-medium text-black" for="size">Size</label>
              <select
                class="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                v-model="inputSize">
                <option>256x256</option>
                <option>512x512</option>
                <option>1024x1024</option>
              </select>
            </div>
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
      <div>
        <Loding v-if="isTalking" />
        <div v-else>
          <div v-for="(item, index) in results" :key="index">
            <img class="w-1/3 h-1/3" :src="item.url">
          </div>
        </div>
      </div>
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
        decoder: TextDecoder,
        results: Array<any>,
        sampleURL: string,
        inputPrompt: string,
        inputNumber: number,
        inputSize: string
    } {
    return {
        isTalking: false,
        decoder: new TextDecoder("utf-8"),
        results: [],
        sampleURL: "/favicon.ico",
        inputPrompt: "An otter",
        inputNumber: 2,
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
            const { body, status } = await createImage(sendObject);
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
        this.sampleURL = response.data;
      }

      this.results = JSON.parse(this.sampleURL);
    }
  }
};
</script>
