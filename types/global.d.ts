declare global {
  interface Window {
    __niceStyle: HTMLStyleElement | null;
    __devToolsEnabled: boolean;
    __alertEnabled: boolean;
    __contextMenuEnabled: boolean;
    __pasteEnabled: boolean;
    __pureCopyListener: ((e: ClipboardEvent) => void) | null;
    __preventCopyEnabled: boolean;
    __formatEnabled: boolean;
  }
}

export {};
