import { motion, AnimatePresence } from 'motion/react';
import { Plus, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface FloatingActionButtonProps {
  onUploadClick: () => void;
}

export function FloatingActionButton({ onUploadClick }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => {
                  onUploadClick();
                  setIsOpen(false);
                }}
                className="glass-card shadow-lg border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-2xl px-6 py-6 h-auto"
                variant="outline"
              >
                <Upload className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300">Upload CSV</span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/50 flex items-center justify-center text-white hover:shadow-purple-500/70 transition-shadow"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
        </motion.div>
        
        {/* Glowing pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 opacity-50"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
          }}
        />
      </motion.button>
    </div>
  );
}
