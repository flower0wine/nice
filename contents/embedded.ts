import { parseAndModifyCode } from "../utils";
import { logger } from "../utils/logger";

// 去除内嵌脚本的限制
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && (node as Element).tagName === "SCRIPT") {
          const scriptNode = node as HTMLScriptElement;
          const scriptType = scriptNode.type;
          if (
            (scriptType === "text/javascript" || scriptType === "") &&
            (!scriptNode.src || scriptNode.textContent)
          ) {
            scriptNode.textContent = parseAndModifyCode(scriptNode.textContent);
          }
        }
      });
    }
  });

  logger.success("已移除内嵌脚本的限制");
});

observer.observe(document.documentElement, { childList: true, subtree: true });
