export {};

declare global {
  interface window {
    SpeechRecognition: any; // 👈️ turn off type checking
  }
}
