import { motion } from "framer-motion";
import { IconCheck, IconX } from "@tabler/icons-react";
import "~/styles/components/ToggleSwitch.scss";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

export function ToggleSwitch({ enabled, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <motion.label
      className={`toggle-switch-wrapper ${disabled ? "disabled" : ""}`}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <div className="label-container">
        <motion.span
          className="toggle-label"
          animate={{
            color: enabled ? "var(--success-color)" : "var(--text-secondary)",
          }}
        >
          {label}
        </motion.span>
        <motion.span
          className="toggle-status"
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: 1,
            y: 0,
            color: enabled ? "var(--success-color)" : "var(--text-tertiary)",
          }}
        >
          {enabled ? (
            <span className="status-text enabled">
              <IconCheck size={12} className="status-icon" />
              已启用
            </span>
          ) : (
            <span className="status-text disabled">
              <IconX size={12} className="status-icon" />
              未启用
            </span>
          )}
        </motion.span>
      </div>

      <div className={`toggle-switch ${enabled ? "enabled" : "disabled"}`}>
        <input type="checkbox" checked={enabled} onChange={onChange} disabled={disabled} />
        <motion.div
          className="toggle-track"
          animate={{
            backgroundColor: enabled ? "var(--success-color)" : "var(--disabled-color)",
          }}
        >
          <motion.div
            className="track-background"
            animate={{
              opacity: enabled ? 1 : 0,
            }}
          />
        </motion.div>

        <motion.div
          className="toggle-slider"
          animate={{
            x: enabled ? 20 : 0,
            rotate: enabled ? 360 : 0,
            scale: enabled ? 1.1 : 1,
            backgroundColor: enabled ? "white" : "var(--background-secondary)",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          <motion.div
            className="slider-ring"
            animate={{
              opacity: enabled ? 1 : 0,
              scale: enabled ? 1.2 : 0.8,
            }}
          />
          <motion.div
            className="toggle-icon"
            animate={{
              scale: enabled ? 1 : 0,
              opacity: enabled ? 1 : 0,
            }}
          >
            {enabled && <IconCheck size={12} />}
          </motion.div>
          <motion.div
            className="toggle-icon disabled-icon"
            animate={{
              scale: !enabled ? 1 : 0,
              opacity: !enabled ? 1 : 0,
            }}
          >
            {!enabled && <IconX size={12} />}
          </motion.div>
        </motion.div>
      </div>
    </motion.label>
  );
}
