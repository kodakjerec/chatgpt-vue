<template>
    <div class="w-screen overflow-y-auto max-h-screen">
        <div class="h-full w-full">
            <div class="sticky top-0 pt-4 w-full h-12 bg-gray-100"></div>
            <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="0">
                <div class="w-full text-center my-1">
                    <label class="text-gray-700 font-bold text-xl">API Key</label>
                </div>
                <div class="mb-2 text-sm text-gray-500">Input API Key：</div>
                <input class="input" type="password" paceholder="sk - xxxxxxxxxx" v-model="messageContent">
                <button class="btn" @click="sendOrSave()">Save</button>
            </div>
            <div class="w-full text-right mt-2" v-show="tooltipText">
                <p class="text-justify text-yellow-700">{{ tooltipText }}<br>{{ tooltipTextTw }}</p>
            </div>
            <!-- Chat -->
            <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="1" @focus="showTooltip('', 'settings_chat')">
                <div class="w-full text-center my-1 flex">
                    <div class="w-1/3"></div>
                    <label class="text-gray-700 font-bold text-xl w-1/3">Chat</label>
                    <div class="w-1/3 flex justify-end">
                        <button class="btn" @click="resetValue('settings_chat')">Default</button>
                    </div>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">model</span>
                        <select v-model="chat.model"
                                class="input" @change="$event=>contentValueChange($event, 'settings_chat')" @focus="showTooltip('model', 'settings_chat')">
                            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                            <option value="gpt-4">gpt-4</option>
                        </select>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Temperature</span>
                        <input v-model.number.trim.lazy="chat.temperature"
                                class="input"
                                type ="number"
                                step =".1"
                                placeholder="0 to 2"
                                required :min="0" :max="2" @change="$event=>contentValueChange($event, 'settings_chat')" @focus="showTooltip('temperature', 'settings_chat')"/>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="presence_penalty" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Presence_penalty</span>
                        <input v-model.number.trim.lazy="chat.presence_penalty"
                                class="input"
                                type ="number"
                                step =".1"
                                placeholder="-2 to 2"
                                required :min="-2" :max="2" @change="$event=>contentValueChange($event, 'settings_chat')" @focus="showTooltip('presence_penalty', 'settings_chat')"/>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="frequency_penalty" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Frequency_penalty</span>
                        <input v-model.number.trim.lazy="chat.frequency_penalty"
                                class="input"
                                type ="number"
                                step =".1"
                                placeholder="-2 to 2"
                                required :min="-2" :max="2" @change="$event=>contentValueChange($event, 'settings_chat')" @focus="showTooltip('frequency_penalty', 'settings_chat')"/>
                    </label>
                </div>
            </div>
            <!-- Transcription -->
            <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="2" @focus="showTooltip('', 'settings_trans')">
                <div class="w-full text-center my-1 flex">
                    <div class="w-1/3"></div>
                    <label class="text-gray-700 font-bold text-xl w-1/3">Transcription</label>
                    <div class="w-1/3 flex justify-end">
                        <button class="btn" @click="resetValue('settings_trans')">Default</button>
                    </div>
                </div>
                <div class="w-full md:w-1/3 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">model</span>
                        <select v-model="trans.model"
                                class="input" @change="$event=>contentValueChange($event, 'settings_trans')" @focus="showTooltip('model', 'settings_trans')">
                            <option value="whisper-1">whisper-1</option>
                        </select>
                    </label>
                </div>
                <div class="w-full md:w-1/3 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Temperature</span>
                        <input v-model.number.trim.lazy="trans.temperature"
                                class="input"
                                type ="number"
                                step =".1"
                                placeholder="0 to 2"
                                required :min="0" :max="2" @change="$event=>contentValueChange($event, 'settings_trans')" @focus="showTooltip('temperature', 'settings_trans')"/>
                    </label>
                </div>
                <div class="w-full md:w-1/3 grow">
                    <label for="language" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">language</span>
                        <select v-model="trans.language"
                                class="input" @change="$event=>contentValueChange($event, 'settings_trans')" @focus="showTooltip('language', 'settings_trans')">
                            <option value="en">en English 英文</option>
                            <option value="zh">zh Chinese 中文</option>
                            <option value="ja">ja Japan 日文</option>
                        </select>
                    </label>
                </div>
            </div>
            <!-- Speech -->
            <div class="flex flex-wrap rounded bg-white m-2 p-2" tabindex="2" @focus="showTooltip('', 'settings_speech')">
                <div class="w-full text-center my-1 flex">
                    <div class="w-1/3"></div>
                    <label class="text-gray-700 font-bold text-xl w-1/3">Speech</label>
                    <div class="w-1/3 flex justify-end">
                        <button class="btn" @click="resetValue('settings_speech')">Default</button>
                    </div>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Volume</span>
                        <input v-model.number.trim.lazy="speech.volume"
                                class="input"
                                type ="number"
                                step =".1"
                                placeholder="0 to 1"
                                required :min="0" :max="1" @change="$event=>contentValueChange($event, 'settings_speech')" @focus="showTooltip('volume', 'settings_speech')"/>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Rate</span>
                        <input v-model.number.trim.lazy="speech.rate"
                                class="input"
                                type ="number"
                                step =".1"
                                placeholder="0 to 10"
                                required :min="0" :max="10" @change="$event=>contentValueChange($event, 'settings_speech')" @focus="showTooltip('rate', 'settings_speech')"/>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="temperature" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">Pitch</span>
                        <input v-model.number.trim.lazy="speech.pitch"
                                class="input"
                                type ="number"
                                step =".1"
                                placeholder="0 to 2"
                                required :min="0" :max="2" @change="$event=>contentValueChange($event, 'settings_speech')" @focus="showTooltip('pitch', 'settings_speech')"/>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="language" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">language</span>
                        <select v-model="speech.lang"
                                class="input" @change="$event=>contentValueChange($event, 'settings_speech')" @focus="showTooltip('language', 'settings_speech')">
                            <option value="en-US">en-US English 英文</option>
                            <option value="zh-TW">zh-TW Chinese 中文</option>
                            <option value="ja-JP">ja-JP Japan 日文</option>
                        </select>
                    </label>
                </div>
                <div class="w-full md:w-1/4 grow">
                    <label for="voice" class="text-gray-700 mb2 flex items-center">
                        <span class="w-1/2">voice</span>
                        <select v-model="speech.voice"
                                class="input" @change="$event=>contentValueChange($event, 'settings_speech', 'voice')" @focus="showTooltip('voice', 'settings_speech')">
                                <option  v-for="(voice,index) of speechVoiceList" :key="index" :value="voice.name" >{{ voice.name }}</option>
                        </select>
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import cryptoJS from "crypto-js";

