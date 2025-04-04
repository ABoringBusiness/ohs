import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FadeTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  duration?: number;
  delay?: number;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  isVisible,
  duration = 0.3,
  delay = 0
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, delay }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};