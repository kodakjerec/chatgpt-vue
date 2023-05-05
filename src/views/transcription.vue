<template>
    <div class="w-screen overflow-y-auto max-h-screen">
        <div class="h-full w-full">
            <div class="sticky top-0 pt-4 w-full h-12 bg-gray-100"></div>
            <!-- upload -->
            <div class="w-full">
                <div class="flex flex-col">
                    <input type="file" ref="fileInput" @change="handleFileSelect" :disabled="isLoading">
                    <div class="border border-dashed border-blue-500 py-10 text-center" @dragover.prevent @drop="handleDrop"
                        @dragenter="isDragging = true" @dragleave="isDragging = false" :class="{ 'dragging': isDragging }">
                        <p>Drag and drop files here</p>
                        <p>The audio file to translate, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
                        </p>
                    </div>
                </div>
                <label for="prompt" class="text-gray-700 mb2 flex items-center">
                    <span class="w-1/4">prompt</span>
                    <input v-model.number.trim.lazy="prompt" class="input" id="prompt" name="prompt"
                        placeholder="An optional text to guide the model's style or continue a previous audio segment. The prompt should be in English." />
                </label>
            </div>
            <!-- Text -->
            <div class="w-full flex flex-col">
                <p class="flex">Transcription Result
                    <Loding class="mt-1" v-if="isLoading" />
                </p>
                <textarea :disabled="isLoading" v-model="result" class="input w-full text-justify" rows="18"
                    placeholder="transcription Result"></textarea>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { audiotranscriptions } from "@/libs/gpt";
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
    name: 'transcription',
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
            if (!event.target) return;
            this.isLoading = true;
            this.result = "";
            const file = (event.target as HTMLInputElement).files ?? [0];
            this.uploadFile(file);
            (event.target as HTMLInputElement).value = "";
        },
        handleDrop(event: DragEvent) {
            event.preventDefault();
            if (this.isLoading) return;
            this.isLoading = true;
            this.isDragging = false;
            this.result = "";

            const file = (event.dataTransfer as DataTransfer).files[0];
            if (file) {
                this.uploadFile(file);
            }
        },
        async uploadFile(file: File) {
            try {
                const { body, status } = await audiotranscriptions(file, this.prompt);
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