interface MyObject {
  [key: string]: any;
}

const synth = window.speechSynthesis;
function setVoices() {
  return new Promise((resolve, reject) => {
  let timer;
  timer = setInterval(() => {
    if(synth.getVoices().length !== 0) {
      resolve(synth.getVoices());
      clearInterval(timer);
    }
  }, 10);
 })
}

export default {
    name: 'settings',
    data() {
        return {
            apiKey: "",
            getSecretKey: "lianginx",
            messageContent: "",
            chat: {
                model: 'gpt-3.5-turbo',
                temperature: 1,
                presence_penalty: 0,
                frequency_penalty: 0
            },
            trans: {
                model: 'whisper-1',
                temperature: 0,
                language: 'en',
            },
            speech: {
                volume: 1, // sound, 0~1, default:1
                rate: 1, // speed, 0.1~10, default:1
                pitch: 2, // pitch, 0~2, default:1
                voice: '', // voice,
                voiceObject: '',
                lang: 'zh-TW', // language example:"en-US"、 "fr-FR", "es-ES","ja-JP"
            },
            totalVoices: [],
            speechVoiceList: [],
            tooltipText: "",
            tooltipTextTw: ""
        }
    },
    mounted() {
        this.messageContent = this.getAPIKey();
        
        setVoices().then(voices=> {
            this.totalVoices = voices;
            this.speechVoiceList = this.totalVoices.filter(voice=> {
                if(voice.lang===this.speech.lang)
                    return voice
            });
        });
        this.getSettings();
    },
    methods: {
        sendOrSave() {
            this.saveAPIKey(this.messageContent.trim())
        },
        /**
         * save apiKey
         * @param apiKey apiKey
         */
        saveAPIKey(apiKey: string) {
            if (apiKey.slice(0, 3) !== "sk-" || apiKey.length !== 51) {
                alert("API Key error, please check and re-enter！");
                return false;
            }
            const aesAPIKey = cryptoJS.AES.encrypt(apiKey, this.getSecretKey).toString();
            localStorage.setItem("apiKey", aesAPIKey);
            return true;
        },
        /**
         * get apiKey
         *  @return apiKey
         */
        getAPIKey() {
            if (this.apiKey) return this.apiKey;
            const aesAPIKey = localStorage.getItem("apiKey") ?? "";
            this.apiKey = cryptoJS.AES.decrypt(aesAPIKey, this.getSecretKey).toString(
                cryptoJS.enc.Utf8
            );
            return this.apiKey;
        },
        /**
         * get speech settings
         * @return speech settings
         */
        getSettings() {
            const settings_Chat = localStorage.getItem("settings_chat");
            if (!settings_Chat) {
                this.resetValue("settings_chat");
            }
            const settings_Trans = localStorage.getItem("settings_trans");
            if (!settings_Trans) {
                this.resetValue("settings_trans");
            }
            const settings_Speech = localStorage.getItem("settings_speech");
            if (!settings_Speech) {
                this.resetValue("settings_speech");
            }
        },
        /**
         * reset chat settings
         */
        resetValue(myObjectName: string) {
            let myObject: MyObject = "";
            switch(myObjectName) {
                case "settings_chat":
                    myObject = this.chat;
                    myObject = {
                        model: 'gpt-3.5-turbo',
                        temperature: 1,
                        presence_penalty: 0,
                        frequency_penalty: 0
                    };
                    break;
                case "settings_trans":
                    myObject = this.trans;
                    myObject = {
                        model: 'whisper-1',
                        temperature: 0,
                        language: 'en'
                    };
                    break;
                case "settings_speech":
                    myObject = this.speech;
                    myObject = {
                        volume: 1, // sound, 0~1, default:1
                        rate: 1, // speed, 0.1~10, default:1
                        pitch: 2, // pitch, 0~2, default:1
                        voice: '', // voice,
                        voiceObject: '',
                        lang: 'zh-TW', // language example:"en-US"、 "fr-FR", "es-ES","ja-JP"
                    };
                    break;
            }

            localStorage.setItem(myObjectName, JSON.stringify(myObject));
        },
        /**
         * adjust settings
         */
        contentValueChange(event: any, myObjectName: string, specialPurpose?: string) {
            let myObject: MyObject = "";
            switch(myObjectName) {
                case "settings_chat":
                    myObject = this.chat;break;
                case "settings_trans":
                    myObject = this.trans;break;
                case "settings_speech":
                    myObject = this.speech;break;
            }
            const target = event.target as HTMLInputElement;

            if (target.type==='number') {
                if (target.value<target.min) {
                    if(target.name) {
                        myObject[target.name] = parseInt(target.min);
                    }
                } else if (target.value>target.max) {
                    if(target.name) {
                        myObject[target.name] = parseInt(target.max);
                    }
                }
            }

            // speech -> voice
            if (specialPurpose && specialPurpose==='voice') {
                let voiceObject: SpeechSynthesisVoice = this.speechVoiceList[event.target.selectedIndex];
                myObject['voiceObject'] = voiceObject;
            }

            localStorage.setItem(myObjectName, JSON.stringify(myObject));
        },
        /**
         * show chat tooltip
         */
        showTooltip(type: string, myObjectName: string) {
            switch(myObjectName) {
                case "settings_chat":
                    switch(type) {
                        case "model":
                            this.tooltipText = "ID of the model to use. GPT-4 is currently in a limited beta and only accessible to those who have been granted access.";
                            this.tooltipTextTw = "要使用的模型ID。GPT-4目前處於有限的測試版階段，只有獲得許可的人才能使用。";
                            break;
                        case "temperature":
                            this.tooltipText = "What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.";
                            this.tooltipTextTw = "在0到2之間應該使用哪個選擇？較高的值（例如0.8）會使輸出更加隨機，而較低的值（例如0.2）則會使其更加集中和具有決定性。";
                            break;
                        case "presence_penalty":
                            this.tooltipText = "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.";
                            this.tooltipTextTw = "值介於-2.0到2.0之間。正值會根據它們是否在到目前為止的文本中出現來懲罰新的tokens，進一步增加模型談論新主題的可能性。";
                            break;
                        case "frequency_penalty":
                            this.tooltipText = "Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.";
                            this.tooltipTextTw = "數字介於-2.0和2.0之間。正值會根據文本中現有詞彙的頻率對新令牌進行處罰，減少模型重複原話的可能性。";
                            break;
                        default:
                            this.tooltipText = "";
                            this.tooltipTextTw = "";
                            break;
                    }
                    break;
                case "settings_trans":
                   switch(type) {
                        case "model":
                            this.tooltipText = "ID of the model to use. Only whisper-1 is currently available.";
                            this.tooltipTextTw = "要使用的模型ID。目前只有 whisper-1";
                            break;
                        case "temperature":
                            this.tooltipText = "The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit.";
                            this.tooltipTextTw = "取樣介於0和1之間。較高的值（例如0.8）會使輸出更加隨機，而較低的值（例如0.2）則會使其更加集中和確定性。如果設置為0，模型將使用對數概率自動增加溫度，直到達到某些閾值。";
                            break;
                        case "language":
                            this.tooltipText = "The language of the input audio. Supplying the input language in ISO-639-1 format will improve accuracy and latency.";
                            this.tooltipTextTw = "輸入音頻的語言。以ISO-639-1格式提供輸入語言將提高準確性和延遲時間。";
                            break;
                        default:
                            this.tooltipText = "";
                            this.tooltipTextTw = "";
                            break;
                    }
                   break;
                case "settings_speech":
                    switch(type) {
                        case "volume":
                            this.tooltipText = "Represents the volume value. 0 (lowest) and 1 (highest)";
                            this.tooltipTextTw = "音量值。默認值為1（最大音量）";
                            break;
                        case "rate":
                            this.tooltipText = "The speed at which the utterance will be spoken at. 0.1 (lowest) and 10 (highest)";
                            this.tooltipTextTw = "朗讀速度。默認值為1（正常語言發聲）";
                            break;
                        case "pitch":
                            this.tooltipText = "The pitch at which the utterance will be spoken at. 0 (lowest) and 2 (highest)";
                            this.tooltipTextTw = "朗讀音高。默認值為1（正常發聲）";
                            break;
                        case "voice":
                            this.tooltipText = "The voice that will be used to speak the utterance.";
                            this.tooltipTextTw = "朗讀語音的聲音。";
                            break;
                        default:
                            this.tooltipText = "";
                            this.tooltipTextTw = "";
                            break;
                    }
                    break;
            }    
        }
    }
}
</script>