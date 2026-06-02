import App from "./App.svelte";
import { mount } from "svelte";
import "./styles.css";

const webApp = window.Telegram?.WebApp;

webApp?.ready();
webApp?.expand();

mount(App, {
  target: document.getElementById("app") as HTMLElement,
  props: {
    telegramInitData: webApp?.initData ?? ""
  }
});
