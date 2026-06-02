/// <reference types="vite/client" />

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
  MainButton: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
  };
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
