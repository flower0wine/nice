import { logger } from "~/utils/logger";

export async function handleFetchScript(req: { url: string }) {
  try {
    const response = await fetch(req.url);
    const code = await response.text();
    return { success: true, code, originalUrl: req.url };
  } catch (error: any) {
    logger.error("获取脚本失败:", error);
    return { success: false, error: error?.message };
  }
}
export async function cloneRepo(url: string) {
  try {
    const res = await fetch("http://localhost:9000/git/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `HTTP ${res.status}: ${text}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, data };
  } catch (e: any) {
    logger.error("Clone request failed:", e);
    return { success: false, error: e?.message || String(e) };
  }
}

function wrapCodeInIIFE(code: string) {
  return `(function() {\n   try {\n     ${code}\n   } catch(e) {\n     console.error("Script execution failed:", e)\n   }\n })();`;
}

export async function handleInjectScript(req: {
  code: string;
  originalUrl: string;
}) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (!tab?.id) throw new Error("No active tab found");

    const wrappedCode = wrapCodeInIIFE(req.code);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: (code, originalUrl) => {
        try {
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.textContent = code as string;
          script.setAttribute("data-original-src", originalUrl as string);
          (document.head || document.documentElement).appendChild(script);
        } catch (e) {
          console.error("Script injection failed:", e);
        }
      },
      args: [wrappedCode, req.originalUrl]
    });
    return { success: true };
  } catch (error: any) {
    logger.error("注入脚本失败:", error);
    return { success: false, error: error?.message };
  }
}

export async function patchGithubClipboard(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        try {
          const w: any = window as any;
          if (w.__nice_writeText_patched__) {
            logger.debug("GitHub clipboard patch: already applied", { tabId });
            return;
          }

          const originalWriteText =
            navigator.clipboard && navigator.clipboard.writeText;
          if (!originalWriteText) {
            logger.warn(
              "GitHub clipboard patch: navigator.clipboard.writeText unavailable",
              { tabId }
            );
            return;
          }

          w.__nice_writeText_patched__ = true;

          function isRepoCloneUrl(text: string): boolean {
            if (!text) return false;
            try {
              const https =
                /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?(?:#.*)?$/i;
              const ssh = /^git@github\.com:[\w.-]+\/[\w.-]+(?:\.git)?$/i;
              return https.test(text) || ssh.test(text);
            } catch {
              return false;
            }
          }

          function withGitClonePrefix(text: string): string {
            const trimmed = (text || "").trim();
            if (!trimmed) return text;
            if (/^git\s+clone\b/i.test(trimmed)) return text;
            if (isRepoCloneUrl(trimmed)) return `git clone ${trimmed}`;
            return text;
          }

          const patched = async (text: string) => {
            try {
              return await originalWriteText.call(
                navigator.clipboard,
                withGitClonePrefix(text)
              );
            } catch (e) {
              return await originalWriteText.call(navigator.clipboard, text);
            }
          };

          try {
            Object.defineProperty(navigator.clipboard, "writeText", {
              value: patched,
              configurable: true,
              writable: true
            });
          } catch {
            (navigator.clipboard as any).writeText = patched as any;
          }

          logger.success("GitHub clipboard patch: applied", { tabId });
        } catch (e: any) {
          logger.error("GitHub clipboard patch: execution error", e as any);
          throw e;
        }
      }
    });
  } catch (e) {
    logger.error("GitHub clipboard patch: failed to execute", e as any);
    throw e;
  }
}

