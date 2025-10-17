import { logger } from "~/utils/logger";
import { STORAGE_KEY } from "./constants";
import { getCachedSettings } from "./storage";
import { handleFetchScript, handleInjectScript, patchGithubClipboard, cloneRepo } from "./handlers";

export function registerMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FETCH_SCRIPT") {
      handleFetchScript(message)
        .then(sendResponse)
        .catch((error) => {
          logger.error("Fetch script error:", error);
          sendResponse({ success: false, error: (error as any)?.message });
        });
      return true;
    }

    if (message.type === "INJECT_SCRIPT") {
      handleInjectScript(message)
        .then(sendResponse)
        .catch((error) => {
          logger.error("Inject script error:", error);
          sendResponse({ success: false, error: (error as any)?.message });
        });
      return true;
    }

    if (message.type === "PATCH_GITHUB_CLIPBOARD") {
      (async () => {
        try {
          const tabId = sender.tab?.id;
          if (!tabId) throw new Error("No active tab for clipboard patch");
          await patchGithubClipboard(tabId);
          sendResponse({ success: true });
        } catch (error) {
          logger.error("PATCH_GITHUB_CLIPBOARD failed:", error as any);
          sendResponse({ success: false, error: (error as any)?.message });
        }
      })();
      return true;
    }

    if (message.type === "GITHUB_CLONE") {
      cloneRepo(message.url)
        .then(sendResponse)
        .catch((error) => {
          logger.error("GITHUB_CLONE failed:", error as any);
          sendResponse({ success: false, error: (error as any)?.message });
        });
      return true;
    }
  });

  // Popup messages: UPDATE_SETTINGS / GET_SETTINGS
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "UPDATE_SETTINGS") {
      chrome.storage.local
        .set({ [STORAGE_KEY]: message.settings })
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          logger.error("Failed to update settings:", error);
          sendResponse({ success: false, error });
        });
      return true;
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_SETTINGS") {
      sendResponse({ settings: getCachedSettings() });
      return true;
    }
  });
}
