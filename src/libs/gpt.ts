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

export async function imagesGenerations(sendObject: Object) {
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

export async function files() {
  if (!apiKey) { getAPIKey() };
  
  try {
    const result = await fetch("https://api.openai.com/v1/files", {
      method: "get",
      // signal: AbortSignal.timeout(8000),
      // 開啟後到達設定時間會中斷輸出
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

export async function fileUpload(file:File, purpose:string) {
  if (!apiKey) { getAPIKey() };
  let fileReader = new FileReader();
  const stream = await new Promise( (resolve, reject) => {
        fileReader.onload = () => {
          try {
            // 将文本按行分割，并去除空白字符
            const lines = (fileReader.result as string).trim().split(/\r?\n/);
            // 将每一行解析为 JSON 对象，并拼接成 JSONL 字符串
            // const jsonl = lines.map(line => JSON.stringify(JSON.parse(line))).join('\n');
            console.log(lines);
            resolve(lines);
          } catch (error) {
            reject(error);
          }
        },
        fileReader.onerror = () => {
          reject(fileReader.error);
        };
        fileReader.readAsText(file, 'utf-8');
    });

  try {
    const result = await fetch("https://api.openai.com/v1/files", {
      method: "post",
      // signal: AbortSignal.timeout(8000),
      // 開啟後到達設定時間會中斷輸出
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        file: stream,
        purpose: purpose
      })
    });
    return result;
  } catch (error) {
    throw error;
  }
}