import type { PlasmoMessaging } from "@plasmohq/messaging";
import { logger } from "../utils/logger";

// 监听所有请求的响应头
chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [1], // 移除旧规则
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          // 移除 CSP 头
          {
            header: "content-security-policy",
            operation: "remove"
          },
          {
            header: "content-security-policy-report-only",
            operation: "remove"
          },
          {
            header: "x-content-security-policy",
            operation: "remove"
          },
          {
            header: "x-webkit-csp",
            operation: "remove"
          }
        ]
      },
      condition: {
        urlFilter: "*", // 匹配所有 URL
        resourceTypes: ["main_frame"] // 只匹配主框架请求
      }
    }
  ]
});

// 输出调试信息
logger.info("CSP 修改器已启动");

// 监听请求以验证规则是否生效
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    logger.info("收到响应头:", details.url);
    logger.info("响应头内容:", details.responseHeaders);
  },
  {
    urls: ["<all_urls>"],
    types: ["main_frame"]
  },
  ["responseHeaders"]
);

// 消息处理器
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_SCRIPT") {
    // 处理获取脚本请求
    handleFetchScript(message)
      .then(sendResponse)
      .catch((error) => {
        logger.error("Fetch script error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放，等待异步响应
  }

  if (message.type === "INJECT_SCRIPT") {
    // 处理注入脚本请求
    handleInjectScript(message)
      .then(sendResponse)
      .catch((error) => {
        logger.error("Inject script error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放，等待异步响应
  }
});

// 处理脚本获取
async function handleFetchScript(req: { url: string }) {
  try {
    const response = await fetch(req.url);
    let code = await response.text();

    return { success: true, code, originalUrl: req.url };
  } catch (error) {
    logger.error("获取脚本失败:", error);
    return { success: false, error: error.message };
  }
}

function wrapCodeInIIFE(code: string) {
  return `(function() { 
   try { 
     ${code} 
   } catch(e) { 
     console.error("Script execution failed:", e)
   }
 })();`;
}

// 处理脚本注入
async function handleInjectScript(req: { code: string; originalUrl: string }) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (!tab?.id) {
      throw new Error("No active tab found");
    }

    const wrappedCode = wrapCodeInIIFE(req.code);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: (code, originalUrl) => {
        try {
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.textContent = code;
          script.setAttribute("data-original-src", originalUrl);

          (document.head || document.documentElement).appendChild(script);
        } catch (e) {
          logger.error("Script injection failed:", e);
        }
      },
      args: [wrappedCode, req.originalUrl]
    });
    return { success: true };
  } catch (error) {
    logger.error("注入脚本失败:", error);
    return { success: false, error: error.message };
  }
}

interface EventSettings {
  contextMenuDisabled: boolean;
  pasteDisabled: boolean;
  keyboardDisabled: boolean;
}

const STORAGE_KEY = "event_settings";
let cachedSettings: EventSettings | null = null;

// 初始化缓存
async function initCache() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    cachedSettings = result[STORAGE_KEY] || {
      contextMenuDisabled: false,
      pasteDisabled: false,
      keyboardDisabled: false
    };
    logger.info("Settings cached:", cachedSettings);
  } catch (error) {
    logger.error("Failed to init cache:", error);
    cachedSettings = {
      contextMenuDisabled: false,
      pasteDisabled: false,
      keyboardDisabled: false
    };
  }
}

// 在页面加载前注入设置
chrome.webNavigation.onCommitted.addListener(
  async (details) => {
    if (!cachedSettings) {
      await initCache();
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        func: (settings) => {
          // 使用 Object.defineProperty 确保设置不会被修改
          Object.defineProperty(window, "__NICE_EXTENSION_SETTINGS__", {
            value: settings,
            writable: false,
            configurable: false
          });
        },
        args: [cachedSettings],
        world: "MAIN",
        // 这个脚本会在任何其他脚本之前执行
        injectImmediately: true
      });
    } catch (error) {
      console.error("Failed to inject settings:", error);
    }
  },
  {
    // 只在主框架触发
    url: [{ schemes: ["http", "https"] }]
  }
);

// 监听 storage 变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes[STORAGE_KEY]) {
    cachedSettings = changes[STORAGE_KEY].newValue;
    logger.info("Settings updated:", cachedSettings);
  }
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_SETTINGS") {
    // 更新 chrome.storage.local
    chrome.storage.local
      .set({ [STORAGE_KEY]: message.settings })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        logger.error("Failed to update settings:", error);
        sendResponse({ success: false, error });
      });
    return true; // 保持消息通道开放
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SETTINGS") {
    sendResponse({ settings: cachedSettings });
    return true;
  }
});
