import removeFn from "url:/js/remove_fn.js";

const injectScript = (file: string) => {
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file);
  (document.head || document.documentElement).insertBefore(script, null);
};

injectScript(removeFn);

// 监听来自 popup 的消息以控制功能
chrome.runtime.onMessage?.addListener((message, sender, sendResponse) => {
  if (message.type === "RESTORE_ORIGINAL") {
    sendResponse({ success: true });
  }
});
