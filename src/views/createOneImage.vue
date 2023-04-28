<template>
  <div class="bg-white w-full overflow-y-auto max-h-screen">
    <div class="py-4 bg-gray-100 w-full h-10"></div>
    <div class="bg-gray-100">
      <div class="">
        <label class="block font-medium text-black" for="prompt">Prompt</label>
        <textarea class="block w-full mt-1 rounded-md border-red-300 shadow-sm input" rows="3" placeholder="請輸入 Prompt"
          v-model="inputPrompt"></textarea>
      </div>
      <div class="flex">
        <div class="w-1/3 mx-2">
          <label class="block font-medium text-black" for="number">Number</label>
          <input class="block w-full mt-1 rounded-md border-black-300 shadow-sm input" type="number"
            placeholder="請輸入 Number" v-model="inputNumber">
        </div>
        <div class="w-1/3 mx-2">
          <label class="block font-medium text-black" for="size">Size</label>
          <select class="block w-full mt-1 rounded-md border-gray-300 shadow-sm input" v-model="inputSize">
            <option>256x256</option>
            <option>512x512</option>
            <option>1024x1024</option>
          </select>
        </div>
      </div>
      <div>
        <button class="btn" id="createButton" :disabled="isTalking" @click="createImage">Create</button>
      </div>
    </div>
    <!-- images -->
    <div>
      <Loding v-if="isTalking" />
      <div v-else>
        <div class="results-container">
          <div v-for="(item, index) in results" :key="index">
            <img class="w-1/3 h-1/3" :src="item.url">
            <div class="modal-buttons">
              <button @click="saveImage(item.url)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                  class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13 10H18L12 16L6 10H11V3H13V10ZM4 19H20V12H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V12H4V19Z">
                  </path>
                </svg>
              </button>
            </div>
          </div>
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
    testURL: string,
    inputPrompt: string,
    inputNumber: number,
    inputSize: string
  } {
    return {
      isTalking: false,
      decoder: new TextDecoder("utf-8"),
      results: [{ url: "../favicon.ico" }, { url: "../favicon.ico" }],
      testURL: 'favicon.ico',
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
        size: this.inputSize,
        response_format: 'b64_json'
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
        this.results = response.data;
      }
    },
    saveImage(imageUrl: string) {
      let fileName = "picture";

      if (fileName != null) {
        this.downloadImage(imageUrl, fileName);
      }
    },
    downloadImage(url: string, filename: string) {
      var link = document.createElement('a');
      console.log(url, filename)
      link.href = url;
      link.download = filename;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);

      // 触发右键菜单
      link.dispatchEvent(new MouseEvent('contextmenu'));

      // 触发点击事件
      link.dispatchEvent(new MouseEvent('click'));

      // 移除元素
      setTimeout(() => {
        window.URL.revokeObjectURL(link.href);
        link.remove();
      }, 0);
    }
  }
};
</script>
