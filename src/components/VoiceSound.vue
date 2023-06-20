<template>
    <div class="mx-2 w-6">
        <div class="pt-1" @click="speak()" v-if="!isSpeaking">
            <voice-one theme="outline" size="24" fill="#333" class="hover:cursor-pointer" />
        </div>
        <div class="loading pt-1 hover:cursor-pointer" @click="cancel()" v-else>
            <voice-one theme="multi-color" size="24" :fill="['#2F88FF', '#FFF', '#2F88FF', '#43CCF8']"/>
            <voice-one theme="multi-color" size="24" :fill="['#9013fe' ,'#FFF' ,'#bd10e0' ,'#43CCF8']" :strokeWidth="2"/>
        </div>
    </div>
</template>
<script lang="ts">
import { VoiceOne } from "@icon-park/vue-next";
import { storeSettings, storeVoice } from '@/store/index';

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
            store: storeVoice()
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
        getSettingsSpeech() {
            const settings_Speech = storeSettings().getSettings("settings_speech");
            if (!settings_Speech) {
                return {
                    volume: 1, // sound, 0~1, default:1
                    rate: 1, // speed, 0.1~10, default:1
                    pitch: 2, // pitch, 0~2, default:1
                    voice: '', // voice,
                    lang: 'zh', // language example:"en-US"、 "fr-FR", "es-ES","ja-JP"
                };
            }

            return settings_Speech;
        },
        speak() {
            this.isSpeaking = true;
            this.msg.text = this.content;
            this.msg.volume = this.speechSettings.volume;
            this.msg.rate = this.speechSettings.rate;
            this.msg.pitch = this.speechSettings.pitch;
            // get voice
            if (this.store.getVoiceObject) {
                this.msg.voice = this.store.getVoiceObject;
            }
            // speech.lang
            this.msg.lang = this.speechSettings.lang;


            this.synth.speak(this.msg);
        },
        cancel() {
            this.synth.cancel();
        }
    }
}
</script>

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
