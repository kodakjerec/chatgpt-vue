import { createPinia, defineStore } from 'pinia'

// voice settings
const synth = window.speechSynthesis;
export function setVoices() {
    return new Promise((resolve, reject) => {
        let timer;
        timer = setInterval(() => {
            if (synth.getVoices().length !== 0) {
                resolve(synth.getVoices());
                clearInterval(timer);
            }
        }, 10);
    })
}

export const useStore  = defineStore({
  id: 'main',
  state: () => ({
    totalVoices: [],
    voiceObject: '',
  }),
  getters: {
      getTotalVoices() {
          return this.totalVoices;
      },
      getVoiceObject() {
          return this.voiceObject;
      }
  },
  actions: {
    async setTotalVoices() {
        if (this.totalVoices.length===0) {
            let voices = await setVoices()
            this.totalVoices = (voices as any[]).map((voice, index)=>{
                voice.index = index;
                return voice;
            });
        }
        return;
    },
    setVoiceObject(voice: any) {
        this.voiceObject = voice
    },
  },
})

const pinia = createPinia()

export default pinia