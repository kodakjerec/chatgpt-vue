<template>
    <div class="w-full overflow-y-auto max-h-screen">
        <div class="h-screen w-full">
            <div class="sticky top-0 pt-4 w-full h-12 bg-gray-100"></div>
            <!-- Text -->
            <div class="w-full flex flex-col justify-center h-3/4">
                <div class="w-full md:w-1/3">
                    <label for="language" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/4">YourVoice</span>
                        <select v-model="transcriptionSettings.language" class="input w-3/4" @change="$event => contentSelectChange($event, 'settings_trans')">
                            <option v-for="(value, key) of yourVoiceLangList" :key="key" :value="key">{{ key + ' ' + value.Description }}</option>
                        </select>
                        <voice-sound :content="resultMy" v-show="!isLoading" />
                    </label>
                </div>
                <textarea v-model="resultMy" class="input w-full text-justify whitespace-pre-line" placeholder="Audio Content"></textarea>

                <p class="flex justify-center">
                    <Loding v-if="isLoading" class="mt-1" aria-label="Loading" />
                    <translation v-else class="w-10" theme="outline" size="48" fill="#333" @click="startTranslation()" aria-label="translation" />
                </p>

                <div class="w-full md:w-1/3">
                    <label for="language" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/4">To</span>
                        <select v-model="transcriptionSettings.toLanguage" class="input w-3/4" @change="$event => contentSelectChange($event, 'settings_trans')">
                            <option v-for="(value, key) of openAPILangList" :key="key" :value="key">{{ key + ' ' + value.nativeName }}</option>
                        </select>
                        <voice-sound :content="resultForeign" v-show="!isLoading" />
                    </label>
                </div>
                <textarea disabled v-model="resultForeign" class="input w-full text-justify whitespace-pre-line" placeholder="Translate Content"></textarea>

            </div>
            <!-- upload -->
            <div class="w-full">
                <div class="flex flex-row justify-center">
                    <div class="w-16 sm:w-3/4">
                        <div class="border border-dashed border-blue-500 flex text-center h-full" @dragover.prevent @drop="handleDrop" @dragenter="isDragging = true" @dragleave="isDragging = false" :class="{ 'dragging': isDragging }">
                            <label for="file-upload" class="btn flex">
                                <span class="self-center">Import</span>
                            </label>
                            <input id="file-upload" class="input-file" type="file" accept="audio/*" @change="handleFileSelect">
                            <div class="self-center hidden sm:block">
                                <p>Drag and drop files here</p>
                                <p class="text-xs">mp3, mp4, mpeg, mpga, m4a, wav, or webm.</p>
                                <p class="text-xs text-red-500">Caution! “m4a” has a few errors.</p>
                            </div>
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
                </labe
l> -->
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { list } from '@/assets/BCP47';
import * as list2 from '@/assets/ISO639_1.json';
import Loding from "@/components/Loding.vue";
import VoiceSound from "@/components/VoiceSound.vue";
import { audioTranscriptions, chat } from "@/libs/gpt";
import { storeSettings } from '@/store';
import { Round, SortTwo, Translation, Voice } from "@icon-park/vue-next";
import { createToaster } from '@meforma/vue-toaster';

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
            transcriptionSettings: storeSettings().getSettings("settings_trans"),
            // recorder
            mediaRecorder: null,
            chunks: [],
            yourVoiceLangList: list,
            openAPILangList: list2
        }
    },
    components: {
        Loding,
        Voice, Round, SortTwo, Translation,
        VoiceSound
    },
    mounted() {
        this.checkApi();
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
        checkApi() {
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!window.SpeechRecognition) {
                return;
            }
            const recognition = new window.SpeechRecognition();

            recognition.lang = this.transcriptionSettings.language;
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.addEventListener('start', event => {
            })

            recognition.addEventListener('result', event => {
                const text = event.results[0][0]["transcript"];
                this.resultMy += text;
            })

            recognition.addEventListener('end', () => {
                // 如果不是使用者按下的停止, 就繼續錄音
                if (this.isRecording) {
                    this.mediaRecorder.start();
                } else {
                    this.startTranslation();
                }
            })

            this.mediaRecorder = recognition;
        },
        startRecording() {
            this.resultMy = "";
            this.mediaRecorder.start();
            this.isRecording = true;
        },
        stopRecording() {
            this.mediaRecorder.stop();
            this.isRecording = false;
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
            storeSettings().setSettings(myObjectName, this.transcriptionSettings);
        },
        /**
         * translate to wanted language
         */
        async translate() {
            if (this.resultMy === '') {
                createToaster().warning("No message. Please try again");
                return;
            };

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
