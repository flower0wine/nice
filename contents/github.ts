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
      logger.info(
        "GitHub clipboard: element value patched with git clone prefix"
      );
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

// ============== Clone Button Injection ==============

function getRepoCloneUrl(): string | null {
  // Prefer GitHub provided value on the page
  // 1) Inputs that GitHub uses inside the Code dialog
  const sshInput = document.getElementById(
    "clone-with-ssh"
  ) as HTMLInputElement | null;
  const httpsInput = document.getElementById(
    "clone-with-https"
  ) as HTMLInputElement | null;
  const sshVal = sshInput?.value?.trim();
  const httpsVal = httpsInput?.value?.trim();
  if (sshVal) return sshVal;
  if (httpsVal) return httpsVal;

  return null;
}

function createCloneButton() {
  if (document.getElementById("nice-github-clone-btn")) return;

  const bg = "#428f46";
  const cloningBg = "#0969da";
  const failedBg = "#d1242f";
  const noUrlBg = "#9e9e9e";

  const btn = document.createElement("button");
  btn.id = "nice-github-clone-btn";
  btn.textContent = "Clone Local";
  // GitHub-like primary button style
  btn.style.width = "100%";
  btn.style.display = "inline-flex";
  btn.style.justifyContent = "center";
  btn.style.alignItems = "center";
  btn.style.gap = "6px";
  btn.style.padding = "6px 12px";
  btn.style.margin = "0 0 6px 0";
  btn.style.borderRadius = "6px";
  btn.style.border = "1px solid rgba(27,31,36,0.15)";
  btn.style.background = bg;
  btn.style.color = "#fff";
  btn.style.fontSize = "16px";
  btn.style.fontWeight = "700";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 1px 0 rgba(27,31,36,0.1)";

  const setState = (txt: string, bg?: string) => {
    btn.textContent = txt;
    if (bg) btn.style.background = bg;
  };

  btn.addEventListener("click", async () => {
    try {
      const url = getRepoCloneUrl();
      if (!url) {
        logger.warn("Clone: cannot determine repository URL");
        setState("No Repo URL", noUrlBg);
        return;
      }

      setState("Cloning...", cloningBg);
      const res = await chrome.runtime.sendMessage({
        type: "GITHUB_CLONE",
        url
      });

      if (res?.success) {
        logger.success("Clone: request sent", url);
        setState("Requested", bg);
      } else {
        logger.error("Clone: request failed", res?.error || "Unknown error");
        setState("Failed", failedBg);
      }
    } catch (e) {
      logger.error("Clone: message error", e as any);
      setState("Failed", failedBg);
    } finally {
      setTimeout(() => setState("Clone Local", bg), 1500);
    }
  });

  // Try to place the button right below the specified container
  const placeButton = () => {
    const container = document.querySelector(
      'div[class*="LocalTab-module__CloneContainer--fne3C"], div[class*="LocalTab-module__CloneContainer--"]'
    );
    if (container && container.parentElement) {
      // Insert right before the container (place ABOVE it)
      container.parentElement.insertBefore(btn, container);
      logger.debug("Clone button placed above CloneContainer");
      return true;
    }
    return false;
  };

  if (!placeButton()) {
    // Fallback: append near body top if target not found yet
    document.body.appendChild(btn);
    logger.debug(
      "Clone button fallback placed in body; waiting for target to appear"
    );

    // Observe until the target appears, then move it below target once
    const obs = new MutationObserver(() => {
      if (placeButton()) {
        obs.disconnect();
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
}

try {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createCloneButton, {
      once: true
    });
  } else {
    createCloneButton();
  }
} catch {}

