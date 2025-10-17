import { STORAGE_KEY, type EventSettings } from "./constants";
import { logger } from "~/utils/logger";

let cachedSettings: EventSettings | null = null;

export async function initCache() {
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

export function getCachedSettings(): EventSettings | null {
  return cachedSettings;
}

export function setCachedSettings(s: EventSettings) {
  cachedSettings = s;
}

export function registerStorageListener() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes[STORAGE_KEY]) {
      cachedSettings = changes[STORAGE_KEY].newValue;
      logger.info("Settings updated:", cachedSettings);
    }
  });
}
