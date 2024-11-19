import "~/styles/popup.scss";
import React, { useEffect, useState, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { PopupHeader } from "~/components/PopupHeader";
import { FeatureWarning } from "~/components/FeatureWarning";
import { CopyButton } from "~/components/CopyButton";
import { StatusIndicator } from "~/components/StatusIndicator";
import { PopupFooter } from "~/components/PopupFooter";
import { checkFeatureSupport } from "~/utils/featureDetect";
import { containerVariants, contentVariants } from "~/utils/animations";
import { setupCopyListener } from "~/utils/copyHandler";
import { ToggleSwitch } from "~/components/ToggleSwitch";
import { logger } from "~/utils/logger";
import { useMousePosition } from "~/hooks/useMousePosition";

function IndexPopup() {
  const [isPureCopyEnabled, setIsPureCopyEnabled] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [featureSupport, setFeatureSupport] = useState(null);
  const [isPreventCopyEnabled, setIsPreventCopyEnabled] = useState(false);
  const [isFormatEnabled, setIsFormatEnabled] = useState(false);

  useEffect(() => {
    // 检查剪贴板 API 支持
    const support = checkFeatureSupport("clipboard");
    setFeatureSupport(support);

    if (!support.supported) {
      setShowWarning(true);
    }
  }, []);

  // 在组件加载时检查当前页面是否启用纯文本复制
  useEffect(() => {
    const checkCurrentPageStatus = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
            };
          },
        });

        setIsPureCopyEnabled(result.pureCopyEnabled);
        setIsPreventCopyEnabled(result.preventCopyEnabled);
        setIsFormatEnabled(result.formatEnabled);
      } catch (error) {
        logger.error("Failed to check page status:", error);
        setIsPureCopyEnabled(false);
        setIsPreventCopyEnabled(true);
        setIsFormatEnabled(true);
      }
    };

    checkCurrentPageStatus();
  }, []);

  const toggleMode = useCallback(
    async (enabled: boolean, preventCopy: boolean, preserveFormat: boolean) => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: setupCopyListener,
        args: [enabled, preventCopy, preserveFormat],
      });
    },
    []
  );

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

  function toggleFormatCopy() {
    const newState = !isFormatEnabled;
    setIsFormatEnabled(newState);

    if (isPureCopyEnabled) {
      toggleMode(true, isPreventCopyEnabled, newState);
    }
  }

  useMousePosition();

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark">
      <motion.div
        className="popup-wrapper"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <PopupHeader title="网页复制插件" />

        <AnimatePresence>
          {showWarning && featureSupport && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FeatureWarning feature={featureSupport} onClose={() => setShowWarning(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="popup-content">
          <motion.div
            variants={contentVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CopyButton
              enabled={isPureCopyEnabled}
              onClick={toggleCopyMode}
              disabled={!featureSupport?.supported}
            />
          </motion.div>

          <motion.div className="settings-group" variants={contentVariants}>
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
          </motion.div>

          <motion.div variants={contentVariants}>
            <StatusIndicator enabled={isPureCopyEnabled} />
          </motion.div>
        </main>

        <motion.footer className="popup-footer" variants={contentVariants}>
          <PopupFooter />
        </motion.footer>
      </motion.div>
    </ThemeProvider>
  );
}

export default IndexPopup;
