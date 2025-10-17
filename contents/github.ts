// GitHub clone URL enhancer: prepend `git clone ` when copying repository git links
import { logger } from "../utils/logger";

function isRepoCloneUrl(text: string): boolean {
  if (!text) return false;
  try {
    // Match common GitHub clone URL forms
    // 1) HTTPS: https://github.com/owner/repo(.git)
    // 2) SSH: git@github.com:owner/repo(.git)
    const https =
      /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?(?:#.*)?$/i;
    const ssh = /^git@github\.com:[\w.-]+\/[\w.-]+(?:\.git)?$/i;
    return https.test(text) || ssh.test(text);
  } catch {
    return false;
  }
}

function withGitClonePrefix(text: string): string {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return text;
  if (/^git\s+clone\b/i.test(trimmed)) return text; // already has prefix
  if (isRepoCloneUrl(trimmed)) return `git clone ${trimmed}`;
  return text;
}

// Patch navigator.clipboard.writeText in page MAIN world
function injectClipboardPatch() {
  try {
    // Ask background to patch in MAIN world via chrome.scripting.executeScript
    logger.debug("GitHub clipboard: request patch from background");
    chrome.runtime
      .sendMessage({ type: "PATCH_GITHUB_CLIPBOARD" })
      .then(() => logger.debug("GitHub clipboard: patch request sent"))
      .catch((e) => logger.error("GitHub clipboard: patch request failed", e));
  } catch {}
}

// Intercept GitHub's <clipboard-copy> element clicks and modify its value
function setupClipboardCopyElementHook() {
  const markAttr = "data-nice-clone-prefixed";

  const tryPatchElement = (el: Element) => {
    if (!el) return;
    if (el.getAttribute(markAttr) === "1") {
      logger.debug("GitHub clipboard: element already patched");
      return;
    }

    // GitHub uses <clipboard-copy value="..."> or data-clipboard-text
    const anyEl = el as any;
    const valueAttr =
      anyEl.getAttribute?.("value") ??
      anyEl.getAttribute?.("data-clipboard-text");
    if (typeof valueAttr === "string" && isRepoCloneUrl(valueAttr)) {
      const newValue = withGitClonePrefix(valueAttr);
      if (anyEl.hasAttribute && anyEl.hasAttribute("value")) {
        anyEl.setAttribute("value", newValue);
      } else if (
        anyEl.hasAttribute &&
        anyEl.hasAttribute("data-clipboard-text")
      ) {
        anyEl.setAttribute("data-clipboard-text", newValue);
      }
      anyEl.setAttribute?.(markAttr, "1");
      logger.info("GitHub clipboard: element value patched with git clone prefix");
    }
  };

  // Initial scan
  const scan = () => {
    logger.debug("GitHub clipboard: initial scan");
    document
      .querySelectorAll("clipboard-copy, [data-clipboard-text]")
      .forEach(tryPatchElement);
  };

  // Click capture: handle dynamic values right before copy
  const onClick = (e: Event) => {
    const target = e.target as Element | null;
    if (!target) return;
    const host = target.closest?.("clipboard-copy, [data-clipboard-text]");
    if (host) {
      logger.debug("GitHub clipboard: click capture on clipboard element");
      tryPatchElement(host);
    }
  };

  // Observe mutations to patch dynamically inserted nodes
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes?.forEach?.((n) => {
        if (n instanceof Element) {
          if (n.matches("clipboard-copy, [data-clipboard-text]")) {
            tryPatchElement(n);
          }
          n
            .querySelectorAll?.("clipboard-copy, [data-clipboard-text]")
            .forEach(tryPatchElement);
        }
      });
    }
  });

  window.addEventListener("click", onClick, true);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  scan();
}

// Run asap
try {
  injectClipboardPatch();
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      setupClipboardCopyElementHook,
      { once: true }
    );
  } else {
    setupClipboardCopyElementHook();
  }
} catch {}

