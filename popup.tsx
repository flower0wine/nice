import "~/styles/popup.scss";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import React, { useCallback, useEffect, useState } from "react";
import { AccordionGroup } from "~/components/AccordionGroup";
import { AlertDialog } from "~/components/AlertDialog";
import { CopyButton } from "~/components/CopyButton";
import { FeatureWarning } from "~/components/FeatureWarning";
import { PopupFooter } from "~/components/PopupFooter";
import { PopupHeader } from "~/components/PopupHeader";
import { StatusIndicator } from "~/components/StatusIndicator";
import { ToggleSwitch } from "~/components/ToggleSwitch";
import { useMousePosition } from "~/hooks/useMousePosition";
import { setupAlertHandler } from "~/utils/alertHandler";
import { containerVariants, contentVariants } from "~/utils/animations";
import { setupCopyListener } from "~/utils/copyHandler";
import { checkFeatureSupport } from "~/utils/featureDetect";
import { logger } from "~/utils/logger";
import { storage } from "~/utils/storage";

const warningContentMap = {
  eventTip:
    "每次打开或关闭你都需要刷新网页令其生效。功能打开后可能会影响部分网站的正常功能。" +
    "如开启后网页无法正常加载，请刷新页面或关闭此功能并在 Github Issue 给出你的网址。",
  alertTip:
    "该选项打开后会去除网页原生弹窗（alert、prompt、confirm），如果网页已经弹窗则需要连续点击来关闭弹窗。" +
    "可能会影响部分网站的正常功能。",
  debuggerTip:
    "该选项打开后会禁用网页的 debugger。该选项不是万能的，如果你遇到无法生效的网站" +
    "请在 Github Issue 给出你的网址。"
};

// 将提示信息抽离为常量
const FEATURE_TOOLTIPS = {
  debugger:
    "由于某些原因去除 debugger 默认开启，如果需要关闭请禁用该插件，有些网页可能无法去除 debugger，" +
    "请在 Github Issue 给出你的网址。"
} as const;

