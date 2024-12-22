declare global {
  interface Window {
    __alertEnabled: boolean;
  }
}

export function setupAlertHandler(enabled: boolean) {
  window.__alertEnabled = enabled;
}
