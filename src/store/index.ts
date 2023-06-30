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

// unify storage method.
function storageSet(key, value):void {
    localStorage.setItem(key, value);
}
function storageGet(key):any {
    return localStorage.getItem(key);
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
        secretKey: "lianginx",  // secret key
        apiKey: "",             // chatGPT api key
        logList: [],            // logList, how many logs
        logData: {},            // logData
        lastPath: "",           // last view page
        settings:{},            // chatGPT settings
        googleOAuth2token: ""   // google OAuth2 token
    }),
    getters: {
        getSecretKey(state) {
            return state.secretKey;
        },
        getApiKey(state) {
            if (!state.apiKey) {
                let aesAPIKey = storageGet("apiKey") ?? '';
                state.apiKey = cryptoJS.AES.decrypt(aesAPIKey, state.secretKey).toString(
                    cryptoJS.enc.Utf8
                );
            }

            return state.apiKey;
        },
        getLogList(state) {
            if (state.logList.length===0) {
                state.logList = JSON.parse(storageGet('logList')??'[]');
            }
            return state.logList;
        },
        /**
         * 
         * @param state 
         * @returns array
         */
        getLogData(state): any {
            if (Object.keys(state.logData).length===0) {
                state.logData = JSON.parse(storageGet('logData')??'{}');
            }
            return (name) => {
                let findData = state.logData[name];
                if (findData) {
                    findData = JSON.parse(JSON.stringify(findData));
                } else {
                    findData = [];
                }
                return findData;
            };
        },
        getLastPath(state) {
            if (!state.lastPath) {
                state.lastPath = storageGet('lastPath')??"";
            }
            return state.lastPath;
        },
        getSettings(state) {
            if (Object.keys(state.settings).length===0) {
                state.settings = JSON.parse(storageGet('settings')??'{}');
            }
            return (name) => {
                let findData = state.settings[name];
                if (findData) {
                    findData = JSON.parse(JSON.stringify(findData));
                } else {
                    findData = this.resetSettings(name);
                }
                return findData;
            };
        },
        getGDriveToken(state) {
            return state.googleOAuth2token;
        }
    },
    actions: {
        setApiKey(key: string) {
            this.apiKey = key;
            const aesAPIKey = cryptoJS.AES.encrypt(this.apiKey, this.getSecretKey).toString();
            storageSet("apiKey", aesAPIKey);
        },
      setLogList(list: any) {
          this.logList = list
          storageSet('logList', JSON.stringify(this.logList));
      },
      setLogData(name: string, content:Array<ChatMessage>) {
        this.logData[name] = content;
        storageSet('logData', JSON.stringify(this.logData));
      },
      delLogData(name: string) {
        delete this.logData[name];
        storageSet('logData', JSON.stringify(this.logData));
      },
      setLastPath(path: string) {
        this.lastPath = path;
        storageSet('lastPath', this.lastPath);
      },
      setSettings(name: string, content: {}) {
        this.settings[name] = content;
        storageSet('settings', JSON.stringify(this.settings));
      },
      resetSettings(name: string) {
        let findData = {};
        switch(name) {
            case "settings_chat":
                findData = {
                    model: 'gpt-3.5-turbo',
                    temperature: 1,
                    presence_penalty: 0,
                    frequency_penalty: 0
                };break;
            case "settings_trans":
                findData = {
                    model: 'whisper-1',
                    temperature: 0,
                    language: 'zh',
                    toLanguage: 'en'
                };break;
            case "settings_speech":
                findData = {
                    volume: 1, // sound, 0~1, default:1
                    rate: 1, // speed, 0.1~10, default:1
                    pitch: 2, // pitch, 0~2, default:1
                    voice: '', // voice,
                    lang: 'zh-TW', // language
                };break;
        }
        return findData;
      },
      setGDriveToken(token: string) {
        this.googleOAuth2token = token;
      }
    },
  })
const pinia = createPinia()

export default pinia