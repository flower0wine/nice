import remove_alert from "url:/js/remove_alert.js";
import reset_alert from "url:/js/reset_alert.js";

function injectScript(file: string, node: string) {
  const container = document.getElementsByTagName(node)[0];
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file);
  container.appendChild(script);

  window.setTimeout(() => {
    container.removeChild(script);
  }, 1000);
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_ALERT") {
    if (message.enabled) {
      // 当启用时才注入脚本
      injectScript(remove_alert, "body");
    } else {
      injectScript(reset_alert, "body");
    }
    sendResponse({ success: true });
  }
});
