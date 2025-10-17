import { logger } from "~/utils/logger";

// Use Chrome enums to satisfy TS types
const HeaderOperation = chrome.declarativeNetRequest.HeaderOperation;
const ResourceType = chrome.declarativeNetRequest.ResourceType;
const RuleActionType = chrome.declarativeNetRequest.RuleActionType;

export function setupDnrRules() {
  // Update rules to remove CSP on main_frame
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: RuleActionType.MODIFY_HEADERS,
          responseHeaders: [
            { header: "content-security-policy", operation: HeaderOperation.REMOVE },
            { header: "content-security-policy-report-only", operation: HeaderOperation.REMOVE },
            { header: "x-content-security-policy", operation: HeaderOperation.REMOVE },
            { header: "x-webkit-csp", operation: HeaderOperation.REMOVE }
          ]
        },
        condition: {
          urlFilter: "*",
          resourceTypes: [ResourceType.MAIN_FRAME]
        }
      }
    ]
  });

  logger.info("CSP 修改器已启动");

  // Debug logs for headers
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      logger.info("收到响应头:", details.url);
      logger.info("响应头内容:", details.responseHeaders);
    },
    { urls: ["<all_urls>"], types: [ResourceType.MAIN_FRAME] as any },
    ["responseHeaders"]
  );
}
