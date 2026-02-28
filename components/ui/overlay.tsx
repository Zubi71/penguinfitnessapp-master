"use client";

import React from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface OverlayProps {
  onClose?: () => void;
  isOpen?: boolean;
}

const Overlay: React.FC<OverlayProps> = ({ onClose, isOpen = true }) => {
  // Get or create a root element for the portal
  const portalRoot =
    typeof document !== "undefined"
      ? document.getElementById("overlay-root") || document.body
      : null;

  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.85, 0, 0.24, 1] }}
          className="fixed w-full h-full inset-0 bg-black/10 bg-opacity-50 backdrop-blur-md z-50 flex items-center justify-center"
          onClick={onClose}
        />
      )}
    </AnimatePresence>,
    portalRoot
  );
};

export default Overlay;
