import localforage from "localforage";

// 初始化 localforage
localforage.config({
  name: "web-helper",
  storeName: "settings"
});

interface EventSettings {
  contextMenuDisabled: boolean;
  pasteDisabled: boolean;
  keyboardDisabled: boolean;
  debuggerDisabled: boolean;
}

const STORAGE_KEY = "event_settings";

export const storage = {
  // 获取事件设置
  getEventSettings: async (): Promise<EventSettings> => {
    try {
      const settings = await localforage.getItem<EventSettings>(STORAGE_KEY);
      return (
        settings || {
          contextMenuDisabled: false,
          pasteDisabled: false,
          keyboardDisabled: false,
          debuggerDisabled: false
        }
      );
    } catch (error) {
      console.error("Failed to get event settings:", error);
      return {
        contextMenuDisabled: false,
        pasteDisabled: false,
        keyboardDisabled: false,
        debuggerDisabled: false
      };
    }
  },

  // 更新事件设置
  updateEventSettings: async (
    settings: Partial<EventSettings>
  ): Promise<void> => {
    try {
      const currentSettings = await storage.getEventSettings();
      const newSettings = { ...currentSettings, ...settings };
      await localforage.setItem(STORAGE_KEY, newSettings);
    } catch (error) {
      console.error("Failed to update event settings:", error);
    }
  }
};
