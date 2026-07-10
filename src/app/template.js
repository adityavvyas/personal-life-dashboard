'use client';
import { motion } from 'framer-motion';

export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ 
        type: 'spring', 
        stiffness: 260, 
        damping: 20, 
        mass: 1 
      }}
      style={{ minHeight: '100%', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
}
