<template>
  <div class="w-full overflow-y-auto max-h-screen">
    <div class="min-h-screen w-full">
    <div class="sticky top-0 pt-4 w-full h-12 bg-gray-100"></div>
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
        <button class="btn" id="createButton" :disabled="isTalking" @click="imagesGenerations">Create</button>
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
                <download theme="outline" size="24" fill="#000"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts">
import cryptoJS from "crypto-js";
import { imagesGenerations } from "@/libs/gpt";
import Loding from "@/components/Loding.vue";
import { Download } from "@icon-park/vue-next";

export default {
  name: "createOneImage",
  components: {
    Loding, Download
  },
  data() {
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
    async imagesGenerations() {
      this.isTalking = true;
      let sendObject = {
        prompt: this.inputPrompt,
        n: this.inputNumber,
        size: this.inputSize
      };
      try {
        const { body, status } = await imagesGenerations(sendObject);
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
     * Parse the stream returned by chatGpt
     * @param reader 格式
     * @param status response
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

        // return
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
