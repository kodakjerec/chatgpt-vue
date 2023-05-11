<template>
    <voice-one theme="outline" size="24" fill="#333" class="hover:cursor-pointer" @click="speak()" v-if="!isSpeaking" />
    <voice-one theme="multi-color" size="24" :fill="['#2F88FF', '#FFF', '#2F88FF', '#43CCF8']" @click="cancel()" class="cursor-progress" v-else />
</template>
<script lang="ts">
import { VoiceOne } from "@icon-park/vue-next";
import { languages, speechLabelToValue } from "@/views/settings.vue";
import { mapActions } from 'pinia';
import { useStore } from '@/store/index';

export default {
    name: 'voice',
    components: {
        VoiceOne
    },
    props: {
        content: {
            default: '',
            type: String
        }
    },
    data() {
        return {
            speechSettings: {
                volume: 1, // sound, 0~1, default:1
                rate: 1, // speed, 0.1~10, default:1
                pitch: 2, // pitch, 0~2, default:1
                voice: '', // voice,
                lang: 'zh', // language example:"en-US"、 "fr-FR", "es-ES","ja-JP"
            },
            msg: new SpeechSynthesisUtterance(),
            synth: window.speechSynthesis,
            isSpeaking: false,
        }
    },
    mounted() {
        this.speechSettings = this.getSettingsSpeech();

        this.msg.onstart = () => {
            this.isSpeaking = true;
        };
        this.msg.onend = () => {
            this.isSpeaking = false;
        };
        this.msg.onerror = () => {
            this.isSpeaking = false;
        };
    },
    methods: {
        ...mapActions(useStore, ['setTotalVoices', 'setVoiceObject']),
        getSettingsSpeech() {
            let settings_Speech = localStorage.getItem("settings_speech");
            if (!settings_Speech) {
                return {
                    volume: 1, // sound, 0~1, default:1
                    rate: 1, // speed, 0.1~10, default:1
                    pitch: 2, // pitch, 0~2, default:1
                    voice: '', // voice,
                    lang: 'zh', // language example:"en-US"、 "fr-FR", "es-ES","ja-JP"
                };
            }

            return JSON.parse(settings_Speech);
        },
        speak() {
            this.isSpeaking = true;
            this.msg.text = this.content;
            this.msg.volume = this.speechSettings.volume;
            this.msg.rate = this.speechSettings.rate;
            this.msg.pitch = this.speechSettings.pitch;
            // get voice
            if (this.speechSettings.voice) {
                if (!this.useStore.getVoiceObject()) {
                    // find voice from voices
                    if (!this.useStore.getTotalVoices()) {

                    }
                }
            }
            // speech.lang
            this.msg.lang = speechLabelToValue(this.speechSettings.lang);
            

            this.synth.speak(this.msg);
        },
        cancel() {
            this.synth.cancel();
        }
    }
}
</script>