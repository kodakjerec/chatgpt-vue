import { gDriveCheck, gDriveLoad, gDrivePatch, gDriveSave } from "@/libs/gDrive";
import type { ChatMessage } from "@/types/gpt";
import cryptoJS from "crypto-js";
import { createPinia, defineStore } from "pinia";

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
  });
}

// unify storage method.
function storageSet(key, value, cloundSave: boolean = false): void {
  localStorage.setItem(key, value);
  if (cloundSave) {
    storeGoogleDrive().localStorageToCloud();
  }
}
function storageGet(key): any {
  return localStorage.getItem(key);
}

export const storeVoice = defineStore({
  id: "voice",
  state: () => ({
    totalVoices: [],
    voiceObject: "",
  }),
  getters: {
    getTotalVoices() {
      return this.totalVoices;
    },
    getVoiceObject() {
      return this.voiceObject;
    },
  },
  actions: {
    async setTotalVoices() {
      if (this.totalVoices.length === 0) {
        let voices = await setVoices();
        this.totalVoices = (voices as any[]).map((voice, index) => {
          voice.index = index;
          return voice;
        });
      }
      return;
    },
    setVoiceObject(voice: any) {
      this.voiceObject = voice;
    },
  },
});

export interface promptInterface {
  act: string;
  prompt: string;
}
export const storeSettings = defineStore({
  id: "settings",
  state: () => ({
    secretKey: "lianginx", // secret key
    apiKey: "", // chatGPT api key
    logData: {}, // logData
    lastPath: "", // last view page
    settings: {}, // chatGPT settings
    googleOAuth2token: "", // google OAuth2 token
    googleDriveFileName: "yourGPT_localStorage.txt",
    prompts: [], // prompts
  }),
  getters: {
    getSecretKey(state): string {
      return state.secretKey;
    },
    getApiKey(state): string {
      return state.apiKey;
    },
    getLogList(state): Array<any> {
      return Object.keys(state.logData);
    },
    /**
     *
     * @param state
     * @returns array
     */
    getLogData(state): any {
      return (name: string) => {
        let findData: Array<any> = state.logData[name];
        if (findData) {
          findData = JSON.parse(JSON.stringify(findData));
        } else {
          findData = [];
        }
        return findData;
      };
    },
    getLastPath(state): string {
      return state.lastPath;
    },
    getSettings(state): any {
      return (name) => {
        let findData = state.settings[name];
        if (findData) {
          findData = JSON.parse(JSON.stringify(findData));
        } else {
          findData = this.resetSettings(name);
          this.setSettings(name, findData);
        }
        return findData;
      };
    },
    getGDriveToken(state): string {
      return state.googleOAuth2token;
    },
    getPrompts(state): Array<promptInterface> {
      return state.prompts ?? [];
    },
  },
  actions: {
    setFromLocalforge() {
      const stateKeys = Object.keys(this.$state);
      for (let i = 0; i < stateKeys.length; i++) {
        const key = stateKeys[i];
        switch (key) {
          case "apiKey":
            let aesAPIKey = storageGet("apiKey") ?? "";
            this.apiKey = cryptoJS.AES.decrypt(aesAPIKey, this.getSecretKey).toString(cryptoJS.enc.Utf8);
            break;
          case "googleOAuth2token":
            let aesToken = storageGet("gToken") ?? "";
            this.googleOAuth2token = cryptoJS.AES.decrypt(aesToken, this.getSecretKey).toString(cryptoJS.enc.Utf8);
            break;
          case "lastPath":
            const getObjectString = storageGet(key);
            if (getObjectString) {
              this.$state[key] = getObjectString;
            } else {
              this.$state[key] = "home";
            }
            break;
          default:
            const getObjectJSON = storageGet(key);
            if (getObjectJSON) {
              this.$state[key] = JSON.parse(getObjectJSON);
            }
            break;
        }
      }
    },
    setApiKey(key: string) {
      this.apiKey = key;
      const aesAPIKey = cryptoJS.AES.encrypt(this.apiKey, this.getSecretKey).toString();
      storageSet("apiKey", aesAPIKey, true);
    },
    setLogData(name: string, content: Array<ChatMessage>) {
      this.logData[name] = content;
      storageSet("logData", JSON.stringify(this.logData), true);
    },
    delLogData(name: string) {
      delete this.logData[name];
      storageSet("logData", JSON.stringify(this.logData), true);
    },
    setLastPath(path: string) {
      this.lastPath = path;
      storageSet("lastPath", this.lastPath);
    },
    setSettings(name: string, content: {}) {
      this.settings[name] = content;
      storageSet("settings", JSON.stringify(this.settings), true);
    },
    resetSettings(name: string) {
      let findData = {};
      switch (name) {
        case "settings_chat":
          findData = {
            model: "gpt-3.5-turbo",
            temperature: 1,
            presence_penalty: 0,
            frequency_penalty: 0,
          };
          break;
        case "settings_trans":
          findData = {
            model: "whisper-1",
            temperature: 0,
            language: "zh-TW", // speechRecognition
            toLanguage: "en", // whisper
          };
          break;
        case "settings_speech":
          findData = {
            volume: 1, // sound, 0~1, default:1
            rate: 1, // speed, 0.1~10, default:1
            pitch: 2, // pitch, 0~2, default:1
            voice: "", // voice,
            lang: "zh-TW", // language
          };
          break;
      }
      return findData;
    },
    setGDriveToken(token: string) {
      this.googleOAuth2token = token;
      const aesAPIKey = cryptoJS.AES.encrypt(token, this.getSecretKey).toString();
      storageSet("gToken", aesAPIKey);
    },
    setPrompts(prompts: Array<promptInterface>) {
      this.prompts = prompts;
      storageSet("prompts", JSON.stringify(this.prompts));
    },
  },
});

export const storeGoogleDrive = defineStore({
  id: "googleDrive",
  state: () => ({
    saveKeys: ["lastPath", "logData", "settings", "apiKey", "prompts"],
  }),
  getters: {},
  actions: {
    /**
     * save localstorage to cloud-data
     * @param data json string
     */
    async localStorageToCloud() {
      const token = storeSettings().getGDriveToken;
      if (token) {
        let saveData = {};
        this.saveKeys.map((key) => {
          saveData[key] = storageGet(key);
        });
        const fileName = storeSettings().googleDriveFileName;
        // check file exists on google-drive
        const fileId = await gDriveCheck(fileName);

        if (fileId !== "error") {
          if (fileId) {
            const patchResult = await gDrivePatch(JSON.stringify(saveData), fileName, fileId);

            if (patchResult) {
              return `Patched Filename: ` + fileName;
            }
          } else {
            const upResult = await gDriveSave(JSON.stringify(saveData), fileName);

            if (upResult) {
              return `Uploaded. Filename: ` + fileName;
            }
          }
        }
      }
      return "";
    },
    /**
     * restore localstorage to cloud-data
     * @param data json string
     */
    async cloundToLocalStorage() {
      const token = storeSettings().getGDriveToken;
      if (token) {
        // use google drive
        const fileName = storeSettings().googleDriveFileName;
        // check file exists on google-drive
        const fileId = await gDriveCheck(fileName);

        if (fileId && fileId !== "error") {
          const fileContent = await gDriveLoad(fileId);
          if (fileContent) {
            const cloudData = JSON.parse(fileContent);
            const notMapAttr = ["gToken"];
            Object.entries(cloudData).map(([key, value]) => {
              if (!notMapAttr.includes(key)) {
                storageSet(key, value);
              }
            });
          }
        }
      }
    },
  },
});
const pinia = createPinia();

export default pinia;