function IndexPopup() {
  const [isPureCopyEnabled, setIsPureCopyEnabled] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [featureSupport, setFeatureSupport] = useState(null);
  const [isPreventCopyEnabled, setIsPreventCopyEnabled] = useState(false);
  const [isFormatEnabled, setIsFormatEnabled] = useState(false);
  const [isAlertDisabled, setIsAlertDisabled] = useState(false);
  const [isDebuggerDisabled, setIsDebuggerDisabled] = useState(true);
  const [isContextMenuDisabled, setIsContextMenuDisabled] = useState(false);
  const [isPasteDisabled, setIsPasteDisabled] = useState(false);
  const [isKeyboardDisabled, setIsKeyboardDisabled] = useState(false);
  const [showEventAlert, setShowEventAlert] = useState(false);
  const [tip, setTip] = useState("");

  useEffect(() => {
    // 检查剪贴板 API 支持
    const support = checkFeatureSupport("clipboard");

    if (!support.supported) {
      setShowWarning(true);
    }
    setFeatureSupport(support);
  }, []);

  // 在组件加载时检查当前页面是否启用纯文本复制
  useEffect(() => {
    const checkCurrentPageStatus = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      if (!tab.id) return;

      try {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // 返回一个对象包含两个状态
            return {
              pureCopyEnabled: !!(window as any).__pureCopyListener,
              preventCopyEnabled: !!(window as any).__preventCopyEnabled,
              formatEnabled: !!(window as any).__formatEnabled,
              alertEnabled: !!(window as any).__alertEnabled
            };
          }
        });

        setIsPureCopyEnabled(result.pureCopyEnabled);
        setIsPreventCopyEnabled(result.preventCopyEnabled);
        setIsFormatEnabled(result.formatEnabled);
        setIsAlertDisabled(result.alertEnabled);
      } catch (error) {
        logger.error("Failed to check page status:", error);
        setIsPureCopyEnabled(false);
        setIsPreventCopyEnabled(true);
        setIsFormatEnabled(true);
        setIsAlertDisabled(true);
      }
    };

    checkCurrentPageStatus();
  }, []);

  // 初始化时获取存储的状态
  useEffect(() => {
    const initializeSettings = async () => {
      const settings = await storage.getEventSettings();
      setIsContextMenuDisabled(settings.contextMenuDisabled || false);
      setIsPasteDisabled(settings.pasteDisabled || false);
      setIsKeyboardDisabled(settings.keyboardDisabled || false);
    };

    initializeSettings();
  }, []);

  if (showWarning) {
    return <FeatureWarning feature={featureSupport} />;
  }

  const toggleMode = useCallback(
    async (enabled: boolean, preventCopy: boolean, preserveFormat: boolean) => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      if (!tab.id) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: setupCopyListener,
        args: [enabled, preventCopy, preserveFormat]
      });
    },
    []
  );

  // 切换纯文本复制模式
  function toggleCopyMode() {
    const newState = !isPureCopyEnabled;
    setIsPureCopyEnabled(newState);

    if (newState) {
      setIsPreventCopyEnabled(true);
      setIsFormatEnabled(true);
      toggleMode(newState, true, true);
    } else {
      setIsPreventCopyEnabled(false);
      setIsFormatEnabled(false);
      toggleMode(newState, false, false);
    }
  }

  // 添加切换阻止复制的函数
  function togglePreventCopy() {
    if (isPureCopyEnabled) {
      const newState = !isPreventCopyEnabled;
      setIsPreventCopyEnabled(newState);

      toggleMode(isPureCopyEnabled, newState, isFormatEnabled);
    } else {
      setIsPreventCopyEnabled(false);
    }
  }

  // 保留复制内容的格式
  function toggleFormatCopy() {
    const newState = !isFormatEnabled;
    setIsFormatEnabled(newState);

    if (isPureCopyEnabled) {
      toggleMode(true, isPreventCopyEnabled, newState);
    }
  }

  const toggleAlert = async () => {
    const newState = !isAlertDisabled;
    setIsAlertDisabled(newState);

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (!tab.id) return;

    // 发送消息到内容脚本
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "TOGGLE_ALERT",
        enabled: newState
      });
    } catch (error) {
      console.error("Failed to toggle alert:", error);
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: setupAlertHandler,
      args: [newState]
    });
  };

  const updateSettings = async (settings: any) => {
    const currentSettings = await storage.getEventSettings();
    const newSettings = { ...currentSettings, ...settings };
    await chrome.runtime.sendMessage({
      type: "UPDATE_SETTINGS",
      settings: newSettings
    });
  };

  const toggleContextMenu = useCallback(async (state: boolean) => {
    const newState = !state;
    setIsContextMenuDisabled(newState);

    // 更新存储
    await storage.updateEventSettings({ contextMenuDisabled: newState });

    // 同步到 chrome.storage.local
    await updateSettings({ contextMenuDisabled: newState });

    // 发送消息到内容脚本
    // try {
    //   await chrome.tabs.sendMessage(tab.id, {
    //     type: "TOGGLE_CONTEXT_MENU",
    //     enabled: newState
    //   });
    // } catch (error) {
    //   console.error("Failed to toggle context menu:", error);
    // }
  }, []);

  const togglePaste = useCallback(async (state: boolean) => {
    const newState = !state;
    setIsPasteDisabled(newState);

    // 更新存储
    await storage.updateEventSettings({ pasteDisabled: newState });

    // 同步到 chrome.storage.local
    await updateSettings({ pasteDisabled: newState });

    // 发送消息到内容脚本
    // try {
    //   await chrome.tabs.sendMessage(tab.id, {
    //     type: "TOGGLE_PASTE",
    //     enabled: newState
    //   });
    // } catch (error) {
    //   console.error("Failed to toggle paste:", error);
    // }
  }, []);

  const toggleKeyboard = useCallback(async (state: boolean) => {
    const newState = !state;
    setIsKeyboardDisabled(newState);

    // 更新 localforage
    await storage.updateEventSettings({ keyboardDisabled: newState });

    // 同步到 chrome.storage.local
    await updateSettings({ keyboardDisabled: newState });

    // try {
    //   await chrome.tabs.sendMessage(tab.id, {
    //     type: "TOGGLE_KEYBOARD",
    //     enabled: newState
    //   });
    // } catch (error) {
    //   console.error("Failed to toggle keyboard:", error);
    // }
  }, []);

  const toggleDebugger = useCallback(async (state: boolean) => {
    const newState = !state;
    setIsDebuggerDisabled(newState);

    // 同步到 chrome.storage.local
    await updateSettings({ debuggerDisabled: newState });
  }, []);

  useMousePosition();

  // 在事件管理开关打开时显示弹窗
  const handleEventToggle = (open: boolean = true, handler: () => void) => {
    setShowEventAlert(open);
    handler();
  };

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark">
      <motion.div className="popup-wrapper" variants={containerVariants}>
        <PopupHeader title="网页功能增强" />

        <main className="popup-content">
          <AccordionGroup title="基石">
            <motion.div variants={contentVariants}>
              <CopyButton
                enabled={isPureCopyEnabled}
                onClick={toggleCopyMode}
                disabled={!featureSupport?.supported}
              />
              <div className="settings-group">
                <ToggleSwitch
                  enabled={isPreventCopyEnabled}
                  onChange={togglePreventCopy}
                  label="阻止页面原有的复制事件"
                  disabled={!isPureCopyEnabled}
                />
                <ToggleSwitch
                  enabled={isFormatEnabled}
                  onChange={toggleFormatCopy}
                  label="保留复制内容的格式"
                  disabled={!isPureCopyEnabled}
                />
                <StatusIndicator enabled={isPureCopyEnabled} />
              </div>
            </motion.div>
          </AccordionGroup>

          <AccordionGroup title="妖魔鬼怪快离开">
            <ToggleSwitch
              enabled={isAlertDisabled}
              onChange={() =>
                handleEventToggle(!isAlertDisabled, () => {
                  toggleAlert();
                  setTip(warningContentMap.alertTip);
                })
              }
              label="禁用网站原生弹窗"
            />
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div>
                    <ToggleSwitch
                      enabled={isDebuggerDisabled}
                      onChange={() =>
                        handleEventToggle(!isDebuggerDisabled, () => {
                          toggleDebugger(isDebuggerDisabled);
                          setTip(warningContentMap.debuggerTip);
                        })
                      }
                      disabled={true}
                      label="禁用网页 debugger"
                    />
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="TooltipContent" sideOffset={5}>
                    {FEATURE_TOOLTIPS.debugger}
                    <Tooltip.Arrow className="TooltipArrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </AccordionGroup>

          <AccordionGroup
            title="想干嘛就干嘛~"
            warningText="该菜单项操作为全局设置，需刷新网页后生效，当前页面不保存开关状态">
            <ToggleSwitch
              enabled={isContextMenuDisabled}
              onChange={() =>
                handleEventToggle(!isContextMenuDisabled, () => {
                  toggleContextMenu(isContextMenuDisabled);
                  setTip(warningContentMap.eventTip);
                })
              }
              label="禁用右键菜单限制"
            />
            <ToggleSwitch
              enabled={isPasteDisabled}
              onChange={() =>
                handleEventToggle(!isPasteDisabled, () => {
                  togglePaste(isPasteDisabled);
                  setTip(warningContentMap.eventTip);
                })
              }
              label="禁用粘贴限制"
            />
            <ToggleSwitch
              enabled={isKeyboardDisabled}
              onChange={() =>
                handleEventToggle(!isKeyboardDisabled, () => {
                  toggleKeyboard(isKeyboardDisabled);
                  setTip(warningContentMap.eventTip);
                })
              }
              label="禁用键盘事件限制"
            />
          </AccordionGroup>

          <AlertDialog
            isOpen={showEventAlert}
            onClose={() => setShowEventAlert(false)}
            title="注意事项"
            content={tip}
          />
        </main>

        <motion.footer className="popup-footer" variants={contentVariants}>
          <PopupFooter />
        </motion.footer>
      </motion.div>
    </ThemeProvider>
  );
}

export default IndexPopup;
