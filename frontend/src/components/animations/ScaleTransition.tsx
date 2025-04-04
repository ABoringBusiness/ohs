import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScaleTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  duration?: number;
  delay?: number;
  initialScale?: number;
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  children,
  isVisible,
  duration = 0.3,
  delay = 0,
  initialScale = 0.95
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: initialScale, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: initialScale, opacity: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 25,
            duration, 
            delay 
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};