<template>
    <div class="w-full overflow-y-auto max-h-screen">
        <div class="h-screen w-full">
            <div class="sticky top-0 pt-4 w-full h-12 bg-gray-100"></div>
            <!-- Text -->
            <div class="w-full flex flex-col justify-center h-3/4">
                <div class="w-full md:w-1/3">
                    <label for="language" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/4">language</span>
                        <select v-model="transcriptionSettings.language" class="input w-3/4" @change="$event => contentSelectChange($event, 'settings_trans')">
                            <option v-for="(value, key) of languageList" :key="key" :value="key">{{ key + ' ' + value.nativeName }}</option>
                        </select>
                        <voice-sound :content="resultMy" v-show="!isLoading" />
                    </label>
                </div>
                <textarea v-model="resultMy" class="input w-full text-justify whitespace-pre-line" placeholder="Audio Content"></textarea>

                <p class="flex justify-center">
                    <Loding class="mt-1" v-if="isLoading" />
                    <translation class="w-10" theme="outline" size="24" fill="#333" @click="startTranslation()" v-else />
                </p>
                <div class="w-full md:w-1/3">
                    <label for="language" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/4">language</span>
                        <select v-model="transcriptionSettings.toLanguage" class="input w-3/4" @change="$event => contentSelectChange($event, 'settings_trans')">
                            <option v-for="(value, key) of languageList" :key="key" :value="key">{{ key + ' ' + value.nativeName }}</option>
                        </select>
                        <voice-sound :content="resultForeign" v-show="!isLoading" />
                    </label>
                </div>
                <textarea disabled v-model="resultForeign" class="input w-full text-justify whitespace-pre-line" placeholder="Translate Content"></textarea>

            </div>
            <!-- upload -->
            <div class="w-full">
                <div class="flex flex-row justify-center">
                    <div class="w-3/4 hidden sm:block">
                        <input type="file" acept="audio/*" ref="fileInput" @change="handleFileSelect" :disabled="isLoading || isRecording">
                        <div class="border border-dashed border-blue-500 text-center" @dragover.prevent @drop="handleDrop" @dragenter="isDragging = true" @dragleave="isDragging = false" :class="{ 'dragging': isDragging }">
                            <p>Drag and drop files here</p>
                            <p class="text-xs">mp3, mp4, mpeg, mpga, m4a, wav, or webm.</p>
                            <p class="text-xs text-red-500">Caution! “m4a” has a few errors.</p>
                        </div>
                    </div>
                    <div class="w-1/4">
                        <div @click="startRecording()" v-if="!isRecording">
                            <voice theme="outline" size="100" fill="#333" class="hover:cursor-pointer" />
                        </div>
                        <div class="loading" @click="stopRecording()" v-else>
                            <round theme="multi-color" size="100" :fill="['#f5a623', '#ff0000', '#ffffff', '#417505']" />
                            <round theme="multi-color" size="100" :fill="['#ffffff', '#ff0000', '#ffffff', '#417505']" />
                            <round theme="multi-color" size="100" :fill="['#bd10e0', '#ff0000', '#ffffff', '#417505']" />
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
import { audioTranscriptions, chat } from "@/libs/gpt";
import Loding from "@/components/Loding.vue";
import VoiceSound from "@/components/VoiceSound.vue";
import { Voice, Round, SortTwo, Translation } from "@icon-park/vue-next";
import * as list from '@/assets/ISO639_1.json';
import { storeSettings } from '@/store';
import { createToaster } from '@meforma/vue-toaster';

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
            prompt: '' as string,
            isLoading: false as boolean,
            isDragging: false as boolean,
            isRecording: false as boolean,
            decoder: new TextDecoder("utf-8"),
            resultForeign: '' as string,
            resultMy: '' as string,
            transcriptionSettings: {} as any,
            // recorder
            mediaRecorder: null,
            chunks: [],
            languageList: list
        }
    },
    components: {
        Loding,
        Voice, Round, SortTwo, Translation,
        VoiceSound
    },
    mounted() {
        this.transcriptionSettings = this.getSettingsTrans();
    },
    methods: {
        async handleFileSelect(event: Event) {
            if (!event.target) return;
            this.isLoading = true;
            this.resultForeign = '';
            this.resultMy = '';
            const files = (event.target as HTMLInputElement).files;
            if (!files) return;
            const file = files[0];
            (event.target as HTMLInputElement).value = '';
            this.beforeUploading(file);
        },
        async handleDrop(event: DragEvent) {
            event.preventDefault();
            if (this.isLoading) return;
            this.isLoading = true;
            this.isDragging = false;
            this.resultForeign = '';
            this.resultMy = '';

            const file = (event.dataTransfer as DataTransfer).files[0];
            this.beforeUploading(file);
        },
        async uploadFile(file: File) {
            try {
                const { body, status } = await audioTranscriptions(file, this.prompt);
                if (body) {
                    const reader = body.getReader();
                    let result = await this.readStream(reader, status);
                    if (status === 200) {
                        this.resultMy = result.text;
                    } else {
                        this.resultMy = result;
                        createToaster().error(`Fail`);
                    }
                }
            } catch (error: any) {
                this.resultMy = error;
            } finally {
            }
        },
        async beforeUploading(file: File) {
            if (file) {
                await this.uploadFile(file);
                await this.translate();
                this.isLoading = false;
            }
        },
        /**
         * Parse the stream returned by chatGpt
         * @param reader 格式
         * @param status response
         */
        async readStream(reader: ReadableStreamDefaultReader<Uint8Array>, status: number) {
            let returnResult = '';

            while (true) {
                // eslint-disable-next-line no-await-in-loop
                const { done, value } = await reader.read();
                if (done) break;

                const decodedText = this.decoder.decode(value, { stream: true });
                if (status !== 200) {
                    const json = JSON.parse(decodedText); // start with "data: "
                    const content = json.error.message ?? decodedText;
                    return content;
                }

                // return
                returnResult = JSON.parse(decodedText);
            }

            return returnResult;
        },
        /**
         * get trans settings
         */
        getSettingsTrans() {
            const settings_Trans = storeSettings().getSettings("settings_trans");

            return settings_Trans;
        },
        async startRecording() {
            let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (stream) {
                this.isRecording = true;
                this.chunks = [];

                // create MediaRecorder
                this.mediaRecorder = new MediaRecorder(stream);

                // start recording
                this.mediaRecorder.start();
                this.mediaRecorder.addEventListener('dataavailable', event => {
                    if (event.data.size > 0) {
                        const blob = event.data;
                        let file = new File([blob], 'sound01.wav', { type: 'audio/wav' });
                        this.beforeUploading(file);
                    }
                });

            }
        },
        stopRecording() {
            try {
                if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
                    this.mediaRecorder.stop();
                }
            } catch (e) {
                console.log("stopRecording error", e);
            } finally {
                this.isRecording = false;
            }
        },
        async startTranslation() {
            this.isLoading = true;
            await this.translate();
            this.$nextTick(() => {
                this.isLoading = false;
            });
        },
        /**
         * simple content select change
         */
        contentSelectChange(event: any, myObjectName: string) {
            storeSettings().setSettings(myObjectName, JSON.stringify(this.transcriptionSettings));
        },
        /**
         * translate to wanted language
         */
        async translate() {
            if (this.resultMy === '') return;

            let sendMessageList = [] as Array<any>;
            sendMessageList.push({
                role: "user",
                content: "Translate to " + this.transcriptionSettings.toLanguage,
            });
            sendMessageList.push({
                role: "user",
                content: this.resultMy
            });
            const { body, status } = await chat(sendMessageList, false);
            if (body) {
                const reader = body.getReader();
                let result = await this.readStream(reader, status);
                if (status === 200) {
                    this.resultForeign = result.choices[0].message.content;
                } else {
                    this.resultForeign = result;
                    createToaster().error(`Fail`);
                }
            }
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
.loading>span {
    width: 0px;
    animation-name: ball-grid-beat;
    animation-iteration-count: infinite;
}

.loading>span:nth-child(1) {
    animation-duration: 1.3s;
    animation-delay: 0.06s;
}

.loading>span:nth-child(2) {
    animation-duration: 2.04s;
    animation-delay: 0.18s;
}

.loading>span:nth-child(3) {
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
