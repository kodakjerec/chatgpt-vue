import type { ChatMessage } from '@/types/gpt';
import { createPinia, defineStore } from 'pinia';
import cryptoJS from "crypto-js";

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

export const storeVoice  = defineStore({
  id: 'voice',
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

export const storeSettings  = defineStore({
    id: 'settings',
    state: () => ({
        secretKey: "lianginx",
        apiKey: "",
        logList: [],
        logName: {},
        settings:{}
    }),
    getters: {
        getSecretKey(state) {
            return state.secretKey;
        },
        getApiKey(state) {
            if (!state.apiKey) {
                let aesAPIKey = localStorage.getItem("apiKey") ?? '';
                state.apiKey = cryptoJS.AES.decrypt(aesAPIKey, state.secretKey).toString(
                    cryptoJS.enc.Utf8
                );
            }

            return state.apiKey;
        },
        getLogList(state) {
            if (state.logList.length===0) {
                state.logList = JSON.parse(localStorage.getItem('logList')??'[]');
            }
            return state.logList;
        },
        getLogName(state) {
            if (Object.keys(state.logName).length===0) {
                state.logName = JSON.parse(localStorage.getItem('logData')??'{}');
            }
            return (name) => state.logName[name];
        },
        getSettings(state) {
            if (Object.keys(state.settings).length===0) {
                state.settings = JSON.parse(localStorage.getItem('settings')??'{}');
            }
            return (name) => state.settings[name];
        }
    },
    actions: {
        setApiKey(key: string) {
            this.apiKey = key;
            const aesAPIKey = cryptoJS.AES.encrypt(this.apiKey, this.getSecretKey).toString();
            localStorage.setItem("apiKey", aesAPIKey);
        },
      setLogList(list: any) {
          this.logList = list
          localStorage.setItem('logList', JSON.stringify(this.logList));
      },
      setLogName(name: string, content:Array<ChatMessage>) {
        this.logName[name] = content;
        localStorage.setItem('logData', JSON.stringify(this.logName));
      },
      delLogName(name: string) {
        delete this.logName[name];
        localStorage.setItem('logData', JSON.stringify(this.logName));
      },
      setSettings(name: string, content: {}) {
        this.settings[name] = content;
        localStorage.setItem('settings', JSON.stringify(this.settings));

      }
    },
  })
const pinia = createPinia()

export default pinia