import type { ChatMessage } from "@/types";
import { storeSettings } from '@/store/index';

let controller = new AbortController();
let signal = controller.signal;
let apiKey:string = '';
let chatSettings:any = {};
let translationSettings:any = {};
let transcriptionSettings:any = {};

  /**
   * get apiKey
   *  @return apiKey
   */
function getAPIKey() {
  if (apiKey) return apiKey;

  apiKey = storeSettings().getApiKey;
  
  return apiKey;
}
// send chat message
export async function chat(messageList: ChatMessage[], fromStream = true) {
  if (!apiKey) { getAPIKey() };
  chatSettings = storeSettings().getSettings("settings_chat");

  try {
    const result = await fetch("https://api.openai.com/v1/chat/completions", {
      signal,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chatSettings.model,
        stream: fromStream,
        messages: messageList,
        temperature: chatSettings.temperature,
        presence_penalty: chatSettings.presence_penalty,
        frequency_penalty: chatSettings.frequency_penalty
      }),
    });
    return result;
  } catch (error) {
    throw error;
  }
}
// abort chat message
export function abortChat() {
  controller.abort();
  // reset
  controller = new AbortController();
  signal = controller.signal;
}

export async function imagesGenerations(sendObject: Object) {
  if (!apiKey) { getAPIKey() };
  
  try {
    const result = await fetch("https://api.openai.com/v1/images/generations", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(sendObject),
    });
    return result;
  } catch (error) {
    throw error;
  }
}

export async function files() {
  if (!apiKey) { getAPIKey() };
  
  try {
    const result = await fetch("https://api.openai.com/v1/files", {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return result;
  } catch (error) {
    throw error;
  }
}

// send translations
export async function audioTranslations(file:File, prompt:string) {
  if (!apiKey) { getAPIKey() };
  translationSettings = storeSettings().getSettings("settings_trans");

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', translationSettings.model);
  formData.append('temperature', translationSettings.temperature);
  if (prompt)
  formData.append('prompt', prompt);

  try {
    const result = await fetch("https://api.openai.com/v1/audio/translations", {
      method: "post",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData
    });
    return result;
  } catch (error) {
    throw error;
  }
}

// send transcriptions
export async function audioTranscriptions(file:File, prompt:string) {
  if (!apiKey) { getAPIKey() };
  transcriptionSettings = storeSettings().getSettings("settings_trans");

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', transcriptionSettings.model);
  formData.append('temperature', transcriptionSettings.temperature);
  formData.append('language', transcriptionSettings.language);
  if (prompt)
  formData.append('prompt', prompt);

  try {
    const result = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "post",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData
    });
    return result;
  } catch (error) {
    throw error;
  }
}

export async function gDriveSave(blob:BlobPart[]) {
  let fileMetadata = {
    name : 'yourGPT_localStorage.txt',
    parents : ['root']
  }
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
  form.append('file',new Blob(blob));
  
  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + storeSettings().getGDriveToken
      },
      body: form
    })
    const { body, status } = response;
    if (body) {
      const reader = body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;
    
        const decodedText = decoder.decode(value, { stream: true });
        if (status !== 200) {
          const json = JSON.parse(decodedText); // start with "data: "
          const content = json.error.message ?? decodedText;
          return;
        }
      }
    }
  } catch(e:any) {
    console.log(e)
  }
}

/**
     * Parse the stream returned by chatGpt
     * @param reader 格式
     * @param status response status
     */
async function readStream(reader: any, status: number) {
  
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    const decoder = new TextDecoder("utf-8");
    if (done) break;

    const decodedText = decoder.decode(value, { stream: true });
    if (status !== 200) {
      const json = JSON.parse(decodedText); // start with "data: "
      const content = json.error.message ?? decodedText;
      return;
    }
  }
}