<template>
    <div class="w-full overflow-y-auto max-h-screen">
        <div class="h-full w-full">
            <div class="sticky top-0 pt-4 w-full h-12 bg-gray-100"></div>
            <!-- Text -->
            <div class="w-full flex flex-col justify-center">
                <textarea :disabled="isLoading" v-model="resultMy" class="input w-full text-justify" rows="9"
                    placeholder="My"></textarea>
                <p class="flex">
                    <sort-two theme="outline" size="24" fill="#333"/>
                    <Loding class="mt-1" v-if="isLoading" />
                </p>
                <textarea :disabled="isLoading" v-model="resultForeign" class="input w-full text-justify" rows="9"
                    placeholder="Foreign"></textarea>
            </div>
            <!-- upload -->
            <div class="w-full">
                <div class="flex flex-row">
                    <div>
                        <input type="file" ref="fileInput" @change="handleFileSelect" :disabled="isLoading || isRecording">
                        <div class="border border-dashed border-blue-500 text-center" @dragover.prevent @drop="handleDrop"
                            @dragenter="isDragging = true" @dragleave="isDragging = false" :class="{ 'dragging': isDragging }">
                            <p>Drag and drop files here</p>
                            <p>The audio file to transcribe to <span class="text-red-500 font-bold">{{transcriptionSettings.language}}</span>, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.</p>
                            <p class="text-red-500">Caution! “m4a” has a few errors.</p>
                        </div>
                    </div>
                    <div>
                        <div @click="startRecording()" >
                            <voice theme="outline" size="72" fill="#333" class="hover:cursor-pointer"/>
                        </div>
                        <div class="loading" @click="stopRecording()" >
                            <rectangle theme="multi-color" size="72" :fill="['#f5a623' ,'#000000' ,'#ffffff' ,'#417505']"/>
                            <rectangle theme="multi-color" size="72" :fill="['#ffffff' ,'#000000' ,'#ffffff' ,'#417505']"/>
                            <rectangle theme="multi-color" size="72" :fill="['#bd10e0' ,'#000000' ,'#ffffff' ,'#417505']"/>
                        </div>
                    </div>
                </div>
                <!-- <label for="prompt" class="text-gray-700 mb2 flex items-center">
                    <span class="w-20">prompt</span>
                    <input v-model.number.trim.lazy="prompt" class="input" id="prompt" name="prompt" :disabled="isLoading"
                        placeholder="An optional text to guide the model's style or continue a previous audio segment. The prompt should be in English." />
                </label> -->
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { audioTranscriptions } from "@/libs/gpt";
import Loding from "@/components/Loding.vue";
import { Voice, Rectangle, SortTwo } from "@icon-park/vue-next";

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
            isRecording: false as boolean,
            decoder: new TextDecoder("utf-8"),
            resultMy: "" as string,
            resultForeign: "" as string,
            transcriptionSettings: {} as any,
            // recorder
            mediaRecorder: null,
            chunks: []
        }
    },
    components: {
        Loding,
        Voice, Rectangle, SortTwo
    },
    mounted() {
        this.transcriptionSettings = this.getSettingsTrans();
    },
    methods: {
        handleFileSelect(event: Event) {
            if (!event.target) return;
            this.isLoading = true;
            this.resultMy = "";
            this.resultForeign = "";
            const files = (event.target as HTMLInputElement).files;
            if (!files) return;
            const file = files[0];
            this.uploadFile(file);
            (event.target as HTMLInputElement).value = "";
        },
        handleDrop(event: DragEvent) {
            event.preventDefault();
            if (this.isLoading) return;
            this.isLoading = true;
            this.isDragging = false;
            this.resultMy = "";
            this.resultForeign = "";

            const file = (event.dataTransfer as DataTransfer).files[0];
            if (file) {
                this.uploadFile(file);
            }
        },
        async uploadFile(file: File) {
            try {
                const { body, status } = await audioTranscriptions(file, this.prompt);
                if (body) {
                    const reader = body.getReader();
                    await this.readStream(reader, status);
                }
            } catch (error: any) {
                this.resultForeign = error;
            } finally {
                this.isLoading = false;
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
                const { done, value } = await reader.read();
                if (done) break;

                const decodedText = this.decoder.decode(value, { stream: true });
                if (status !== 200) {
                    const json = JSON.parse(decodedText); // start with "data: "
                    const content = json.error.message ?? decodedText;
                    this.appendLastMessageContent(content);
                    return;
                }

                // return
                let response = JSON.parse(decodedText);
                this.result = response.text;
            }
        },
        /**
         * get trans settings
         */
        getSettingsTrans() {
            let settings_Trans = localStorage.getItem("settings_trans");
            if (!settings_Trans) {
                return {
                    model: 'gpt-3.5-turbo',
                    temperature: 1,
                    language: 'en'
                };
            }
            
            return JSON.parse(settings_Trans);
        },
        async startRecording() {
            let stream = await navigator.mediaDevices.getUserMedia({ audio:true });
            if (stream) {
                this.isRecording = true;
                this.chunks = [];

                // create MediaRecorder
                this.mediaRecorder = new MediaRecorder(stream, { mimeType:'audio/wav' });

                this.mediaRecorder.addEventListener('dataavailable', event => {
                    if (event.data.size >0) {
                        this.chunks.push(event.data);
                    }
                });

                // start recording
                this.mediaRecorder.start();
            }
        },
        stopRecording() {
            try {
                if ( this.mediaRecorder && this.mediaRecorder.state === "recording" ) {
                    this.mediaRecorder.stop();
                }
            } catch(e) {
                console.log("stopRecording error", e);
            } finally {
                this.isRecording = false;
                if (this.chunks.length===0) {
                    return;
                }
            }
            const blob = new Blob(this.chunks, { type: 'audio/wav' });
            let file = new File([blob], 'sound01.wav', { type: 'audio/wav' });
            this.uploadFile(file);
        }
    }

}
</script>

<style scoped>
.dragging {
    background-color: #eee;
}
</style>

<style scoped>
.loading > span {
  width: 0px;
  animation-name: ball-grid-beat;
  animation-iteration-count: infinite;
}

.loading > span:nth-child(1) {
  animation-duration: 1.3s;
  animation-delay: 0.06s;
}

.loading > span:nth-child(2) {
  animation-duration: 2.04s;
  animation-delay: 0.18s;
}
.loading > span:nth-child(3) {
  animation-duration: 1.3s;
  animation-delay: 0.06s;
}

@keyframes ball-grid-beat {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }

  100% {
    opacity: 1;
  }
}
</style>
