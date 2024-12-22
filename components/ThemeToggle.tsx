import { IconMoonFilled, IconSunFilled } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import "~/styles/components/ThemeToggle.scss";

const iconVariants = {
  initial: {
    scale: 0.5,
    opacity: 0,
    rotate: -180
  },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    scale: 0.5,
    opacity: 0,
    rotate: 180,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}>
      <div className="toggle-background" />
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            className="icon-wrapper moon"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit">
            <IconMoonFilled size={20} />
            <div className="stars">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`star star-${i + 1}`} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            className="icon-wrapper sun"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit">
            <IconSunFilled size={20} />
            <div className="rays">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`ray ray-${i + 1}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
