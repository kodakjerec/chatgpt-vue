<template>
    <voice-one theme="outline" size="24" fill="#333" class="hover:cursor-pointer" @click="speak()" v-if="!isSpeaking" />
    <voice-one theme="multi-color" size="24" :fill="['#2F88FF' ,'#FFF' ,'#2F88FF' ,'#43CCF8']" v-else />
</template>
<script lang="ts">
import { VoiceOne } from "@icon-park/vue-next";

export default  {
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
            volume: 1, // sound
            rate: .8, // speed
            pauseLength: 100, //
            lang: 'zh-TW', // language example:"en-US"、 "fr-FR", "es-ES","ja-JP"
            isSpeaking: false,
        }
    },

    methods: {
        speak() {
            this.isSpeaking = true;
            let msg = new SpeechSynthesisUtterance();
            const synth = window.speechSynthesis;
            msg.text = this.content;
            msg.volume = this.volume ;
            msg.rate = this.rate ;
            msg.lang = 'zh-TW';
            msg.onstart = ()=> {
                this.isSpeaking = true;
            };
            msg.onend = ()=> {
                this.isSpeaking = false;
            };

            synth.speak(msg);
        }
    }
}
</script>