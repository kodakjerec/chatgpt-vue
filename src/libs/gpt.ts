import type { ChatMessage } from "@/types";
import cryptoJS from "crypto-js";

const getSecretKey:string = "lianginx";
let apiKey:string = "";
function getAPIKey() {
  if (apiKey) return apiKey;
  const aesAPIKey = localStorage.getItem("apiKey") ?? "";
  apiKey = cryptoJS.AES.decrypt(aesAPIKey, getSecretKey).toString(
    cryptoJS.enc.Utf8
  );
  return apiKey;
}

export async function chat(messageList: ChatMessage[]) {
  if (!apiKey) { getAPIKey() };

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
        model: "gpt-3.5-turbo",
        stream: true,
        messages: messageList,
        stop: 'stop'
      }),
    });
    return result;
  } catch (error) {
    throw error;
  }
}
export async function stop(messageList: ChatMessage[]) {
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
        messages: messageList,
        stop: 'stop'
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
