import { motion } from "framer-motion";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import "~/styles/components/CopyButton.scss";

interface CopyButtonProps {
  enabled: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function CopyButton({ enabled, onClick, disabled }: CopyButtonProps) {
  return (
    <button
      className={`copy-button ${enabled ? "enabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="button-background" />
      <motion.div className="button-content" layout>
        <motion.div className="icon-wrapper" layout>
          {enabled ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <IconCheck size={24} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <IconCopy size={24} />
            </motion.div>
          )}
        </motion.div>
        <motion.span className="button-text" layout>
          {enabled ? "已启用复制" : "启用复制"}
        </motion.span>
      </motion.div>
    </button>
  );
}
