declare global {
  interface Window {
    __contextMenuEnabled: boolean;
  }
}

export function setupContextMenuHandler(enabled: boolean) {
  window.__contextMenuEnabled = enabled;

  if (enabled) {
    document.oncontextmenu = function (e) {
      e.stopPropagation();
      return true;
    };
  }
}
