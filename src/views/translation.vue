<template>
    <div class="bg-white w-full overflow-y-auto max-h-screen">
        <div class="bg-gray-100 h-full w-full">
            <div class="py-4 bg-gray-100 w-full h-10"></div>
            <!-- upload -->
            <div class="w-full">
                <div class="flex flex-col">
                    <input type="file" ref="fileInput" @change="handleFileSelect" :disabled="isLoading">
                    <div
                    class="border border-dashed border-blue-500 p-20 text-center"
                    @dragover.prevent
                    @drop="handleDrop"
                    @dragenter="isDragging = true"
                    @dragleave="isDragging = false"
                    :class="{ 'dragging': isDragging }"
                    >
                    <p>Drag and drop files here</p>
                    <p>The audio file to translate, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.</p>
                    </div>
                </div>
            </div>
            <!-- Text -->
            <div class="w-full flex flex-col">
                <p class="flex">Translation Result<Loding class="mt-1" v-if="isLoading" /></p>
                <textarea :disabled="isLoading" v-model="result" class="input w-full text-justify" rows="18" placeholder="Translation Result" ></textarea>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { audioTranslations } from "@/libs/gpt";
import Loding from "@/components/Loding.vue";

interface fileDetail {
    id: string,
    object: string,
    bytes: number,
    created_at: number,
    filename: string,
    purpose: string
}
export default {
    name: 'translation',
    data() {
        return {
            prompt: "" as string,
            isLoading: false as boolean,
            isDragging: false as boolean,
            decoder: new TextDecoder("utf-8"),
            result: "" as string
        }
    },
    components: {
        Loding
    },
    methods: {
        handleFileSelect(event: Event) {
            this.isLoading = true;
            const file = (event.target as HTMLInputElement).files[0];
            this.uploadFile(file);
        },
        handleDrop(event: DragEvent) {

            event.preventDefault();
            if (this.isLoading) return;
            this.isLoading = true;
            this.isDragging = false;
            const file = event.dataTransfer?.files[0];
            if (file) {
            this.uploadFile(file);
            }
        },
        async uploadFile(file:File) {
            try {
                const { body, status } = await audioTranslations(file, this.prompt);
                if (body) {
                    const reader = body.getReader();
                    await this.readStream(reader, status);
                }
            } catch (error: any) {
                console.log(error);
            } finally {
                this.isLoading = false;
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

            // 回傳URL
            let response = JSON.parse(decodedText);
            this.result = response.text;
        }
        },
    }

}
</script>

<style scoped>
.dragging {
  background-color: #eee;
}
</style>