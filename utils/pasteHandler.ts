declare global {
  interface Window {
    __pasteEnabled: boolean;
  }
}

export function setupPasteHandler(enabled: boolean) {
  window.__pasteEnabled = enabled;

  if (enabled) {
    const overrideMethods = `
      document.onpaste = null;
      document.addEventListener('paste', function(e) {
        e.stopPropagation();
      }, true);
    `;

    const script = document.createElement("script");
    script.textContent = overrideMethods;
    document.documentElement.appendChild(script);
    script.remove();
  } else {
    window.__pasteEnabled = false;
  }
}
