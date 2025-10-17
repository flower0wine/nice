import { injectNativeFunctions } from "~/utils/nativeFunctions";
import { logger } from "~/utils/logger";
import { getCachedSettings, initCache } from "./storage";

export function setupWebNavigation() {
  chrome.webNavigation.onCommitted.addListener(
    async (details) => {
      try {
        // Inject native functions first
        await chrome.scripting.executeScript({
          target: { tabId: details.tabId },
          func: (code) => {
            const script = document.createElement("script");
            script.textContent = code as string;
            document.documentElement.appendChild(script);
            script.remove();
          },
          args: [injectNativeFunctions()],
          world: "MAIN",
          injectImmediately: true
        });

        // Ensure cache is ready
        if (!getCachedSettings()) {
          await initCache();
        }

        const settings = getCachedSettings();

        await chrome.scripting.executeScript({
          target: { tabId: details.tabId },
          func: (settings) => {
            Object.defineProperty(window, "__NICE_EXTENSION_SETTINGS__", {
              value: settings,
              writable: false,
              configurable: false
            });
          },
          args: [settings],
          world: "MAIN",
          injectImmediately: true
        });
      } catch (error) {
        logger.error("Failed to inject native functions:", error as any);
      }
    },
    { url: [{ schemes: ["http", "https"] }] }
  );
}
