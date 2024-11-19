import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { IconCopy, IconSparkles } from "@tabler/icons-react";
import { contentVariants } from "~/utils/animations";
import "~/styles/components/PopupHeader.scss";

interface PopupHeaderProps {
  title: string;
}

export function PopupHeader({ title }: PopupHeaderProps) {
  return (
    <motion.header className="popup-header" variants={contentVariants}>
      <div className="header-content">
        <div className="title-group">
          <motion.div
            className="icon-wrapper"
            whileHover={{
              rotate: 360,
              scale: 1.1,
              boxShadow: "0 0 15px var(--success-shadow)",
            }}
            transition={{ duration: 0.5 }}
          >
            <IconCopy size={24} />
            <motion.div
              className="sparkle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <IconSparkles size={12} />
            </motion.div>
          </motion.div>

          <div className="text-group">
            <motion.div className="title-wrapper">
              <motion.h1
                className="popup-title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {title}
              </motion.h1>
              <motion.span
                className="title-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                Pro
              </motion.span>
            </motion.div>
            <motion.p
              className="popup-description"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              强大且灵活的网页文本复制工具
            </motion.p>
          </div>
        </div>

        <motion.div
          className="theme-toggle-wrapper"
          whileHover={{ rotate: 15 }}
          whileTap={{ scale: 0.95 }}
        >
          <ThemeToggle />
        </motion.div>
      </div>

      <motion.div
        className="header-decoration"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.header>
  );
}
