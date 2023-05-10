import type { ChatMessage } from "@/types";
import cryptoJS from "crypto-js";

let controller = new AbortController();
let signal = controller.signal;
const getSecretKey:string = "lianginx";
let apiKey:string = "";
let chatSettings:any = {};

  /**
   * get apiKey
   *  @return apiKey
   */
function getAPIKey() {
  if (apiKey) return apiKey;
  const aesAPIKey = localStorage.getItem("apiKey") ?? "";
  apiKey = cryptoJS.AES.decrypt(aesAPIKey, getSecretKey).toString(
    cryptoJS.enc.Utf8
  );
  return apiKey;
}
/**
 * get chat settings
 * @return chat settings
 */
function getSettingsChat() {
  let settings_Chat = localStorage.getItem("settings_chat");
  if (!settings_Chat) {
      return {
          model: 'gpt-3.5-turbo',
          temperature: 1,
          presence_penalty: 0,
          frequency_penalty: 0
      };
  }
  
  return JSON.parse(settings_Chat);
}
/**
 * get trans settings
 * @return trans settings
 */
function getSettingsTrans() {
  let settings_Trans = localStorage.getItem("settings_trans");
  if (!settings_Trans) {
      return {
          model: 'gpt-3.5-turbo',
          temperature: 1,
          language: 'en'
      };
  }
  
  return JSON.parse(settings_Trans);
}

// send chat message
export async function chat(messageList: ChatMessage[]) {
  if (!apiKey) { getAPIKey() };
  chatSettings = getSettingsChat();

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
        stream: true,
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
  chatSettings = getSettingsTrans();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', chatSettings.model);
  formData.append('temperature', chatSettings.temperature);
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
  chatSettings = getSettingsTrans();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', chatSettings.model);
  formData.append('temperature', chatSettings.temperature);
  formData.append('language', chatSettings.language);
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