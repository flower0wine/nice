declare global {
  interface Window {
    __pureCopyListener: ((e: ClipboardEvent) => void) | null;
    __preventCopyEnabled: boolean;
    __niceStyle: HTMLStyleElement | null;
    __formatEnabled: boolean;
  }
}

// 主函数
export function setupCopyListener(
  enabled: boolean,
  preventCopy: boolean = false,
  formatEnabled: boolean = false
) {
  // 初始化全局变量
  window.__pureCopyListener = window.__pureCopyListener || null;
  window.__preventCopyEnabled = preventCopy;
  window.__niceStyle = window.__niceStyle || null;
  window.__formatEnabled = formatEnabled;

  // 处理富文本复制
  function formatCopy(e: ClipboardEvent, container: HTMLDivElement) {
    try {
      // 首先尝试现代 API
      if (navigator.clipboard && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          "text/html": new Blob([container.innerHTML], { type: "text/html" }),
          "text/plain": new Blob([container.innerText], { type: "text/plain" })
        });
        navigator.clipboard.write([clipboardItem]);
        return true;
      }

      // 然后尝试 clipboardData
      if (e.clipboardData) {
        e.preventDefault();
        e.clipboardData.setData("text/html", container.innerHTML);
        e.clipboardData.setData("text/plain", container.innerText);
        return true;
      }

      // 最后使用 execCommand
      const selection = window.getSelection();
      if (!selection) return false;

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = container.innerHTML;
      document.body.appendChild(tempDiv);

      const range = document.createRange();
      range.selectNode(tempDiv);
      selection.removeAllRanges();
      selection.addRange(range);

      const result = document.execCommand("copy");
      document.body.removeChild(tempDiv);
      selection.removeAllRanges();
      return result;
    } catch (error) {
      console.log("富文本复制失败:", error);
      return false;
    }
  }

  // 处理纯文本复制
  function pureCopy(e: ClipboardEvent, container: HTMLDivElement) {
    const text = container.innerText || container.textContent || "";
    if (!text.trim()) return false;

    try {
      if (e.clipboardData) {
        e.preventDefault();
        e.clipboardData.setData("text/plain", text);
        return true;
      }

      navigator.clipboard.writeText(text);
      return true;
    } catch (clipError) {
      console.log("纯文本剪贴板错误:", clipError);
      try {
        const tempInput = document.createElement("textarea");
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        const result = document.execCommand("copy");
        document.body.removeChild(tempInput);
        return result;
      } catch (error) {
        console.log("无法复制文本:", error);
        return false;
      }
    }
  }

  // 移除所有 user-select: none 样式
  function removeUserSelectNone() {
    const style = document.createElement("style");
    style.innerHTML = `
    * {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }
  `;
    document.head.appendChild(style);
    window.__niceStyle = style;
  }

  // 清理现有的复制监听器
  function cleanupExistingListener() {
    if (window.__pureCopyListener) {
      document.removeEventListener("copy", window.__pureCopyListener, {
        capture: true
      });
      window.__pureCopyListener = null;
      console.log("已移除原有复制事件");
    }
  }

  // 主要的复制处理函数
  function handleCopy(
    e: ClipboardEvent,
    preventCopy: boolean,
    formatEnabled: boolean
  ) {
    if (preventCopy) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);
      const container = document.createElement("div");
      container.appendChild(range.cloneContents());

      const success = formatEnabled
        ? formatCopy(e, container)
        : pureCopy(e, container);

      if (success) {
        console.log(
          `已复制${formatEnabled ? "富文本" : "纯文本"}:`,
          formatEnabled ? container.innerHTML : container.innerText
        );
      }
    } catch (error) {
      console.log("复制失败:", error);
    }
  }

  // 清理现有监听器
  cleanupExistingListener();

  window.__niceStyle?.remove();
  window.alert = () => {};

  if (enabled) {
    removeUserSelectNone();

    // 设置新的复制处理器
    const copyHandler = (e: ClipboardEvent) => {
      handleCopy(e, preventCopy, formatEnabled);
    };
    window.__pureCopyListener = copyHandler;
    document.addEventListener("copy", copyHandler, { capture: true });

    console.log("已启用复制模式");
  }
}
