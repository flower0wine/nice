import * as Dialog from "@radix-ui/react-dialog";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import "~/styles/components/AlertDialog.scss";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  content
}: AlertDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  className="alert-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  className="alert-content"
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                    y: 20,
                    x: "-50%",
                    translateY: "-50%"
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    x: "-50%",
                    translateY: "-50%",
                    transition: {
                      type: "spring",
                      duration: 0.5,
                      bounce: 0.3
                    }
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    y: 20,
                    x: "-50%",
                    translateY: "-50%",
                    transition: {
                      duration: 0.2
                    }
                  }}>
                  <motion.div
                    className="alert-title"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}>
                    <IconAlertTriangle size={20} stroke={1.5} />
                    {title}
                  </motion.div>
                  <motion.div
                    className="alert-description"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}>
                    {content}
                  </motion.div>
                  <Dialog.Close asChild>
                    <motion.button
                      className="alert-close"
                      onClick={onClose}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}>
                      <IconX size={18} />
                    </motion.button>
                  </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
