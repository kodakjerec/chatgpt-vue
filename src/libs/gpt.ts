import type { ChatMessage } from "@/types";

export async function chat(messageList: ChatMessage[], apiKey: string) {
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
        max_tokens:1024
      }),
    });
    return result;
  } catch (error) {
    throw error;
  }
}
