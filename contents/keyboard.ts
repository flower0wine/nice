import removeKeyboard from "url:/js/remove_keyboard.js";
import resetKeyboard from "url:/js/reset_keyboard.js";

const injectScript = (file: string) => {
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file);

  (document.head || document.documentElement).insertBefore(script, null);
};

injectScript(removeKeyboard);

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_KEYBOARD") {
    if (message.enabled) {
      // 当启用时才注入脚本
      injectScript(removeKeyboard);
    } else {
      injectScript(resetKeyboard);
    }
    sendResponse({ success: true });
  }
});
