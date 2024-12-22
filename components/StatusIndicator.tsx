import { IconCircleCheck, IconCircleX, IconCopy } from "@tabler/icons-react";
import { motion } from "framer-motion";
import "~/styles/components/StatusIndicator.scss";

interface StatusIndicatorProps {
  enabled: boolean;
}

export function StatusIndicator({ enabled }: StatusIndicatorProps) {
  return (
    <motion.div
      className="status-indicator"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <div className={`status-content ${enabled ? "enabled" : ""}`}>
        <motion.div
          className="status-icon-wrapper"
          animate={{
            rotate: enabled ? 360 : 0,
            scale: enabled ? 1 : 0.8
          }}
          transition={{
            rotate: { duration: 0.5 },
            scale: { duration: 0.3 }
          }}>
          <div className="status-icon">
            {enabled ? (
              <IconCircleCheck size={20} />
            ) : (
              <IconCircleX size={20} />
            )}
          </div>
          <div className="status-badge">
            <IconCopy size={12} />
          </div>
        </motion.div>

        <div className="status-info">
          <motion.span
            className="status-text"
            animate={{
              y: enabled ? [0, -10, 0] : 0,
              opacity: [1, 0, 1]
            }}
            transition={{ duration: 0.5 }}>
            {enabled ? "已启用文本复制" : "未启用文本复制"}
          </motion.span>
          <motion.span
            className="status-description"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}>
            {enabled
              ? "现在可以自由复制页面文本内容"
              : "点击上方按钮启用复制功能"}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
