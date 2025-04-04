import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Direction = 'left' | 'right' | 'up' | 'down';

interface SlideTransitionProps {
  children: ReactNode;
  isVisible: boolean;
  direction?: Direction;
  duration?: number;
  delay?: number;
  distance?: number;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  isVisible,
  direction = 'right',
  duration = 0.3,
  delay = 0,
  distance = 50
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -distance, opacity: 0 };
      case 'right': return { x: distance, opacity: 0 };
      case 'up': return { y: -distance, opacity: 0 };
      case 'down': return { y: distance, opacity: 0 };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={getInitialPosition()}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={getInitialPosition()}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
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