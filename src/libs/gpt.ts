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
/**
 * get chat settings
 * @return chat settings
 */
function getSettingsChat() {
  let settings_Chat = storeSettings().getSettings("settings_chat");
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
  let settings_Trans = storeSettings().getSettings("settings_trans");
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
export async function chat(messageList: ChatMessage[], fromStream = true) {
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
  translationSettings = getSettingsTrans();

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
  transcriptionSettings = getSettingsTrans();

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