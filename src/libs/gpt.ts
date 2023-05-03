import type { ChatMessage } from "@/types";
import cryptoJS from "crypto-js";

const getSecretKey:string = "lianginx";
let apiKey:string = "";
let chatSettings:any = {};

  /**
   * 取得apiKey
   *  @return 明文apiKey
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
 * 取得chat settings
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

export async function chat(messageList: ChatMessage[]) {
  if (!apiKey) { getAPIKey() };
  chatSettings = getSettingsChat();

  try {
    const result = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      // signal: AbortSignal.timeout(8000),
      // 開啟後到達設定時間會中斷輸出
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
export async function stopMessage(messageList: ChatMessage[]) {
  if (!apiKey) { getAPIKey() };

  try {
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      // signal: AbortSignal.timeout(8000),
      // 開啟後到達設定時間會中斷輸出
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        stream: true,
        messages: messageList
      }),
    });
  } catch (error) {
    throw error;
  }
}

export async function createImage(sendObject: Object) {
  if (!apiKey) { getAPIKey() };
  
  try {
    const result = await fetch("https://api.openai.com/v1/images/generations", {
      method: "post",
      // signal: AbortSignal.timeout(8000),
      // 開啟後到達設定時間會中斷輸出
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
