import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAPPIER_WIDGET_ID = "wd_01jxpzftx6e3ntsgzwtgbze71c";

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  // Dynamically load the Dappier widget script when the chat is opened
  useEffect(() => {
    if (!isOpen) return;

    // Check if the script is already present
    if (!document.getElementById("dappier-widget-loader")) {
      const script = document.createElement("script");
      script.id = "dappier-widget-loader";
      script.src = "https://assets.dappier.com/widget/dappier-loader.min.js";
      script.async = true;
      script.setAttribute("widget-id", DAPPIER_WIDGET_ID);
      document.head.appendChild(script);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-lavender-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                MindMate AI Chat
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {/* Dappier Widget Embed */}
              <div
                id="dappier-ask-ai-widget"
                className="h-full flex items-center justify-center rounded-lg shadow-inner bg-white border border-gray-200"
              >
                <dappier-ask-ai-widget widgetid={DAPPIER_WIDGET_ID} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;
