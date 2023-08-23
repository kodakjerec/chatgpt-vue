export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const gptModelList = [
  { key: 'gpt-3.5-turbo', tokens: 4096 },
  { key: 'gpt-3.5-turbo-16k', tokens: 16384 },
  { key: 'gpt-4', tokens: 8192 },
  { key: 'gpt-4-32k', tokens: 32768 },
]