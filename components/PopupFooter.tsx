import { IconBrandGithub, IconHeart, IconVersions } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { fadeAnimation } from "~/utils/animations";
import "~/styles/components/PopupFooter.scss";
import { version } from "~/package.json";

export function PopupFooter() {
  return (
    <footer className="popup-footer">
      <motion.div className="footer-content" variants={fadeAnimation}>
        <div className="footer-left">
          <IconVersions size={16} />
          <span className="version-info">v{version}</span>
        </div>

        <div className="footer-center">
          <span className="made-with">
            Made with <IconHeart size={14} className="heart-icon" /> by
            <a
              href="https://github.com/flower0wine"
              target="_blank"
              rel="noopener noreferrer">
              flowerwine
            </a>
          </span>
        </div>

        <motion.div
          className="footer-right"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          <a
            href="https://github.com/flower0wine/nice"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="访问 GitHub 仓库">
            <IconBrandGithub size={18} />
            <span>GitHub</span>
          </a>
        </motion.div>
      </motion.div>
    </footer>
  );
}
