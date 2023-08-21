export {};

declare global {
  interface Window {
    SpeechRecognition: any; // 👈️ turn off type checking
    webkitSpeechRecognition: any;
  }
}
