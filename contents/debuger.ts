import { parseAndModifyCode } from "../utils";
import { logger } from "../utils/logger";

// 跟踪脚本加载状态
const scriptLoadPromises = new Map<string, Promise<void>>();

// 通过 background script 注入代码
async function injectViaBackground(
  code: string,
  originalUrl: string,
  options: { async?: boolean; defer?: boolean } = {}
) {
  try {
    // 如果是 defer 脚本，等待 DOMContentLoaded
    if (options.defer) {
      await new Promise<void>((resolve) => {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => resolve());
        } else {
          resolve();
        }
      });
    }

    // 如果不是 async 脚本，等待之前的脚本加载完成
    if (!options.async) {
      const previousPromises = Array.from(scriptLoadPromises.values());
      if (previousPromises.length > 0) {
        await Promise.all(previousPromises);
      }
    }

    // 创建新的加载 Promise
    const loadPromise = chrome.runtime.sendMessage({
      type: "INJECT_SCRIPT",
      code,
      originalUrl
    });

    // 存储 Promise 以供后续脚本使用
    scriptLoadPromises.set(originalUrl, loadPromise);

    // 等待脚本加载完成
    await loadPromise;

    // 加载完成后删除 Promise
    scriptLoadPromises.delete(originalUrl);
  } catch (error) {
    logger.error("发送消息失败:", error);
    scriptLoadPromises.delete(originalUrl);
  }
}

// 通过 background script 获取脚本内容
async function fetchViaBackground(url: string) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "FETCH_SCRIPT",
      url
    });

    if (response.success) {
      return response.code;
    }
    throw new Error("获取脚本失败");
  } catch (error) {
    logger.error("获取脚本失败:", error);
    return "";
  }
}

// 检查是否是扩展程序的URL
function isExtensionUrl(url: string): boolean {
  if (!url) return false;

  return (
    url.startsWith("chrome-extension://") || // Chrome
    url.startsWith("moz-extension://") || // Firefox
    url.startsWith("ms-browser-extension://") || // Edge
    url.startsWith("safari-extension://") || // Safari
    url.startsWith("opera-extension://")
  );
}

// 跟踪已处理的脚本
const processedScripts = new Set<string>();

const dynamicObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach(async (node) => {
        // 处理动态添加的脚本标签
        if (node.nodeType === 1 && (node as Element).tagName === "SCRIPT") {
          const scriptNode = node as HTMLScriptElement;

          // 不处理扩展程序的脚本
          if (scriptNode.src && isExtensionUrl(scriptNode.src)) {
            return;
          }

          // 检查脚本是否已经处理过
          if (scriptNode.src && processedScripts.has(scriptNode.src)) {
            return;
          }

          // 保存原始属性
          const originalAsync = scriptNode.async;
          const originalDefer = scriptNode.defer;
          const originalType = scriptNode.type;

          // 处理内联脚本
          if (
            (scriptNode.textContent || !scriptNode.src) &&
            originalType === "text/javascript"
          ) {
            scriptNode.textContent = parseAndModifyCode(scriptNode.textContent);
          }

          // 处理外部脚本
          if (scriptNode.src && !isExtensionUrl(scriptNode.src)) {
            try {
              // 在移除之前保存 src
              const originalSrc = scriptNode.src;

              // 标记脚本为已处理
              processedScripts.add(originalSrc);

              // 暂时断开观察器
              dynamicObserver.disconnect();

              scriptNode.remove();

              try {
                let code = await fetchViaBackground(originalSrc);
                code = code.replace(/debugger/g, "");

                if (code) {
                  // 注入脚本时传入原始的 async 和 defer 属性
                  await injectViaBackground(code, originalSrc, {
                    async: originalAsync,
                    defer: originalDefer
                  });
                }
              } catch (error) {
                logger.error("处理外部脚本失败:", error);
              } finally {
                // 重新连接观察器
                dynamicObserver.observe(document.documentElement, {
                  childList: true,
                  subtree: true,
                  characterData: true
                });
              }
            } catch (error) {
              logger.error("移除外部脚本失败:", error);
            }
          }
        }

        // 处理动态添加的字符串（可能包含 debugger）
        if (node.nodeType === 3) {
          // 文本节点
          const textContent = (node as Text).textContent;
          if (textContent && textContent.includes("debugger")) {
            (node as Text).textContent = textContent.replace(/debugger/g, "");
          }
        }
      });
    }
  });
});

// 配置观察器
dynamicObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true
});
